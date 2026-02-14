import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sqjxthdaphpxwovhagde.supabase.co';
// The key provided by the user
const supabaseAnonKey = 'sb_publishable_EH15XCPRI8Ax9LPGLN5IYg_jEqqKAed';

console.log("Attempting to create client...");
try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Client created successfully.");
} catch (error) {
    console.error("Client creation failed:", error);
}
