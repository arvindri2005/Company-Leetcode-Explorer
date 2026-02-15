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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_company_problems_company ON company_problems(company_id);
CREATE INDEX IF NOT EXISTS idx_company_problems_problem ON company_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_company_problems_period ON company_problems(last_asked_period);
CREATE INDEX IF NOT EXISTS idx_company_tags_company ON company_tags(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tags_tag ON company_tags(tag);
CREATE INDEX IF NOT EXISTS idx_problems_tags ON problems USING GIN (tags);