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

-- Helper function for role-based access control
CREATE OR REPLACE FUNCTION has_role(allowed_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN current_setting('app.current_role', true) = ANY(allowed_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants: Users can only access their own tenant
DROP POLICY IF EXISTS tenant_read_own ON tenants;
CREATE POLICY tenant_read_own ON tenants FOR SELECT
  USING (id::text = current_setting('app.current_tenant_id', true));

-- Standard tenant isolation policies for most tables
CREATE OR REPLACE FUNCTION create_tenant_policies(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_select ON %I', table_name);
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_mod ON %I', table_name);
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON %I', table_name);
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON %I', table_name);
  
  EXECUTE format('CREATE POLICY tenant_isolation_select ON %I FOR SELECT
    USING (tenant_id::text = current_setting(''app.current_tenant_id'', true))', table_name);
  
  EXECUTE format('CREATE POLICY tenant_isolation_mod ON %I FOR INSERT
    WITH CHECK (tenant_id::text = current_setting(''app.current_tenant_id'', true))', table_name);
  
  EXECUTE format('CREATE POLICY tenant_isolation_update ON %I FOR UPDATE
    USING (tenant_id::text = current_setting(''app.current_tenant_id'', true))
    WITH CHECK (tenant_id::text = current_setting(''app.current_tenant_id'', true))', table_name);
  
  EXECUTE format('CREATE POLICY tenant_isolation_delete ON %I FOR DELETE
    USING (tenant_id::text = current_setting(''app.current_tenant_id'', true))', table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply standard tenant policies to most tables
SELECT create_tenant_policies('skills');
SELECT create_tenant_policies('user_skills');
SELECT create_tenant_policies('assignments');
SELECT create_tenant_policies('effort_estimates');
SELECT create_tenant_policies('work_items');
SELECT create_tenant_policies('scores');
SELECT create_tenant_policies('score_iterations');
SELECT create_tenant_policies('usage_events');

-- Users table policies (admin only for modifications)
DROP POLICY IF EXISTS tenant_isolation_select ON users;
DROP POLICY IF EXISTS users_admin_insert ON users;
DROP POLICY IF EXISTS users_admin_update ON users;
DROP POLICY IF EXISTS users_admin_delete ON users;

CREATE POLICY tenant_isolation_select ON users FOR SELECT
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY users_admin_insert ON users FOR INSERT
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true) 
              AND has_role(ARRAY['admin']));

CREATE POLICY users_admin_update ON users FOR UPDATE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin']))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY users_admin_delete ON users FOR DELETE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin']));

-- Goals table policies (leaders can modify)
DROP POLICY IF EXISTS tenant_isolation_select ON goals;
DROP POLICY IF EXISTS goals_leaders_insert ON goals;
DROP POLICY IF EXISTS goals_leaders_update ON goals;
DROP POLICY IF EXISTS goals_admin_delete ON goals;

CREATE POLICY tenant_isolation_select ON goals FOR SELECT
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY goals_leaders_insert ON goals FOR INSERT
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true) 
              AND has_role(ARRAY['admin', 'org_leader', 'functional_leader']));

CREATE POLICY goals_leaders_update ON goals FOR UPDATE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin', 'org_leader', 'functional_leader']))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY goals_admin_delete ON goals FOR DELETE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin']));

-- Projects table policies (managers can modify)
DROP POLICY IF EXISTS tenant_isolation_select ON projects;
DROP POLICY IF EXISTS projects_managers_insert ON projects;
DROP POLICY IF EXISTS projects_managers_update ON projects;
DROP POLICY IF EXISTS projects_admin_delete ON projects;

CREATE POLICY tenant_isolation_select ON projects FOR SELECT
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY projects_managers_insert ON projects FOR INSERT
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true) 
              AND has_role(ARRAY['admin', 'org_leader', 'functional_leader', 'project_lead']));

CREATE POLICY projects_managers_update ON projects FOR UPDATE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin', 'org_leader', 'functional_leader', 'project_lead']))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY projects_admin_delete ON projects FOR DELETE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin']));

-- Tasks table policies (managers and assignees can modify)
DROP POLICY IF EXISTS tenant_isolation_select ON tasks;
DROP POLICY IF EXISTS tasks_managers_insert ON tasks;
DROP POLICY IF EXISTS tasks_managers_update ON tasks;
DROP POLICY IF EXISTS tasks_assignee_update ON tasks;
DROP POLICY IF EXISTS tasks_admin_delete ON tasks;

CREATE POLICY tenant_isolation_select ON tasks FOR SELECT
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tasks_managers_insert ON tasks FOR INSERT
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true) 
              AND has_role(ARRAY['admin', 'org_leader', 'functional_leader', 'project_lead']));

CREATE POLICY tasks_managers_update ON tasks FOR UPDATE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin', 'org_leader', 'functional_leader', 'project_lead']))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tasks_assignee_update ON tasks FOR UPDATE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND assignee_id::text = current_setting('app.current_user_id', true)
         AND has_role(ARRAY['team_member']));

CREATE POLICY tasks_admin_delete ON tasks FOR DELETE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin']));

-- Admin-only tables (billing, settings)
DROP POLICY IF EXISTS tenant_isolation_select ON billing_subscriptions;
DROP POLICY IF EXISTS billing_admin_mod ON billing_subscriptions;
DROP POLICY IF EXISTS billing_admin_update ON billing_subscriptions;
DROP POLICY IF EXISTS billing_admin_delete ON billing_subscriptions;

CREATE POLICY tenant_isolation_select ON billing_subscriptions FOR SELECT
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY billing_admin_mod ON billing_subscriptions FOR INSERT
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true) 
              AND has_role(ARRAY['admin']));

CREATE POLICY billing_admin_update ON billing_subscriptions FOR UPDATE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin']))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY billing_admin_delete ON billing_subscriptions FOR DELETE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin']));

-- Tenant settings (admin only)
DROP POLICY IF EXISTS tenant_isolation_select ON tenant_settings;
DROP POLICY IF EXISTS tenant_settings_admin_mod ON tenant_settings;
DROP POLICY IF EXISTS tenant_settings_admin_update ON tenant_settings;
DROP POLICY IF EXISTS tenant_settings_admin_delete ON tenant_settings;

CREATE POLICY tenant_isolation_select ON tenant_settings FOR SELECT
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_settings_admin_mod ON tenant_settings FOR INSERT
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true) 
              AND has_role(ARRAY['admin']));

CREATE POLICY tenant_settings_admin_update ON tenant_settings FOR UPDATE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin']))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_settings_admin_delete ON tenant_settings FOR DELETE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin']));

-- Audit logs (insert only)
DROP POLICY IF EXISTS tenant_isolation_select ON audit_logs;
DROP POLICY IF EXISTS tenant_isolation_mod ON audit_logs;

CREATE POLICY tenant_isolation_select ON audit_logs FOR SELECT
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_mod ON audit_logs FOR INSERT
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Invitations (admin/org_leader can manage)
DROP POLICY IF EXISTS tenant_isolation_select ON invitations;
DROP POLICY IF EXISTS invitations_admin_mod ON invitations;
DROP POLICY IF EXISTS invitations_admin_update ON invitations;
DROP POLICY IF EXISTS invitations_admin_delete ON invitations;

CREATE POLICY tenant_isolation_select ON invitations FOR SELECT
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY invitations_admin_mod ON invitations FOR INSERT
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true) 
              AND has_role(ARRAY['admin', 'org_leader']));

CREATE POLICY invitations_admin_update ON invitations FOR UPDATE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin', 'org_leader']))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY invitations_admin_delete ON invitations FOR DELETE
  USING (tenant_id::text = current_setting('app.current_tenant_id', true) 
         AND has_role(ARRAY['admin', 'org_leader']));

-- Drop helper function
DROP FUNCTION IF EXISTS create_tenant_policies(text);