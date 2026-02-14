import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and Anon Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sqjxthdaphpxwovhagde.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_EH15XCPRI8Ax9LPGLN5IYg_jEqqKAed';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Schema Instructions for Admin:
/*
Table 1: 'leads'
- id: uuid (primary key)
- created_at: timestamp
- name: text
- phone: text (unique)
- email: text
- location: text
- source: text (residential/sme)

Table 2: 'proposals'
- id: uuid (primary key)
- lead_id: uuid (foreign key -> leads.id)
- created_at: timestamp
- system_size_pv_kw: numeric
- system_size_battery_kwh: numeric
- system_size_inverter_kw: numeric
- total_capex: numeric
- analysis_json: jsonb (stores full calculation results)

Table 3: 'site_visits'
- id: uuid (primary key)
- lead_id: uuid (foreign key -> leads.id)
- created_at: timestamp
- preferred_date: date
- preferred_time: text
- address: text
- notes: text
- status: text (pending/scheduled/completed)

Table 4: 'loan_applications'
- id: uuid (primary key)
- lead_id: uuid (foreign key -> leads.id)
- created_at: timestamp
- loan_amount: numeric
- down_payment: numeric
- term_years: integer
- monthly_payment: numeric
- status: text (submitted/reviewing/approved/rejected)
*/
