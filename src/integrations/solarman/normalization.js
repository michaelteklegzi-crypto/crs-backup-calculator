/**
 * SOLARMAN Normalization Module
 * Transforms raw SOLARMAN parameter data into the CRS Canonical Energy Data Model.
 * 
 * IMPORTANT: Server-side only.
 */

/**
 * Solarman parameter keys vary by inverter brand/model. 
 * This mapping attempts to normalize common Solarman keys to the CRS model.
 * In a production environment, this might be loaded from a database table (SolarmanMetricDefinition).
 */
const PARAM_MAP = {
    // Power (kW)
    'P_PV': 'pv_power_kw',
    'P_Load': 'consumption_power_kw',
    'P_Grid': 'grid_power_kw', // Positive/Negative might need handling
    'P_Grid_Import': 'grid_import_kw',
    'P_Grid_Export': 'grid_export_kw',
    'P_Battery': 'battery_power_kw',
    'P_Bat_Charge': 'battery_charge_kw',
    'P_Bat_Discharge': 'battery_discharge_kw',
    
    // Percent
    'SoC': 'battery_soc_percent',
    'Bat_SoC': 'battery_soc_percent',
    
    // Energy (kWh)
    'E_PV_Day': 'daily_pv_energy_kwh',
    'E_Load_Day': 'daily_consumption_kwh',
    'E_Grid_Import_Day': 'daily_grid_import_kwh',
    'E_Grid_Export_Day': 'daily_grid_export_kwh',
    'E_Bat_Charge_Day': 'daily_battery_charge_kwh',
    'E_Bat_Discharge_Day': 'daily_battery_discharge_kwh',
    
    // Other
    'Temp': 'temperature',
    'Irr': 'irradiance'
};

/**
 * Normalizes an array of Solarman parameter lists into a grouped time-series array
 * matching the `solarman_measurements` table structure.
 * 
 * @param {Array} paramList - Raw parameter list from Solarman
 * @param {string} plantId - CRS internal plant UUID
 * @param {string} deviceId - CRS internal device UUID
 * @returns {Array} Array of normalized measurement objects
 */
export function normalizeHistoricalData(paramList, plantId, deviceId) {
    if (!paramList || !Array.isArray(paramList)) return [];

    // Group by timestamp
    const timeSeriesMap = new Map();

    for (const param of paramList) {
        const rawKey = param.key;
        const mappedKey = PARAM_MAP[rawKey];
        
        // If we don't care about this metric, skip
        if (!mappedKey) continue;

        const valList = param.valList || [];
        for (const dataPoint of valList) {
            // Solarman typically returns timestamp as a unix timestamp string or integer
            const time = parseInt(dataPoint.time, 10);
            if (isNaN(time)) continue;

            const value = parseFloat(dataPoint.value);
            if (isNaN(value)) continue;

            if (!timeSeriesMap.has(time)) {
                timeSeriesMap.set(time, {
                    plant_id: plantId,
                    device_id: deviceId,
                    // Solarman usually provides seconds or milliseconds, assume seconds and multiply if needed.
                    // Assuming seconds for this example:
                    timestamp: new Date(time > 9999999999 ? time : time * 1000).toISOString(),
                    data_quality: 'MEASURED',
                    source: 'SOLARMAN'
                });
            }

            const record = timeSeriesMap.get(time);
            
            // Note: In real life, some metrics like Grid Power are bi-directional (e.g. negative = export).
            // We would implement logic here to split it into grid_import_kw and grid_export_kw if needed.
            // For now, basic direct mapping.
            record[mappedKey] = value;
        }
    }

    // Convert map to array and sort by timestamp
    return Array.from(timeSeriesMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}
