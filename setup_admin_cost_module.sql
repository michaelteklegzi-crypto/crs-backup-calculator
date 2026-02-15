
-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Exchange Rates Table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate_buy DECIMAL(10, 4) NOT NULL,
    rate_sell DECIMAL(10, 4) NOT NULL,
    source TEXT DEFAULT 'CBE',
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'success' -- 'success', 'failed', 'manual'
);

-- 2. Equipment Import Costs Table
-- Stores the base USD costs and shipping/local parameters per equipment type
CREATE TABLE IF NOT EXISTS equipment_import_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_type TEXT NOT NULL UNIQUE, -- 'pv_panel', 'battery_unit', 'inverter_unit'
    import_usd DECIMAL(10, 2) DEFAULT 0,
    shipping_usd DECIMAL(10, 2) DEFAULT 0,
    customs_duty_percent DECIMAL(5, 2) DEFAULT 0, -- e.g. 15.00 for 15%
    inland_transport_etb DECIMAL(10, 2) DEFAULT 0,
    port_handling_etb DECIMAL(10, 2) DEFAULT 0,
    margin_percent DECIMAL(5, 2) DEFAULT 0, -- e.g. 20.00 for 20%
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Calculated Unit Costs Log
-- History of what cost was applied when
CREATE TABLE IF NOT EXISTS calculated_unit_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_type TEXT NOT NULL,
    exchange_rate_used DECIMAL(10, 4) NOT NULL,
    final_unit_cost_etb DECIMAL(12, 2) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Data for Equipment Types
INSERT INTO equipment_import_costs (equipment_type, import_usd, shipping_usd, customs_duty_percent, inland_transport_etb, margin_percent)
VALUES 
    ('pv_panel', 120.00, 15.00, 0, 500.00, 15.00),
    ('battery_unit', 1800.00, 150.00, 5.00, 2000.00, 20.00),
    ('inverter_1ph_5kw', 600.00, 50.00, 10.00, 1000.00, 20.00), -- Single Phase 5kW Module
    ('inverter_3ph_15kw', 2500.00, 150.00, 10.00, 3000.00, 25.00) -- Three Phase 15kW Unit
ON CONFLICT (equipment_type) DO UPDATE SET
    import_usd = EXCLUDED.import_usd;

-- Clean up old generic type (Optional, good for migration)
DELETE FROM equipment_import_costs WHERE equipment_type = 'inverter_unit';

-- Seed Initial Exchange Rate (approximate)
INSERT INTO exchange_rates (rate_buy, rate_sell, source, status)
VALUES (120.00, 126.00, 'Manual Init', 'manual');
