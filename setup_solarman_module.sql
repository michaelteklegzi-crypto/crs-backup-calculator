-- SOLARMAN Integration Module SQL Setup

-- 1. Connections
CREATE TABLE IF NOT EXISTS solarman_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    app_id TEXT NOT NULL,
    app_secret_encrypted TEXT NOT NULL,
    api_username TEXT NOT NULL,
    api_password_encrypted TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'disconnected' -- connected, disconnected, error
);

-- 2. Plants (Installations)
CREATE TABLE IF NOT EXISTS solarman_plants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID REFERENCES solarman_connections(id) ON DELETE CASCADE,
    solarman_plant_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    location TEXT,
    capacity_kw NUMERIC,
    status TEXT,
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_started TIMESTAMP WITH TIME ZONE,
    last_sync_completed TIMESTAMP WITH TIME ZONE,
    last_successful_sync TIMESTAMP WITH TIME ZONE,
    last_synced_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Devices
CREATE TABLE IF NOT EXISTS solarman_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id UUID REFERENCES solarman_plants(id) ON DELETE CASCADE,
    device_sn TEXT NOT NULL UNIQUE,
    device_type TEXT,
    name TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Measurements (Canonical Data Model)
CREATE TABLE IF NOT EXISTS solarman_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id UUID REFERENCES solarman_plants(id) ON DELETE CASCADE,
    device_id UUID REFERENCES solarman_devices(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source_timezone TEXT,
    
    -- Canonical Metrics (Nullable to handle missing data gracefully)
    pv_power_kw NUMERIC,
    consumption_power_kw NUMERIC,
    grid_power_kw NUMERIC,
    grid_import_kw NUMERIC,
    grid_export_kw NUMERIC,
    battery_power_kw NUMERIC,
    battery_charge_kw NUMERIC,
    battery_discharge_kw NUMERIC,
    battery_soc_percent NUMERIC,
    generator_power_kw NUMERIC,
    inverter_power_kw NUMERIC,
    
    daily_pv_energy_kwh NUMERIC,
    daily_consumption_kwh NUMERIC,
    daily_grid_import_kwh NUMERIC,
    daily_grid_export_kwh NUMERIC,
    daily_battery_charge_kwh NUMERIC,
    daily_battery_discharge_kwh NUMERIC,
    
    temperature NUMERIC,
    irradiance NUMERIC,
    
    -- Metadata
    data_quality TEXT DEFAULT 'MEASURED', -- MEASURED, CALCULATED, ESTIMATED, INTERPOLATED, MISSING
    source TEXT DEFAULT 'SOLARMAN',
    api_retrieval_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_job_id UUID, -- Reference to the job that brought this in
    
    -- Constraint to prevent duplicates per plant/device/timestamp combination
    UNIQUE (plant_id, device_id, timestamp)
);

-- 5. Sync Jobs (Audit Log)
CREATE TABLE IF NOT EXISTS solarman_sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id UUID REFERENCES solarman_plants(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    requested_from TIMESTAMP WITH TIME ZONE,
    requested_to TIMESTAMP WITH TIME ZONE,
    records_retrieved INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'syncing', -- syncing, success, partial, failed
    error_message TEXT,
    api_response_time_ms INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_solarman_measurements_plant_time ON solarman_measurements(plant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_solarman_measurements_device_time ON solarman_measurements(device_id, timestamp);

-- RLS Policies (Assuming Admin/System access primarily for these tables for now)
ALTER TABLE solarman_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE solarman_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE solarman_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE solarman_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE solarman_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (to mimic the simple setup of the rest of the app, pending proper Auth setup)
-- In a real production system, this would be restricted to authenticated users based on tenant/role.
CREATE POLICY "Allow public select on solarman_connections" ON solarman_connections FOR SELECT USING (true);
CREATE POLICY "Allow public all on solarman_connections" ON solarman_connections FOR ALL USING (true);

CREATE POLICY "Allow public select on solarman_plants" ON solarman_plants FOR SELECT USING (true);
CREATE POLICY "Allow public all on solarman_plants" ON solarman_plants FOR ALL USING (true);

CREATE POLICY "Allow public select on solarman_devices" ON solarman_devices FOR SELECT USING (true);
CREATE POLICY "Allow public all on solarman_devices" ON solarman_devices FOR ALL USING (true);

CREATE POLICY "Allow public select on solarman_measurements" ON solarman_measurements FOR SELECT USING (true);
CREATE POLICY "Allow public all on solarman_measurements" ON solarman_measurements FOR ALL USING (true);

CREATE POLICY "Allow public select on solarman_sync_jobs" ON solarman_sync_jobs FOR SELECT USING (true);
CREATE POLICY "Allow public all on solarman_sync_jobs" ON solarman_sync_jobs FOR ALL USING (true);
