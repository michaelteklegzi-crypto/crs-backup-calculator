-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create 'leads' table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    source TEXT DEFAULT 'web',
    location TEXT
);

-- 2. Create 'proposals' table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lead_id UUID REFERENCES leads(id),
    system_size_pv_kw NUMERIC,
    system_size_battery_kwh NUMERIC,
    system_size_inverter_kw NUMERIC,
    total_capex NUMERIC,
    analysis_json JSONB
);

-- 3. Create 'site_visits' table
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lead_id UUID REFERENCES leads(id),
    address TEXT,
    preferred_date DATE,
    preferred_time TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending'
);

-- 4. Create 'loan_applications' table
CREATE TABLE IF NOT EXISTS loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lead_id UUID REFERENCES leads(id),
    loan_amount NUMERIC,
    down_payment NUMERIC,
    term_years INTEGER,
    monthly_payment NUMERIC,
    total_interest NUMERIC,
    status TEXT DEFAULT 'submitted'
);

-- Enable Row Level Security (RLS) - Optional for initial dev, but good practice
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public insert (since we have public lead capture)
-- In production, you might want stricter policies or authentication.
CREATE POLICY "Allow public insert to leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to leads" ON leads FOR SELECT USING (true); -- For dev/demo

CREATE POLICY "Allow public insert to proposals" ON proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to proposals" ON proposals FOR SELECT USING (true);

CREATE POLICY "Allow public insert to site_visits" ON site_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to site_visits" ON site_visits FOR SELECT USING (true);

CREATE POLICY "Allow public insert to loan_applications" ON loan_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to loan_applications" ON loan_applications FOR SELECT USING (true);
