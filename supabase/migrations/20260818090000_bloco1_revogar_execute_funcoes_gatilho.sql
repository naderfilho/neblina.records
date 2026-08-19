-- =============================================================================
-- BLOCO 1 — Revogar EXECUTE (RPC) de funções de gatilho
--
-- handle_new_user() é função de trigger (auth.users) e rls_auto_enable() é
-- função de event trigger. Nenhuma delas deve ficar exposta como RPC via
-- PostgREST (/rest/v1/rpc/...).
--
-- Por que isso não quebra nada:
--   * O trigger em auth.users dispara a função como SECURITY DEFINER; a
--     checagem de EXECUTE acontece na criação do trigger, não a cada disparo.
--     Revogar o grant dos papéis de API não afeta o funcionamento do trigger.
--   * O event trigger roda com privilégio de superusuário/owner — idem.
--   * postgres (owner) e service_role têm grants EXPLÍCITOS que não são
--     tocados pelos REVOKEs abaixo.
--
-- Idempotente: REVOKE de grant inexistente é no-op.
--
-- ROLLBACK (executar manualmente para reverter ao estado original):
--   -- estado original: grantees = PUBLIC, postgres, service_role
--   -- (anon/authenticated herdavam apenas via PUBLIC)
--   -- grant execute on function public.handle_new_user() to PUBLIC;
--   -- grant execute on function public.rls_auto_enable() to PUBLIC;
-- =============================================================================

revoke execute on function public.handle_new_user() from PUBLIC, anon, authenticated;
revoke execute on function public.rls_auto_enable() from PUBLIC, anon, authenticated;

-- Verificação (rodar manualmente após aplicar):
--   select grantee, privilege_type from information_schema.routine_privileges
--    where routine_schema = 'public'
--      and routine_name in ('handle_new_user', 'rls_auto_enable');
--   -- esperado: apenas postgres e service_role
