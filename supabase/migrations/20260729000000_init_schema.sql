-- Migration: 20260729000000_init_schema.sql
-- Description: Create initial schema for Settle (sellers, deals, disputes, activity)

-- Enums
DO $$ BEGIN
    CREATE TYPE deal_status AS ENUM ('created', 'locked', 'dispatched', 'delivered', 'settled', 'disputed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fulfillment_type AS ENUM ('shipped', 'delivered', 'service_completed', 'digital_sent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_reason AS ENUM ('item_never_arrived', 'wrong_damaged_item', 'incomplete_service');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_status AS ENUM ('open', 'counter_submitted', 'resolved_refund', 'resolved_seller', 'escalated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('deal_created', 'payment_locked', 'dispatched', 'delivered', 'settled', 'dispute_raised', 'dispute_resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: sellers
CREATE TABLE IF NOT EXISTS sellers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  total_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: deals
CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  short_url TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  fee_amount NUMERIC(12, 2) NOT NULL,
  seller_payout NUMERIC(12, 2) NOT NULL,
  delivery_window_hours INTEGER NOT NULL DEFAULT 48,
  status deal_status NOT NULL DEFAULT 'created',
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  buyer_phone TEXT,
  buyer_name TEXT,
  buyer_email TEXT,
  paystack_reference TEXT,
  fulfillment_type fulfillment_type,
  seller_confirmed_at TIMESTAMPTZ,
  buyer_confirmed_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  delivery_deadline TIMESTAMPTZ,
  delivery_code TEXT,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: disputes
CREATE TABLE IF NOT EXISTS disputes (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  reason dispute_reason NOT NULL,
  description TEXT,
  evidence_url TEXT,
  counter_proof_url TEXT,
  counter_proof_description TEXT,
  status dispute_status NOT NULL DEFAULT 'open',
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Table: activity
CREATE TABLE IF NOT EXISTS activity (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  item_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  buyer_name TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) setup
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

-- Security Policies
DO $$ BEGIN
    CREATE POLICY "Allow all operations on sellers" ON sellers FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all operations on deals" ON deals FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all operations on disputes" ON disputes FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow all operations on activity" ON activity FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Data API permissions
GRANT ALL ON TABLE sellers TO anon, authenticated, service_role;
GRANT ALL ON TABLE deals TO anon, authenticated, service_role;
GRANT ALL ON TABLE disputes TO anon, authenticated, service_role;
GRANT ALL ON TABLE activity TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
