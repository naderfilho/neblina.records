-- =============================================================================
-- BLOCO 3 — Contenção de flood em public.site_visits
--
-- DECISÃO: opção (b) — job de poda mantendo apenas os últimos 180 dias.
--
-- Por que (b) e não (a) (deduplicação por janela de tempo na função):
--   * site_visits só tem (id, path, created_at) — NÃO existe identificador de
--     visitante (IP, session, user_id). Deduplicar "por path dentro de uma
--     janela" colapsaria visitantes DIFERENTES na mesma linha: 10 pessoas
--     abrindo "/" no mesmo minuto contariam como 1 visita. Isso distorce
--     visit_stats_daily/hourly/weekday e viola a regra de não alterar o
--     comportamento funcional.
--   * A opção (b) não muda a semântica de nada: cada chamada continua
--     inserindo 1 linha; o job apenas limita o horizonte de retenção — e as
--     funções de estatística já olham no máximo 30 dias por default, então
--     180 dias de retenção não afeta nenhum relatório existente.
--   * Um flood continua possível em teoria, mas o dano fica limitado no tempo
--     (a tabela nunca cresce além de 180 dias) e a linha é minúscula
--     (bigint + text<=200 + timestamptz). Rate limiting real por IP deve ser
--     feito na borda (Vercel/middleware), não no banco.
--
-- O job roda todo dia às 03:30 UTC (00:30 em São Paulo). A primeira execução
-- já poda o histórico com mais de 180 dias — NADA é apagado no momento em que
-- esta migration é aplicada.
--
-- Idempotente: unschedule condicional antes do schedule; índice com IF NOT
-- EXISTS.
--
-- ROLLBACK (executar manualmente para reverter):
--   -- select cron.unschedule('prune_site_visits_180d');
--   -- drop index if exists public.site_visits_created_at_idx;
--   -- (opcional, só se nada mais usar cron: drop extension pg_cron;)
-- =============================================================================

-- pg_cron 1.6.4 está disponível no projeto, mas ainda não instalado.
create extension if not exists pg_cron;

-- Índice de apoio: a poda deleta por created_at e as funções visit_stats_*
-- filtram por created_at — sem índice, ambos viram seq scan quando a tabela
-- crescer.
create index if not exists site_visits_created_at_idx
  on public.site_visits (created_at);

-- (Re)agenda o job de forma idempotente.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'prune_site_visits_180d') then
    perform cron.unschedule('prune_site_visits_180d');
  end if;
end
$$;

select cron.schedule(
  'prune_site_visits_180d',
  '30 3 * * *',
  $job$ delete from public.site_visits where created_at < now() - interval '180 days' $job$
);

-- Verificação (rodar manualmente após aplicar):
--   select jobname, schedule, command, active from cron.job
--    where jobname = 'prune_site_visits_180d';
--   -- e no dia seguinte:
--   select * from cron.job_run_details
--    order by start_time desc limit 5;
