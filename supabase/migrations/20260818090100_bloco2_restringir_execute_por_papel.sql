-- =============================================================================
-- BLOCO 2 — Restringir EXECUTE por papel (padrão: REVOKE FROM PUBLIC + GRANT
-- explícito apenas para quem precisa)
--
-- Alvo:
--   * Somente authenticated: log_action, broadcast_notification,
--     set_records_order, touch_last_login, records_with_audio
--   * anon + authenticated: increment_record_views, increment_box_views,
--     log_site_visit
--   * is_admin: ver EXCEÇÃO abaixo
--
-- >>> EXCEÇÃO DOCUMENTADA (desvio consciente do plano original) <<<
-- is_admin() NÃO pode perder EXECUTE de anon. As políticas de RLS de leitura
-- pública (boxes_public_read, records_public_read, store_events_public_read,
-- coupons_read) chamam is_admin() dentro do USING, e expressões de RLS são
-- avaliadas com os privilégios do papel que faz a consulta. Se anon perder
-- EXECUTE em is_admin(), QUALQUER SELECT anônimo nessas tabelas falha com
-- "permission denied for function is_admin" — o catálogo público inteiro sai
-- do ar. Para anon a função é inofensiva: auth.uid() é NULL e ela sempre
-- retorna false. Portanto: is_admin fica com GRANT para anon E authenticated.
--
-- service_role mantém grant explícito em tudo (bypassa RLS e é usado por
-- rotinas de servidor).
--
-- Idempotente: REVOKE/GRANT repetidos são no-ops.
--
-- ROLLBACK (estado original dos grants, executar manualmente para reverter):
--   -- is_admin: PUBLIC, anon, authenticated, postgres, service_role
--   -- grant execute on function public.is_admin() to PUBLIC;
--   -- log_action: PUBLIC, authenticated, postgres, service_role
--   -- grant execute on function public.log_action(text,text,uuid,text,jsonb) to PUBLIC;
--   -- broadcast_notification: authenticated, postgres, service_role (sem PUBLIC)
--   -- set_records_order: authenticated, postgres, service_role (sem PUBLIC)
--   -- records_with_audio: authenticated, postgres, service_role (sem PUBLIC)
--   -- touch_last_login: PUBLIC, authenticated, postgres, service_role
--   -- grant execute on function public.touch_last_login() to PUBLIC;
--   -- increment_record_views: PUBLIC, anon, authenticated, postgres, service_role
--   -- grant execute on function public.increment_record_views(uuid) to PUBLIC;
--   -- increment_box_views: PUBLIC, anon, authenticated, postgres, service_role
--   -- grant execute on function public.increment_box_views(uuid) to PUBLIC;
--   -- log_site_visit: PUBLIC, anon, authenticated, postgres, service_role
--   -- grant execute on function public.log_site_visit(text) to PUBLIC;
-- =============================================================================

-- ---------------------------------------------------------------------------
-- is_admin(): remove o grant genérico de PUBLIC, mas mantém anon (ver EXCEÇÃO
-- no cabeçalho) e authenticated.
-- ---------------------------------------------------------------------------
revoke execute on function public.is_admin() from PUBLIC;
grant  execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Somente authenticated
-- ---------------------------------------------------------------------------
revoke execute on function public.log_action(text, text, uuid, text, jsonb) from PUBLIC, anon;
grant  execute on function public.log_action(text, text, uuid, text, jsonb) to authenticated, service_role;

revoke execute on function public.broadcast_notification(text, text, text, text, uuid) from PUBLIC, anon;
grant  execute on function public.broadcast_notification(text, text, text, text, uuid) to authenticated, service_role;

revoke execute on function public.set_records_order(uuid[]) from PUBLIC, anon;
grant  execute on function public.set_records_order(uuid[]) to authenticated, service_role;

revoke execute on function public.touch_last_login() from PUBLIC, anon;
grant  execute on function public.touch_last_login() to authenticated, service_role;

revoke execute on function public.records_with_audio() from PUBLIC, anon;
grant  execute on function public.records_with_audio() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- anon + authenticated (RPCs públicos intencionais)
-- ---------------------------------------------------------------------------
revoke execute on function public.increment_record_views(uuid) from PUBLIC;
grant  execute on function public.increment_record_views(uuid) to anon, authenticated, service_role;

revoke execute on function public.increment_box_views(uuid) from PUBLIC;
grant  execute on function public.increment_box_views(uuid) to anon, authenticated, service_role;

revoke execute on function public.log_site_visit(text) from PUBLIC;
grant  execute on function public.log_site_visit(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- OPCIONAL (comentado de propósito): impedir que FUNÇÕES FUTURAS nasçam com
-- EXECUTE para PUBLIC/anon/authenticated por default privilege. Descomente
-- apenas se aceitar que toda função nova precisará de GRANT explícito:
--
-- alter default privileges in schema public revoke execute on functions from PUBLIC;
-- alter default privileges in schema public revoke execute on functions from anon;
-- alter default privileges in schema public revoke execute on functions from authenticated;
-- ---------------------------------------------------------------------------

-- Verificação (rodar manualmente após aplicar):
--   select routine_name, grantee from information_schema.routine_privileges
--    where routine_schema = 'public' and privilege_type = 'EXECUTE'
--      and grantee in ('PUBLIC', 'anon', 'authenticated')
--    order by routine_name, grantee;
