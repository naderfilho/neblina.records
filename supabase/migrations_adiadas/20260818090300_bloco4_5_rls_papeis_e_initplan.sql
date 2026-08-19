-- =============================================================================
-- BLOCOS 4 + 5 — Escopo de papel nas políticas de RLS + cache de InitPlan
--
-- (Blocos unificados de propósito: os dois reescrevem as MESMAS 41 políticas;
--  em arquivos separados cada política seria dropada/recriada duas vezes.)
--
-- Bloco 4 — cada política sai de TO public e vai para o papel correto:
--   * Leitura pública            -> TO anon, authenticated
--   * INSERT de formulário       -> TO anon, authenticated
--     (event_requests, sale_proposals)
--   * Dono / admin               -> TO authenticated
--
-- Bloco 5 — is_admin() e auth.uid() embrulhados em subconsulta para o planner
-- avaliar 1x por statement (InitPlan) em vez de 1x por linha:
--   is_admin()  -> (select public.is_admin())
--   auth.uid()  -> (select auth.uid())
-- As expressões USING/WITH CHECK são idênticas às originais fora isso.
--
-- >>> NOTA (desvio consciente): coupons_read fica TO anon, authenticated. <<<
-- A política original permite a QUALQUER visitante ler cupons genéricos
-- ativos (user_id IS NULL AND is_active). Mandar essa política para
-- TO authenticated cortaria essa leitura anônima e mudaria o comportamento
-- do site. Para manter as permissões efetivas idênticas, anon continua.
--
-- Observação: o levantamento em pg_policies encontrou 41 políticas (o linter
-- fala em 40). Todas as 41 estão cobertas abaixo.
--
-- Idempotente: DROP POLICY IF EXISTS + CREATE POLICY.
--
-- =============================================================================
-- ROLLBACK COMPLETO (estado original: TO public, expressões sem subconsulta).
-- Para reverter, rode DROP POLICY IF EXISTS de cada política e recrie com:
--
-- create policy admin_emails_admin_all on public.admin_emails for all using (is_admin()) with check (is_admin());
-- create policy ai_usage_admin_insert on public.ai_usage for insert with check (is_admin());
-- create policy ai_usage_admin_read on public.ai_usage for select using (is_admin());
-- create policy audit_admin_read on public.audit_log for select using (is_admin());
-- create policy box_records_admin_write on public.box_records for all using (is_admin()) with check (is_admin());
-- create policy box_records_public_read on public.box_records for select using (true);
-- create policy boxes_admin_write on public.boxes for all using (is_admin()) with check (is_admin());
-- create policy boxes_public_read on public.boxes for select using (is_published or is_admin());
-- create policy cart_intents_admin_read on public.cart_intents for select using (is_admin());
-- create policy cart_intents_own on public.cart_intents for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- create policy comments_auth_insert on public.comments for insert with check (auth.uid() = user_id);
-- create policy comments_delete_own_or_admin on public.comments for delete using ((user_id = auth.uid()) or is_admin());
-- create policy comments_public_read on public.comments for select using (true);
-- create policy coupons_admin_write on public.coupons for all using (is_admin()) with check (is_admin());
-- create policy coupons_read on public.coupons for select using ((user_id = auth.uid()) or ((user_id is null) and is_active) or is_admin());
-- create policy event_requests_admin_read on public.event_requests for select using (is_admin());
-- create policy event_requests_admin_update on public.event_requests for update using (is_admin());
-- create policy event_requests_insert_any on public.event_requests for insert with check (true);
-- create policy favorites_admin_read on public.favorites for select using (is_admin());
-- create policy favorites_own on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- create policy notifications_admin_insert on public.notifications for insert with check (is_admin());
-- create policy notifications_delete_own on public.notifications for delete using ((user_id = auth.uid()) or is_admin());
-- create policy notifications_select_own on public.notifications for select using ((user_id = auth.uid()) or is_admin());
-- create policy notifications_update_own on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- create policy profiles_select_own_or_admin on public.profiles for select using ((id = auth.uid()) or is_admin());
-- create policy profiles_update_own_or_admin on public.profiles for update using ((id = auth.uid()) or is_admin());
-- create policy record_photos_admin_write on public.record_photos for all using (is_admin()) with check (is_admin());
-- create policy record_photos_public_read on public.record_photos for select using (true);
-- create policy records_admin_write on public.records for all using (is_admin()) with check (is_admin());
-- create policy records_public_read on public.records for select using (is_published or is_admin() or (exists (select 1 from box_records br join boxes bx on bx.id = br.box_id where br.record_id = records.id and bx.is_published)));
-- create policy sale_proposals_admin_delete on public.sale_proposals for delete using (is_admin());
-- create policy sale_proposals_admin_read on public.sale_proposals for select using (is_admin());
-- create policy sale_proposals_admin_update on public.sale_proposals for update using (is_admin()) with check (is_admin());
-- create policy sale_proposals_insert_any on public.sale_proposals for insert with check (true);
-- create policy site_settings_admin_write on public.site_settings for all using (is_admin()) with check (is_admin());
-- create policy site_settings_public_read on public.site_settings for select using (true);
-- create policy site_visits_admin_read on public.site_visits for select using (is_admin());
-- create policy store_events_admin_write on public.store_events for all using (is_admin()) with check (is_admin());
-- create policy store_events_public_read on public.store_events for select using (is_published or is_admin());
-- create policy tags_admin_write on public.tags for all using (is_admin()) with check (is_admin());
-- create policy tags_public_read on public.tags for select using (true);
-- =============================================================================

-- ============================== admin_emails ================================
drop policy if exists admin_emails_admin_all on public.admin_emails;
create policy admin_emails_admin_all on public.admin_emails
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ================================ ai_usage ==================================
drop policy if exists ai_usage_admin_insert on public.ai_usage;
create policy ai_usage_admin_insert on public.ai_usage
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists ai_usage_admin_read on public.ai_usage;
create policy ai_usage_admin_read on public.ai_usage
  for select to authenticated
  using ((select public.is_admin()));

-- ================================ audit_log =================================
drop policy if exists audit_admin_read on public.audit_log;
create policy audit_admin_read on public.audit_log
  for select to authenticated
  using ((select public.is_admin()));

-- =============================== box_records ================================
drop policy if exists box_records_admin_write on public.box_records;
create policy box_records_admin_write on public.box_records
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists box_records_public_read on public.box_records;
create policy box_records_public_read on public.box_records
  for select to anon, authenticated
  using (true);

-- ================================== boxes ===================================
drop policy if exists boxes_admin_write on public.boxes;
create policy boxes_admin_write on public.boxes
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists boxes_public_read on public.boxes;
create policy boxes_public_read on public.boxes
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

-- =============================== cart_intents ===============================
drop policy if exists cart_intents_admin_read on public.cart_intents;
create policy cart_intents_admin_read on public.cart_intents
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists cart_intents_own on public.cart_intents;
create policy cart_intents_own on public.cart_intents
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ================================= comments =================================
drop policy if exists comments_auth_insert on public.comments;
create policy comments_auth_insert on public.comments
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists comments_delete_own_or_admin on public.comments;
create policy comments_delete_own_or_admin on public.comments
  for delete to authenticated
  using ((user_id = (select auth.uid())) or (select public.is_admin()));

drop policy if exists comments_public_read on public.comments;
create policy comments_public_read on public.comments
  for select to anon, authenticated
  using (true);

-- ================================= coupons ==================================
drop policy if exists coupons_admin_write on public.coupons;
create policy coupons_admin_write on public.coupons
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Fica em anon, authenticated de propósito: a expressão original já permite
-- visitante anônimo ler cupom genérico ativo (user_id is null and is_active).
drop policy if exists coupons_read on public.coupons;
create policy coupons_read on public.coupons
  for select to anon, authenticated
  using ((user_id = (select auth.uid())) or ((user_id is null) and is_active) or (select public.is_admin()));

-- ============================== event_requests ==============================
drop policy if exists event_requests_admin_read on public.event_requests;
create policy event_requests_admin_read on public.event_requests
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists event_requests_admin_update on public.event_requests;
create policy event_requests_admin_update on public.event_requests
  for update to authenticated
  using ((select public.is_admin()));

drop policy if exists event_requests_insert_any on public.event_requests;
create policy event_requests_insert_any on public.event_requests
  for insert to anon, authenticated
  with check (true);

-- ================================ favorites =================================
drop policy if exists favorites_admin_read on public.favorites;
create policy favorites_admin_read on public.favorites
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists favorites_own on public.favorites;
create policy favorites_own on public.favorites
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- =============================== notifications ==============================
drop policy if exists notifications_admin_insert on public.notifications;
create policy notifications_admin_insert on public.notifications
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated
  using ((user_id = (select auth.uid())) or (select public.is_admin()));

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using ((user_id = (select auth.uid())) or (select public.is_admin()));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ================================= profiles =================================
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using ((id = (select auth.uid())) or (select public.is_admin()));

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
  for update to authenticated
  using ((id = (select auth.uid())) or (select public.is_admin()));

-- =============================== record_photos ==============================
drop policy if exists record_photos_admin_write on public.record_photos;
create policy record_photos_admin_write on public.record_photos
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists record_photos_public_read on public.record_photos;
create policy record_photos_public_read on public.record_photos
  for select to anon, authenticated
  using (true);

-- ================================= records ==================================
drop policy if exists records_admin_write on public.records;
create policy records_admin_write on public.records
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists records_public_read on public.records;
create policy records_public_read on public.records
  for select to anon, authenticated
  using (
    is_published
    or (select public.is_admin())
    or (exists (
      select 1
        from box_records br
        join boxes bx on bx.id = br.box_id
       where br.record_id = records.id
         and bx.is_published
    ))
  );

-- ============================== sale_proposals ==============================
drop policy if exists sale_proposals_admin_delete on public.sale_proposals;
create policy sale_proposals_admin_delete on public.sale_proposals
  for delete to authenticated
  using ((select public.is_admin()));

drop policy if exists sale_proposals_admin_read on public.sale_proposals;
create policy sale_proposals_admin_read on public.sale_proposals
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists sale_proposals_admin_update on public.sale_proposals;
create policy sale_proposals_admin_update on public.sale_proposals
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists sale_proposals_insert_any on public.sale_proposals;
create policy sale_proposals_insert_any on public.sale_proposals
  for insert to anon, authenticated
  with check (true);

-- =============================== site_settings ==============================
drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated
  using (true);

-- ================================ site_visits ===============================
drop policy if exists site_visits_admin_read on public.site_visits;
create policy site_visits_admin_read on public.site_visits
  for select to authenticated
  using ((select public.is_admin()));

-- =============================== store_events ===============================
drop policy if exists store_events_admin_write on public.store_events;
create policy store_events_admin_write on public.store_events
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists store_events_public_read on public.store_events;
create policy store_events_public_read on public.store_events
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

-- ================================== tags ====================================
drop policy if exists tags_admin_write on public.tags;
create policy tags_admin_write on public.tags
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists tags_public_read on public.tags;
create policy tags_public_read on public.tags
  for select to anon, authenticated
  using (true);

-- Verificação (rodar manualmente após aplicar):
--   select tablename, policyname, roles, cmd from pg_policies
--    where schemaname = 'public' order by tablename, policyname;
--   -- esperado: nenhuma política com roles = {public};
--   -- 41 políticas no total, mesmas expressões com (select ...) nos wrappers.
