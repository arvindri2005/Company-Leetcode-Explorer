-- =============================================
-- SUPABASE DATABASE SCHEMA WITH SECURITY
-- =============================================
-- This file includes:
-- 1. Core table definitions
-- 2. Row Level Security (RLS) policies
-- 3. Admin access system
-- 4. Audit logging for tracking changes
-- 5. Rate limiting
-- 6. Security functions
-- =============================================

-- =============================================
-- CORE TABLES
-- =============================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  uid UUID PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT,
  website TEXT,
  slug TEXT UNIQUE,
  logo TEXT,
  problem_count INTEGER DEFAULT 0,
  stats_last_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  normalized_title TEXT,
  slug TEXT UNIQUE,
  url TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  tags JSONB,
  created_at BIGINT,
  updated_at BIGINT
);

-- Create company_problems junction table
CREATE TABLE IF NOT EXISTS company_problems (
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  problem_id TEXT REFERENCES problems(id) ON DELETE CASCADE,
  last_asked_period TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (company_id, problem_id)
);

-- Create company_stats table
CREATE TABLE IF NOT EXISTS company_stats (
  company_id TEXT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  last_30_days INTEGER DEFAULT 0,
  within_3_months INTEGER DEFAULT 0,
  within_6_months INTEGER DEFAULT 0,
  older_than_6_months INTEGER DEFAULT 0,
  easy_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  hard_count INTEGER DEFAULT 0
);

-- Create company_tags table
CREATE TABLE IF NOT EXISTS company_tags (
  id SERIAL PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(company_id, tag)
);

-- Create related_companies table
CREATE TABLE IF NOT EXISTS related_companies (
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  related_company_id TEXT,
  PRIMARY KEY (company_id, related_company_id)
);

-- Create user_bookmarks table
CREATE TABLE IF NOT EXISTS user_bookmarks (
  uid UUID REFERENCES users(uid) ON DELETE CASCADE,
  problem_id TEXT REFERENCES problems(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (uid, problem_id)
);

-- Create user_problem_status table
CREATE TABLE IF NOT EXISTS user_problem_status (
  uid UUID REFERENCES users(uid) ON DELETE CASCADE,
  problem_id TEXT REFERENCES problems(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'solved', 'reviewed', 'attempted')) NOT NULL,
  attempts INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  solved_at TIMESTAMPTZ,
  solution_notes TEXT,
  code_snippets JSONB DEFAULT '[]'::jsonb,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (uid, problem_id)
);

-- Create user_education table
CREATE TABLE IF NOT EXISTS user_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID REFERENCES users(uid) ON DELETE CASCADE,
  school TEXT NOT NULL,
  degree TEXT,
  field_of_study TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  grade TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_work_experience table
CREATE TABLE IF NOT EXISTS user_work_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID REFERENCES users(uid) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  description TEXT,
  technologies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_strategies table
CREATE TABLE IF NOT EXISTS user_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID REFERENCES users(uid) ON DELETE CASCADE,
  company_id TEXT,
  company_name TEXT NOT NULL,
  preparation_strategy TEXT,
  focus_topics JSONB DEFAULT '[]'::jsonb,
  todo_items JSONB DEFAULT '[]'::jsonb,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADMIN SYSTEM
-- =============================================

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  uid UUID PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('super_admin', 'moderator')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE uid = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- AUDIT LOGGING SYSTEM
-- =============================================

-- Create audit_logs table to track all changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Generic audit logging function
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', row_to_json(OLD), auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User-specific audit logging (for tables with uid instead of id)
CREATE OR REPLACE FUNCTION audit_log_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  record_identifier TEXT;
BEGIN
  -- Determine record identifier based on table structure
  IF TG_TABLE_NAME IN ('user_bookmarks', 'user_problem_status') THEN
    record_identifier := COALESCE(OLD.uid::text, NEW.uid::text) || '_' || COALESCE(OLD.problem_id, NEW.problem_id);
  ELSIF TG_TABLE_NAME = 'users' THEN
    record_identifier := COALESCE(OLD.uid::text, NEW.uid::text);
  ELSE
    record_identifier := COALESCE(OLD.id::text, NEW.id::text);
  END IF;

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, record_identifier, 'DELETE', row_to_json(OLD), auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, record_identifier, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, record_identifier, 'INSERT', row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SECURITY ACTIVITY TRACKING
-- =============================================

-- Track login attempts and suspicious activity
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'login_success', 'login_failed', 'password_reset', 'suspicious_activity'
  uid UUID REFERENCES users(uid) ON DELETE SET NULL,
  email TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_uid ON security_events(uid);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING GIN (preferences);
CREATE INDEX IF NOT EXISTS idx_company_problems_company ON company_problems(company_id);
CREATE INDEX IF NOT EXISTS idx_company_problems_problem ON company_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_company_problems_period ON company_problems(last_asked_period);
CREATE INDEX IF NOT EXISTS idx_company_tags_company ON company_tags(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tags_tag ON company_tags(tag);
CREATE INDEX IF NOT EXISTS idx_problems_tags ON problems USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_uid ON user_bookmarks(uid);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_problem ON user_bookmarks(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_created ON user_bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_problem_status_uid ON user_problem_status(uid);
CREATE INDEX IF NOT EXISTS idx_user_problem_status_problem ON user_problem_status(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_problem_status_status ON user_problem_status(status);
CREATE INDEX IF NOT EXISTS idx_user_problem_status_solved ON user_problem_status(solved_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_education_uid ON user_education(uid);
CREATE INDEX IF NOT EXISTS idx_user_work_experience_uid ON user_work_experience(uid);
CREATE INDEX IF NOT EXISTS idx_user_strategies_uid ON user_strategies(uid);
CREATE INDEX IF NOT EXISTS idx_user_strategies_company ON user_strategies(company_id);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATE
-- =============================================

-- Update updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_problem_status_updated_at ON user_problem_status;
CREATE TRIGGER update_user_problem_status_updated_at
  BEFORE UPDATE ON user_problem_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_education_updated_at ON user_education;
CREATE TRIGGER update_user_education_updated_at
  BEFORE UPDATE ON user_education
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_work_experience_updated_at ON user_work_experience;
CREATE TRIGGER update_user_work_experience_updated_at
  BEFORE UPDATE ON user_work_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_strategies_updated_at ON user_strategies;
CREATE TRIGGER update_user_strategies_updated_at
  BEFORE UPDATE ON user_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AUDIT TRIGGERS
-- =============================================

-- Add audit logging to important tables
CREATE TRIGGER audit_companies_changes
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_problems_changes
  AFTER INSERT OR UPDATE OR DELETE ON problems
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_log_user_changes();

CREATE TRIGGER audit_user_problem_status_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_problem_status
  FOR EACH ROW EXECUTE FUNCTION audit_log_user_changes();

CREATE TRIGGER audit_user_strategies_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_strategies
  FOR EACH ROW EXECUTE FUNCTION audit_log_user_changes();

-- =============================================
-- RATE LIMITING
-- =============================================

-- Rate limit contact form submissions
CREATE OR REPLACE FUNCTION check_contact_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM contact_messages 
    WHERE email = NEW.email 
    AND created_at > NOW() - INTERVAL '1 hour'
  ) >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_rate_limit
  BEFORE INSERT ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION check_contact_rate_limit();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_problem_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE related_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - USER TABLES
-- =============================================

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = uid);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = uid);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = uid);

-- Users manage their own bookmarks
CREATE POLICY "Users manage own bookmarks" ON user_bookmarks
  FOR ALL USING (auth.uid() = uid);

-- Users manage their own problem status
CREATE POLICY "Users manage own problem status" ON user_problem_status
  FOR ALL USING (auth.uid() = uid);

-- Users manage their own education
CREATE POLICY "Users manage own education" ON user_education
  FOR ALL USING (auth.uid() = uid);

-- Users manage their own work experience
CREATE POLICY "Users manage own work experience" ON user_work_experience
  FOR ALL USING (auth.uid() = uid);

-- Users manage their own strategies
CREATE POLICY "Users manage own strategies" ON user_strategies
  FOR ALL USING (auth.uid() = uid);

-- =============================================
-- RLS POLICIES - PUBLIC READ TABLES
-- =============================================

-- Authenticated users can read company data
CREATE POLICY "Authenticated users can view companies" ON companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view problems" ON problems
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view company_problems" ON company_problems
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view company_stats" ON company_stats
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view company_tags" ON company_tags
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view related_companies" ON related_companies
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- RLS POLICIES - ADMIN WRITE ACCESS
-- =============================================

-- Admins can manage companies
CREATE POLICY "Admins can manage companies" ON companies
  FOR ALL USING (is_admin(auth.uid()));

-- Admins can manage problems
CREATE POLICY "Admins can manage problems" ON problems
  FOR ALL USING (is_admin(auth.uid()));

-- Admins can manage company_problems
CREATE POLICY "Admins can manage company_problems" ON company_problems
  FOR ALL USING (is_admin(auth.uid()));

-- Admins can manage company_stats
CREATE POLICY "Admins can manage company_stats" ON company_stats
  FOR ALL USING (is_admin(auth.uid()));

-- Admins can manage company_tags
CREATE POLICY "Admins can manage company_tags" ON company_tags
  FOR ALL USING (is_admin(auth.uid()));

-- Admins can manage related_companies
CREATE POLICY "Admins can manage related_companies" ON related_companies
  FOR ALL USING (is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES - CONTACT & ADMIN
-- =============================================

-- Anyone can submit contact messages
CREATE POLICY "Anyone can submit contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Only admins can view contact messages
CREATE POLICY "Admins can view contact messages" ON contact_messages
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can view admin_users table
CREATE POLICY "Admins can view admin_users" ON admin_users
  FOR SELECT USING (is_admin(auth.uid()));

-- Only super_admins can manage admin_users
CREATE POLICY "Super admins can manage admin_users" ON admin_users
  FOR ALL USING (
    auth.uid() IN (
      SELECT uid FROM admin_users WHERE role = 'super_admin'
    )
  );

-- =============================================
-- RLS POLICIES - AUDIT & SECURITY
-- =============================================

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = changed_by);

-- Admins can view security events
CREATE POLICY "Admins can view security events" ON security_events
  FOR SELECT USING (is_admin(auth.uid()));

-- Users can view their own security events
CREATE POLICY "Users can view own security events" ON security_events
  FOR SELECT USING (auth.uid() = uid);

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(user_id UUID)
RETURNS TABLE (
  total_problems_solved BIGINT,
  total_bookmarks BIGINT,
  total_strategies BIGINT,
  easy_solved BIGINT,
  medium_solved BIGINT,
  hard_solved BIGINT,
  total_time_spent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE ups.status = 'solved')::BIGINT as total_problems_solved,
    COUNT(DISTINCT ub.problem_id)::BIGINT as total_bookmarks,
    COUNT(DISTINCT us.id)::BIGINT as total_strategies,
    COUNT(*) FILTER (WHERE ups.status = 'solved' AND p.difficulty = 'Easy')::BIGINT as easy_solved,
    COUNT(*) FILTER (WHERE ups.status = 'solved' AND p.difficulty = 'Medium')::BIGINT as medium_solved,
    COUNT(*) FILTER (WHERE ups.status = 'solved' AND p.difficulty = 'Hard')::BIGINT as hard_solved,
    COALESCE(SUM(ups.time_spent_minutes), 0)::INTEGER as total_time_spent
  FROM users u
  LEFT JOIN user_problem_status ups ON u.uid = ups.uid
  LEFT JOIN problems p ON ups.problem_id = p.id
  LEFT JOIN user_bookmarks ub ON u.uid = ub.uid
  LEFT JOIN user_strategies us ON u.uid = us.uid
  WHERE u.uid = user_id
  GROUP BY u.uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent audit activity for a user
CREATE OR REPLACE FUNCTION get_recent_user_activity(user_id UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  table_name TEXT,
  action TEXT,
  changed_at TIMESTAMPTZ,
  details JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.table_name,
    al.action,
    al.changed_at,
    CASE 
      WHEN al.action = 'INSERT' THEN al.new_data
      WHEN al.action = 'UPDATE' THEN jsonb_build_object('old', al.old_data, 'new', al.new_data)
      WHEN al.action = 'DELETE' THEN al.old_data
    END as details
  FROM audit_logs al
  WHERE al.changed_by = user_id
  ORDER BY al.changed_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TABLE COMMENTS
-- =============================================

COMMENT ON TABLE users IS 'Core user profiles and preferences';
COMMENT ON TABLE companies IS 'Companies that ask coding interview questions';
COMMENT ON TABLE problems IS 'Coding problems/questions';
COMMENT ON TABLE user_bookmarks IS 'User-saved problems for later reference';
COMMENT ON TABLE user_problem_status IS 'Tracks user progress on problems';
COMMENT ON TABLE user_education IS 'User education history';
COMMENT ON TABLE user_work_experience IS 'User work experience history';
COMMENT ON TABLE user_strategies IS 'User preparation strategies for specific companies';
COMMENT ON TABLE contact_messages IS 'Contact form submissions';
COMMENT ON TABLE admin_users IS 'Admin users with elevated permissions';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all data changes';
COMMENT ON TABLE security_events IS 'Security-related events like logins and suspicious activity';

COMMENT ON COLUMN users.preferences IS 'JSON object containing user preferences: { theme?: "light" | "dark" | "system", emailNotifications?: boolean, weeklyDigest?: boolean }';
COMMENT ON COLUMN user_problem_status.code_snippets IS 'JSON array of code solutions: [{ language: string, code: string, timestamp: string }]';
COMMENT ON COLUMN user_problem_status.status IS 'Problem status: todo (not started), in_progress (working on it), solved (completed), reviewed (reviewed after solving), attempted (tried but not solved)';
COMMENT ON COLUMN audit_logs.old_data IS 'JSON snapshot of data before change (for UPDATE and DELETE)';
COMMENT ON COLUMN audit_logs.new_data IS 'JSON snapshot of data after change (for INSERT and UPDATE)';

-- =============================================
-- INITIAL SETUP COMPLETE
-- =============================================

-- To add your first admin user, run:
-- INSERT INTO admin_users (uid, role) VALUES ('your-user-uuid-here', 'super_admin');

-- To view audit logs for a specific table:
-- SELECT * FROM audit_logs WHERE table_name = 'problems' ORDER BY changed_at DESC;

-- To view user activity:
-- SELECT * FROM get_user_activity_summary('user-uuid-here');

-- To view recent user actions:
-- SELECT * FROM get_recent_user_activity('user-uuid-here', 100);