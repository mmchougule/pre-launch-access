-- Create launchpad_projects table
CREATE TABLE IF NOT EXISTS launchpad_projects (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  description TEXT,
  token_address VARCHAR(42),
  price_per_token DECIMAL(36, 18) NOT NULL,
  total_supply VARCHAR(78) NOT NULL,
  allocation VARCHAR(78) NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  min_contribution VARCHAR(78) NOT NULL,
  max_contribution VARCHAR(78) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
  raised_amount VARCHAR(78) NOT NULL DEFAULT '0',
  contributors_count INT NOT NULL DEFAULT 0,
  privacy_pool_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create launchpad_contributions table
CREATE TABLE IF NOT EXISTS launchpad_contributions (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES launchpad_projects(id),
  user_address VARCHAR(42) NOT NULL,
  incognito_address VARCHAR(42),
  amount VARCHAR(78) NOT NULL,
  token VARCHAR(10) NOT NULL,
  shield_tx_hash VARCHAR(66),
  tokens_allocated VARCHAR(78) NOT NULL DEFAULT '0',
  distribution_tx_hash VARCHAR(66),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_launchpad_projects_status ON launchpad_projects(status);
CREATE INDEX idx_launchpad_projects_start_time ON launchpad_projects(start_time);
CREATE INDEX idx_launchpad_projects_end_time ON launchpad_projects(end_time);
CREATE INDEX idx_launchpad_contributions_project_id ON launchpad_contributions(project_id);
CREATE INDEX idx_launchpad_contributions_user_address ON launchpad_contributions(user_address);
CREATE INDEX idx_launchpad_contributions_status ON launchpad_contributions(status);
