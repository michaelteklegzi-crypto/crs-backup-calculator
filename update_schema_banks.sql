-- 5. Create 'banks' table
CREATE TABLE IF NOT EXISTS banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    interest_rate NUMERIC NOT NULL, -- Annual interest rate in %
    active BOOLEAN DEFAULT true
);

-- Toggle RLS
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select to banks" ON banks FOR SELECT USING (true);
CREATE POLICY "Allow public insert to banks" ON banks FOR INSERT WITH CHECK (true); -- In prod, only admin
CREATE POLICY "Allow public update to banks" ON banks FOR UPDATE USING (true); -- In prod, only admin

-- Seed some initial banks
INSERT INTO banks (name, interest_rate) VALUES
('Commercial Bank of Ethiopia', 16.5),
('Dashen Bank', 14.5),
('Awash Bank', 15.0),
('Abyssinia Bank', 15.5)
ON CONFLICT DO NOTHING;
