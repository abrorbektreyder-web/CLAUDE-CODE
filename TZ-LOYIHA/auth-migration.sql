-- ════════════════════════════════════════════════════════════════════════════
-- BETTER AUTH MIGRATION — Run this in Supabase SQL Editor ONCE
-- ════════════════════════════════════════════════════════════════════════════
-- WHY: Better Auth stores passwords in 'accounts' table (provider: credential)
--      But existing users have password_hash in 'users' table.
--      This script migrates existing user credentials to the accounts table.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Migrate existing user passwords → accounts table
-- This creates a 'credential' account entry for each user that has a password_hash
INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
SELECT
  gen_random_uuid()::text,   -- id
  id::text,                  -- account_id (user's own ID)
  'credential',              -- provider_id
  id::text,                  -- user_id
  password_hash,             -- password (the Argon2id hash)
  created_at,
  updated_at
FROM users
WHERE password_hash IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE user_id = users.id::text AND provider_id = 'credential'
  );

-- 2. Make sure users table has the required Better Auth columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT GENERATED ALWAYS AS (full_name) STORED;

-- 3. Verify the migration
SELECT
  u.id,
  u.email,
  u.full_name,
  u.email_verified,
  a.provider_id,
  CASE WHEN a.password IS NOT NULL THEN '✅ Has password' ELSE '❌ No password' END as auth_status
FROM users u
LEFT JOIN accounts a ON a.user_id = u.id::text AND a.provider_id = 'credential'
LIMIT 20;
