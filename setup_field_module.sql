-- Field Audit Module SQL Setup

-- 1. Create 'field_audits' table
CREATE TABLE IF NOT EXISTS field_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Identity / Access
    entered_by_name TEXT NOT NULL,
    entered_by_id TEXT NOT NULL,
    
    -- Site Information
    client_name TEXT,
    branch_name TEXT,
    location TEXT,
    
    -- Configuration
    voltage NUMERIC NOT NULL,
    power_factor NUMERIC DEFAULT 0.85,
    phase_type TEXT CHECK (phase_type IN ('single_phase', 'three_phase')) NOT NULL,
    
    -- JSONB Columns for dynamic structure
    measurements JSONB DEFAULT '{}'::jsonb,
    equipment JSONB DEFAULT '[]'::jsonb,
    general_info JSONB DEFAULT '{}'::jsonb,
    analysis_results JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'analyzed'))
);

-- Enable RLS & Policies
ALTER TABLE field_audits ENABLE ROW LEVEL SECURITY;

-- Policies for public or authenticated access depending on setup
DROP POLICY IF EXISTS "Allow public insert to field_audits" ON field_audits;
DROP POLICY IF EXISTS "Allow public select to field_audits" ON field_audits;
DROP POLICY IF EXISTS "Allow public update to field_audits" ON field_audits;
DROP POLICY IF EXISTS "Allow public delete to field_audits" ON field_audits;

CREATE POLICY "Allow public insert to field_audits" ON field_audits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to field_audits" ON field_audits FOR SELECT USING (true);
CREATE POLICY "Allow public update to field_audits" ON field_audits FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to field_audits" ON field_audits FOR DELETE USING (true);
