import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sgujhtscljahoagparmc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndWpodHNjbGphaG9hZ3Bhcm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTg4NTIsImV4cCI6MjA5MjY5NDg1Mn0.H_uFMPX_ZYpeLkZ0CF2ZUKQL5yXVG7QmCtNCuYqaLMA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log("Checking equipment_import_costs...");
    const { data: costs, error: costsError } = await supabase.from('equipment_import_costs').select('*');
    if (costsError) {
        console.error("Error querying equipment_import_costs:", costsError.message);
    } else {
        console.log(`equipment_import_costs has ${costs.length} rows.`);
    }

    console.log("Checking exchange_rates...");
    const { data: rates, error: ratesError } = await supabase.from('exchange_rates').select('*');
    if (ratesError) {
        console.error("Error querying exchange_rates:", ratesError.message);
    } else {
        console.log(`exchange_rates has ${rates.length} rows.`);
    }
}

checkTables();
