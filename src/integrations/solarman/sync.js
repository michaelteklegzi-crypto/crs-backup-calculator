/**
 * SOLARMAN Synchronization Engine
 * Manages pulling data from SOLARMAN and upserting into the CRS database.
 * 
 * IMPORTANT: Server-side only. Assumes usage of Supabase JS client server-side.
 */

import { authenticate, refreshToken } from './auth.js';
import { getPlants } from './plants.js';
import { getDevices } from './devices.js';
import { getHistoricalData } from './historical.js';
import { normalizeHistoricalData } from './normalization.js';
// Note: In a real implementation, you would import the initialized supabase client
// import { supabaseServerClient as supabase } from '../../utils/supabaseServerClient.js';
// For this scaffolding, we pass it or mock it.

const OVERLAP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes overlap for reconciliation

/**
 * Ensures we have a valid token for the given connection
 */
async function ensureConnectionAuth(supabase, connectionId) {
    const { data: conn } = await supabase.from('solarman_connections').select('*').eq('id', connectionId).single();
    if (!conn) throw new Error(`Connection ${connectionId} not found`);

    const now = new Date();
    let token = conn.access_token;
    
    // If token is missing or expired
    if (!token || !conn.token_expires_at || new Date(conn.token_expires_at) < now) {
        if (conn.refresh_token) {
            try {
                const refreshed = await refreshToken(conn.app_id, conn.app_secret_encrypted, conn.refresh_token);
                token = refreshed.accessToken;
                // Update DB...
            } catch (err) {
                // Fallback to full auth
                const auth = await authenticate(conn.app_id, conn.app_secret_encrypted, conn.api_username, conn.api_password_encrypted);
                token = auth.accessToken;
            }
        } else {
            const auth = await authenticate(conn.app_id, conn.app_secret_encrypted, conn.api_username, conn.api_password_encrypted);
            token = auth.accessToken;
        }
        
        // Save new token to DB
        await supabase.from('solarman_connections').update({
            access_token: token,
            // Assuming expiresIn is in seconds
            token_expires_at: new Date(now.getTime() + (3600 * 1000)).toISOString() 
        }).eq('id', connectionId);
    }
    
    return token;
}

/**
 * Synchronize a specific plant's data
 */
export async function syncPlant(supabase, plantId) {
    console.log(`Starting sync for plant ${plantId}`);
    
    const { data: plant } = await supabase.from('solarman_plants').select('*, solarman_connections(*)').eq('id', plantId).single();
    if (!plant || !plant.sync_enabled) {
        console.log(`Plant ${plantId} skipped (not found or sync disabled)`);
        return;
    }

    // 1. Create Sync Job Audit Record
    const { data: syncJob } = await supabase.from('solarman_sync_jobs').insert([{
        plant_id: plantId,
        status: 'syncing'
    }]).select().single();

    const jobId = syncJob.id;
    let recordsInserted = 0;
    
    try {
        const token = await ensureConnectionAuth(supabase, plant.connection_id);
        
        // 2. Determine Time Window
        // Incremental: Last synced timestamp minus overlap
        const now = new Date();
        const endTimeStr = now.toISOString().split('T')[0] + ' 23:59:59'; // Example format Solarman expects
        
        let startTimeStr = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0] + ' 00:00:00'; // Default 24h
        
        if (plant.last_synced_timestamp) {
            const lastSync = new Date(plant.last_synced_timestamp);
            const startWithOverlap = new Date(lastSync.getTime() - OVERLAP_WINDOW_MS);
            // Format to Solarman required format, typically "YYYY-MM-DD HH:mm:ss"
            startTimeStr = startWithOverlap.toISOString().replace('T', ' ').substring(0, 19);
        }

        // 3. Get Devices
        const { devices } = await getDevices(token, plant.solarman_plant_id);
        
        // Ensure devices exist in DB
        for (const dev of devices) {
            await supabase.from('solarman_devices').upsert({
                plant_id: plantId,
                device_sn: dev.deviceSn,
                device_type: dev.deviceType,
                name: dev.name
            }, { onConflict: 'device_sn' });
        }
        
        const { data: dbDevices } = await supabase.from('solarman_devices').select('*').eq('plant_id', plantId);

        // 4. Fetch Historical Data per Device
        for (const dbDev of dbDevices) {
            const rawHistorical = await getHistoricalData(token, plant.solarman_plant_id, dbDev.device_sn, startTimeStr, endTimeStr);
            
            // 5. Normalize
            const normalizedData = normalizeHistoricalData(rawHistorical, plantId, dbDev.id);
            
            // 6. UPSERT into DB
            if (normalizedData.length > 0) {
                // Add sync job ID
                const toInsert = normalizedData.map(d => ({ ...d, sync_job_id: jobId }));
                
                // Supabase upsert using unique constraint (plant_id, device_id, timestamp)
                const { error } = await supabase.from('solarman_measurements')
                    .upsert(toInsert, { onConflict: 'plant_id,device_id,timestamp' });
                    
                if (error) throw error;
                recordsInserted += normalizedData.length;
            }
        }

        // 7. Mark Success
        await supabase.from('solarman_sync_jobs').update({
            status: 'success',
            completed_at: new Date().toISOString(),
            records_inserted: recordsInserted,
            requested_from: startTimeStr,
            requested_to: endTimeStr
        }).eq('id', jobId);

        await supabase.from('solarman_plants').update({
            last_sync_completed: new Date().toISOString(),
            last_successful_sync: new Date().toISOString(),
            last_synced_timestamp: now.toISOString() // Record when we synced up to
        }).eq('id', plantId);

        console.log(`Sync complete for plant ${plantId}. Records: ${recordsInserted}`);

    } catch (error) {
        console.error(`Sync failed for plant ${plantId}:`, error);
        
        await supabase.from('solarman_sync_jobs').update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error.message || 'Unknown error'
        }).eq('id', jobId);
    }
}
