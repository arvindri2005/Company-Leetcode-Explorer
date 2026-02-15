-- Create users table
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
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
  uid TEXT REFERENCES users(uid) ON DELETE CASCADE,
  problem_id TEXT REFERENCES problems(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (uid, problem_id)
);

-- Create user_problem_status table
CREATE TABLE IF NOT EXISTS user_problem_status (
  uid TEXT REFERENCES users(uid) ON DELETE CASCADE,
  problem_id TEXT REFERENCES problems(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'solved', 'reviewed')) NOT NULL,
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

-- Create indexes for better query performance
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

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at on user_problem_status table
DROP TRIGGER IF EXISTS update_user_problem_status_updated_at ON user_problem_status;
CREATE TRIGGER update_user_problem_status_updated_at
  BEFORE UPDATE ON user_problem_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments to document the structure
COMMENT ON COLUMN users.preferences IS 'JSON object containing user preferences: { theme?: "light" | "dark" | "system", emailNotifications?: boolean, weeklyDigest?: boolean }';
COMMENT ON COLUMN user_problem_status.code_snippets IS 'JSON array of code solutions: [{ language: string, code: string, timestamp: string }]';
COMMENT ON COLUMN user_problem_status.status IS 'Problem status: todo (not started), in_progress (working on it), solved (completed), reviewed (reviewed after solving)';