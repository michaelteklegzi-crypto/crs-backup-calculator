/**
 * SOLARMAN Analytics Engine
 * Safe, structured analytical functions querying the CRS PostgreSQL database.
 * Does NOT directly contact Solarman API. Only queries synchronized data.
 */

/**
 * Retrieves basic historical measurements for a given plant and time range.
 * 
 * @param {Object} supabase - Supabase client instance
 * @param {string} plantId - CRS UUID for the plant
 * @param {string} startTime - ISO string for start time
 * @param {string} endTime - ISO string for end time
 * @param {Array<string>} metrics - List of columns to select (e.g., ['timestamp', 'consumption_power_kw'])
 */
export async function getMeasurements(supabase, plantId, startTime, endTime, metrics = ['*']) {
    const { data, error } = await supabase
        .from('solarman_measurements')
        .select(metrics.join(', '))
        .eq('plant_id', plantId)
        .gte('timestamp', startTime)
        .lte('timestamp', endTime)
        .order('timestamp', { ascending: true });

    if (error) throw error;
    return data;
}

/**
 * Calculates Peak Load and Average Load for a specific period
 */
export async function getLoadAnalysis(supabase, plantId, startTime, endTime) {
    const data = await getMeasurements(supabase, plantId, startTime, endTime, ['timestamp', 'consumption_power_kw', 'data_quality']);
    
    if (!data || data.length === 0) {
        return {
            peakLoad: 0,
            averageLoad: 0,
            minimumLoad: 0,
            peakTime: null,
            totalRecords: 0,
            dataQuality: 'MISSING'
        };
    }

    let peak = -Infinity;
    let min = Infinity;
    let sum = 0;
    let peakTime = null;
    let validRecords = 0;

    data.forEach(record => {
        const load = record.consumption_power_kw;
        if (load !== null && load !== undefined) {
            validRecords++;
            sum += parseFloat(load);
            if (load > peak) {
                peak = parseFloat(load);
                peakTime = record.timestamp;
            }
            if (load < min) {
                min = parseFloat(load);
            }
        }
    });

    return {
        peakLoad: peak === -Infinity ? 0 : peak,
        averageLoad: validRecords > 0 ? (sum / validRecords) : 0,
        minimumLoad: min === Infinity ? 0 : min,
        peakTime: peakTime,
        totalRecords: validRecords,
        dataQuality: validRecords > 0 ? 'MEASURED' : 'MISSING'
    };
}

/**
 * Calculates battery metrics (Discharge events, min SoC)
 */
export async function getBatteryAnalysis(supabase, plantId, startTime, endTime) {
    const data = await getMeasurements(supabase, plantId, startTime, endTime, ['timestamp', 'battery_discharge_kw', 'battery_soc_percent']);
    
    let maxDischarge = 0;
    let minSoc = 100;
    let sumDischarge = 0;
    let validRecords = 0;

    if (data && data.length > 0) {
        data.forEach(record => {
            const dis = record.battery_discharge_kw;
            const soc = record.battery_soc_percent;
            
            if (dis !== null) {
                const numDis = parseFloat(dis);
                if (numDis > maxDischarge) maxDischarge = numDis;
                sumDischarge += numDis;
                validRecords++;
            }
            if (soc !== null) {
                const numSoc = parseFloat(soc);
                if (numSoc < minSoc) minSoc = numSoc;
            }
        });
    }

    return {
        maxDischargePower: maxDischarge,
        minimumSoc: minSoc === 100 ? null : minSoc,
        averageDischarge: validRecords > 0 ? (sumDischarge / validRecords) : 0
    };
}
