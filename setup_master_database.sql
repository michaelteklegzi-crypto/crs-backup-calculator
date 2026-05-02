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
    location TEXT,
    status TEXT DEFAULT 'new'
);

-- 2. Create 'proposals' table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
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
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
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
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    loan_amount NUMERIC,
    down_payment NUMERIC,
    term_years INTEGER,
    monthly_payment NUMERIC,
    total_interest NUMERIC,
    status TEXT DEFAULT 'submitted'
);

-- 5. Create 'banks' table
CREATE TABLE IF NOT EXISTS banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    interest_rate NUMERIC NOT NULL,
    active BOOLEAN DEFAULT true
);

-- 6. Exchange Rates Table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate_buy DECIMAL(10, 4) NOT NULL,
    rate_sell DECIMAL(10, 4) NOT NULL,
    source TEXT DEFAULT 'CBE',
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'success'
);

-- 7. Equipment Import Costs Table
CREATE TABLE IF NOT EXISTS equipment_import_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_type TEXT NOT NULL UNIQUE,
    import_usd DECIMAL(10, 2) DEFAULT 0,
    shipping_usd DECIMAL(10, 2) DEFAULT 0,
    customs_duty_percent DECIMAL(5, 2) DEFAULT 0,
    inland_transport_etb DECIMAL(10, 2) DEFAULT 0,
    port_handling_etb DECIMAL(10, 2) DEFAULT 0,
    margin_percent DECIMAL(5, 2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Calculated Unit Costs Log
CREATE TABLE IF NOT EXISTS calculated_unit_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_type TEXT NOT NULL,
    exchange_rate_used DECIMAL(10, 4) NOT NULL,
    final_unit_cost_etb DECIMAL(12, 2) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Appliances Catalog Table
CREATE TABLE IF NOT EXISTS appliances_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_type TEXT NOT NULL, -- e.g., 'residential', 'sme'
    category_id TEXT NOT NULL, -- e.g., 'essential', 'core'
    category_label TEXT NOT NULL,
    category_desc TEXT,
    name TEXT NOT NULL,
    watts NUMERIC NOT NULL,
    hours NUMERIC NOT NULL DEFAULT 4,
    duty_cycle NUMERIC NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Projects Table (For saved consultant/user designs)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    client_name TEXT,
    load_profile JSONB NOT NULL,
    system_design JSONB NOT NULL,
    financial_snapshot JSONB NOT NULL,
    config JSONB NOT NULL,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS & Policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliances_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Allow public update to leads" ON leads FOR UPDATE USING (true);
CREATE POLICY "Allow public insert to proposals" ON proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to proposals" ON proposals FOR SELECT USING (true);
CREATE POLICY "Allow public insert to site_visits" ON site_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to site_visits" ON site_visits FOR SELECT USING (true);
CREATE POLICY "Allow public insert to loan_applications" ON loan_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to loan_applications" ON loan_applications FOR SELECT USING (true);
CREATE POLICY "Allow public select to banks" ON banks FOR SELECT USING (true);
CREATE POLICY "Allow public update to banks" ON banks FOR ALL USING (true); 
CREATE POLICY "Allow public insert to banks" ON banks FOR INSERT WITH CHECK (true);
CREATE POLICY "appliances_select" ON appliances_catalog FOR SELECT USING (true);
CREATE POLICY "appliances_insert" ON appliances_catalog FOR INSERT WITH CHECK (true);
CREATE POLICY "appliances_update" ON appliances_catalog FOR UPDATE USING (true);
CREATE POLICY "appliances_delete" ON appliances_catalog FOR DELETE USING (true);

CREATE POLICY "Users can manage their own projects" ON projects FOR ALL USING (auth.uid() = user_id);

-- Seed Banks
INSERT INTO banks (name, interest_rate) VALUES
('Commercial Bank of Ethiopia', 16.5),
('Dashen Bank', 14.5),
('Awash Bank', 15.0),
('Abyssinia Bank', 15.5)
ON CONFLICT DO NOTHING;

-- Seed Equipment Costs
INSERT INTO equipment_import_costs (equipment_type, import_usd, shipping_usd, customs_duty_percent, inland_transport_etb, margin_percent)
VALUES 
    ('pv_panel', 120.00, 15.00, 0, 500.00, 15.00),
    ('battery_unit', 1800.00, 150.00, 5.00, 2000.00, 20.00),
    ('inverter_1ph_5kw', 600.00, 50.00, 10.00, 1000.00, 20.00),
    ('inverter_3ph_15kw', 2500.00, 150.00, 10.00, 3000.00, 25.00)
ON CONFLICT (equipment_type) DO UPDATE SET import_usd = EXCLUDED.import_usd;

-- Seed Exchange Rates
INSERT INTO exchange_rates (rate_buy, rate_sell, source, status)
VALUES (120.00, 126.00, 'Manual Init', 'manual');

-- Seed Applicances Catalog
INSERT INTO appliances_catalog (user_type, category_id, category_label, category_desc, name, watts, hours, duty_cycle) VALUES
('residential', 'essential', 'Essential Loads', 'Critical for daily living', 'LED Bulbs (Pack)', 50, 6, 1.0),
('residential', 'essential', 'Essential Loads', 'Critical for daily living', 'Refrigerator', 150, 24, 0.3),
('residential', 'essential', 'Essential Loads', 'Critical for daily living', 'WiFi Router', 15, 24, 1.0),
('residential', 'essential', 'Essential Loads', 'Critical for daily living', 'LCD TV', 100, 4, 0.7),
('residential', 'essential', 'Essential Loads', 'Critical for daily living', 'Phone Chargers', 20, 4, 1.0),
('residential', 'comfort', 'Comfort & Kitchen', 'Lifestyle & Convenience', 'Air Conditioner', 1500, 8, 0.8),
('residential', 'comfort', 'Comfort & Kitchen', 'Lifestyle & Convenience', 'Electric Water Heater', 2000, 2, 0.3),
('residential', 'comfort', 'Comfort & Kitchen', 'Lifestyle & Convenience', 'Electric Oven', 3000, 1, 0.7),
('residential', 'comfort', 'Comfort & Kitchen', 'Lifestyle & Convenience', 'Washing Machine', 500, 1, 0.7),
('residential', 'comfort', 'Comfort & Kitchen', 'Lifestyle & Convenience', 'Water Pump', 750, 0.5, 0.7),
('residential', 'comfort', 'Comfort & Kitchen', 'Lifestyle & Convenience', 'Microwave', 1200, 0.3, 0.2),
('sme', 'core', 'Core Operations', 'Basic office & shop functionality', 'Office Lighting', 150, 9, 1.0),
('sme', 'core', 'Core Operations', 'Basic office & shop functionality', 'Shop Lighting', 400, 10, 1.0),
('sme', 'core', 'Core Operations', 'Basic office & shop functionality', 'Desktop PC', 250, 9, 0.7),
('sme', 'core', 'Core Operations', 'Basic office & shop functionality', 'Laptop', 65, 8, 0.7),
('sme', 'core', 'Core Operations', 'Basic office & shop functionality', 'WiFi / Network', 30, 24, 1.0),
('sme', 'core', 'Core Operations', 'Basic office & shop functionality', 'Printer / Copier', 400, 1, 0.1),
('sme', 'core', 'Core Operations', 'Basic office & shop functionality', 'Sound System', 100, 10, 1.0),
('sme', 'core', 'Core Operations', 'Basic office & shop functionality', 'Blender', 1000, 1, 0.2),
('sme', 'critical', 'Critical Systems', 'High dependency infrastructure', 'Server Rack (Small)', 800, 24, 1.0),
('sme', 'critical', 'Critical Systems', 'High dependency infrastructure', 'Security Camera System', 60, 24, 1.0),
('sme', 'critical', 'Critical Systems', 'High dependency infrastructure', 'POS Terminal', 50, 10, 1.0),
('sme', 'critical', 'Critical Systems', 'High dependency infrastructure', 'Medical Fridge', 200, 24, 0.3),
('sme', 'critical', 'Critical Systems', 'High dependency infrastructure', 'Commercial Fridge', 400, 24, 0.3),
('sme', 'critical', 'Critical Systems', 'High dependency infrastructure', 'Espresso Machine', 3000, 4, 0.7),
('sme', 'critical', 'Critical Systems', 'High dependency infrastructure', 'Coffee Grinder', 400, 2, 0.3);
