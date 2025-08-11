-- PerMeaTe Enterprise Row Level Security (RLS) Policies
-- Multi-tenant isolation with role-based access control
--
-- IMPORTANT: App middleware must run these commands per request:
-- SELECT set_config('app.current_tenant_id', <tenant_uuid>, true);
-- SELECT set_config('app.current_role', <role>, true);
-- SELECT set_config('app.current_user_id', <user_uuid>, true);

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE effort_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Tenants: Users can only access their own tenant
CREATE POLICY tenant_read_own ON tenants FOR SELECT
  USING (id = current_setting('app.current_tenant_id', true)::uuid);

-- Helper function for role-based access control
CREATE OR REPLACE FUNCTION has_role(allowed_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN current_setting('app.current_role', true) = ANY(allowed_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY tenant_isolation_select ON users FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY users_admin_insert ON users FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
              AND has_role(ARRAY['admin']));

CREATE POLICY users_admin_update ON users FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin']))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY users_admin_delete ON users FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin']));

-- Goals table policies
CREATE POLICY tenant_isolation_select ON goals FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY goals_leaders_insert ON goals FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
              AND has_role(ARRAY['admin', 'org_leader', 'functional_leader']));

CREATE POLICY goals_leaders_update ON goals FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin', 'org_leader', 'functional_leader']))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY goals_admin_delete ON goals FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin']));

-- Projects table policies
CREATE POLICY tenant_isolation_select ON projects FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY projects_managers_insert ON projects FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
              AND has_role(ARRAY['admin', 'org_leader', 'functional_leader', 'project_lead']));

CREATE POLICY projects_managers_update ON projects FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin', 'org_leader', 'functional_leader', 'project_lead']))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY projects_admin_delete ON projects FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin']));

-- Tasks table policies
CREATE POLICY tenant_isolation_select ON tasks FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tasks_managers_insert ON tasks FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
              AND has_role(ARRAY['admin', 'org_leader', 'functional_leader', 'project_lead']));

CREATE POLICY tasks_managers_update ON tasks FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin', 'org_leader', 'functional_leader', 'project_lead']))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Team members can update status and scores on their assigned tasks
CREATE POLICY tasks_assignee_update ON tasks FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND assignee_id = current_setting('app.current_user_id', true)::uuid
         AND has_role(ARRAY['team_member']));

CREATE POLICY tasks_admin_delete ON tasks FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin']));

-- Billing subscriptions policies
CREATE POLICY tenant_isolation_select ON billing_subscriptions FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY billing_admin_mod ON billing_subscriptions FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
              AND has_role(ARRAY['admin']));

CREATE POLICY billing_admin_update ON billing_subscriptions FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin']))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY billing_admin_delete ON billing_subscriptions FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin']));

-- Tenant settings policies
CREATE POLICY tenant_isolation_select ON tenant_settings FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_settings_admin_mod ON tenant_settings FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
              AND has_role(ARRAY['admin']));

CREATE POLICY tenant_settings_admin_update ON tenant_settings FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin']))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_settings_admin_delete ON tenant_settings FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin']));

-- Skills policies (standard tenant isolation)
CREATE POLICY tenant_isolation_select ON skills FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_mod ON skills FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON skills FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON skills FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- User skills policies
CREATE POLICY tenant_isolation_select ON user_skills FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_mod ON user_skills FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON user_skills FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON user_skills FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Assignments policies
CREATE POLICY tenant_isolation_select ON assignments FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_mod ON assignments FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON assignments FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON assignments FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Effort estimates policies
CREATE POLICY tenant_isolation_select ON effort_estimates FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_mod ON effort_estimates FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON effort_estimates FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON effort_estimates FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Work items policies
CREATE POLICY tenant_isolation_select ON work_items FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_mod ON work_items FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON work_items FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON work_items FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Scores policies
CREATE POLICY tenant_isolation_select ON scores FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_mod ON scores FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON scores FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON scores FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Score iterations policies
CREATE POLICY tenant_isolation_select ON score_iterations FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_mod ON score_iterations FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON score_iterations FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON score_iterations FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Audit logs policies (read-only for most users)
CREATE POLICY tenant_isolation_select ON audit_logs FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_mod ON audit_logs FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- No update/delete on audit logs for data integrity

-- Usage events policies
CREATE POLICY tenant_isolation_select ON usage_events FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_mod ON usage_events FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_update ON usage_events FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_delete ON usage_events FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Invitations policies
CREATE POLICY tenant_isolation_select ON invitations FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY invitations_admin_mod ON invitations FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
              AND has_role(ARRAY['admin', 'org_leader']));

CREATE POLICY invitations_admin_update ON invitations FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin', 'org_leader']))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY invitations_admin_delete ON invitations FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid 
         AND has_role(ARRAY['admin', 'org_leader']));