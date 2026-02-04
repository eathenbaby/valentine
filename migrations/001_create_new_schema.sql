-- Migration: Create new tables for confession platform
-- This adds the new schema while preserving existing data

-- Create users table for OAuth authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    instagram_username TEXT,
    profile_picture TEXT,
    oauth_provider TEXT NOT NULL,
    oauth_id TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create new confessions table (migrate from old one)
CREATE TABLE IF NOT EXISTS confessions_new (
    id TEXT PRIMARY KEY,
    confession_number SERIAL NOT NULL,
    sender_id TEXT REFERENCES users(id),
    sender_name TEXT NOT NULL,
    sender_instagram TEXT,
    vibe_type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    validation_score INTEGER DEFAULT 0,
    flagged_for_review BOOLEAN DEFAULT false,
    admin_notes TEXT,
    posted_to_instagram BOOLEAN DEFAULT false,
    instagram_post_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    posted_at TIMESTAMP
);

-- Create reveal_requests table
CREATE TABLE IF NOT EXISTS reveal_requests (
    id TEXT PRIMARY KEY,
    confession_id TEXT REFERENCES confessions_new(id),
    requester_instagram TEXT NOT NULL,
    requester_name TEXT,
    requester_email TEXT,
    payment_amount INTEGER NOT NULL,
    payment_method TEXT DEFAULT 'razorpay',
    payment_status TEXT DEFAULT 'pending',
    payment_id TEXT,
    revealed BOOLEAN DEFAULT false,
    revealed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    confession_id TEXT REFERENCES confessions_new(id),
    reveal_request_id TEXT REFERENCES reveal_requests(id),
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_provider TEXT DEFAULT 'razorpay',
    payment_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    metadata TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    event_name TEXT NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing confessions to new table
INSERT INTO confessions_new (id, confession_number, sender_name, vibe_type, message, status, created_at)
SELECT 
    id,
    COALESCE(
        (SELECT COUNT(*) + 1 FROM confessions c2 WHERE c2.id <= c1.id),
        1
    ) as confession_number,
    sender_name,
    'just_talk' as vibe_type, -- Default vibe for old confessions
    message,
    CASE 
        WHEN response = 'yes' THEN 'posted'
        WHEN response = 'no' THEN 'rejected'
        ELSE 'pending'
    END as status,
    created_at
FROM confessions c1;

-- Drop old confessions table and rename new one
DROP TABLE IF EXISTS confessions;
ALTER TABLE confessions_new RENAME TO confessions;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_confessions_status ON confessions(status);
CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON confessions(created_at);
CREATE INDEX IF NOT EXISTS idx_reveal_requests_confession_id ON reveal_requests(confession_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_users_oauth_id ON users(oauth_id);

-- Create sequence for confession_number if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS confession_number_seq START 1;
ALTER TABLE confessions ALTER COLUMN confession_number SET DEFAULT nextval('confession_number_seq');
