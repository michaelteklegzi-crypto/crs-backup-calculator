/**
 * SOLARMAN Historical Data API
 * Retrieves historical data for a plant or specific device.
 * 
 * IMPORTANT: Server-side only.
 */

import { solarmanFetch } from './client.js';

/**
 * Retrieve historical data for a specific plant/device within a time range.
 * Note: Solarman API often restricts queries to a single day or short periods.
 * 
 * @param {string} token - Access token
 * @param {string} plantId - Solarman Plant ID
 * @param {string} deviceSn - Solarman Device Serial Number
 * @param {string} startTime - Start time (e.g. '2026-08-17 00:00:00')
 * @param {string} endTime - End time (e.g. '2026-08-17 23:59:59')
 */
export async function getHistoricalData(token, plantId, deviceSn, startTime, endTime) {
    // Endpoints for historical data vary. E.g., /station/v1.0/history or /device/v1.0/historical
    // Using a typical device historical endpoint for detailed metrics
    const endpoint = `/device/v1.0/historical`;
    
    const body = {
        deviceSn: deviceSn,
        startTime: startTime,
        endTime: endTime
    };

    const response = await solarmanFetch(endpoint, {
        method: 'POST',
        token: token,
        body: body
    });

    const data = response.data || response;
    
    // Solarman returns lists of parameter data over time
    // Data typically looks like:
    // { paramList: [ { key: "E_Day", valList: [ { time: 16900000, value: 5.2 } ] } ] }
    // Or similar time-series structures.
    
    return data.paramList || data.dataList || data;
}

/**
 * Retrieve daily aggregated data for a plant (often used to build daily summaries).
 * 
 * @param {string} token - Access token
 * @param {string} plantId - Solarman Plant ID
 * @param {string} year - Year (e.g. '2026')
 * @param {string} month - Month (e.g. '08')
 */
export async function getDailySummaryData(token, plantId, year, month) {
    const endpoint = `/station/v1.0/history/day`;
    
    const body = {
        stationId: plantId,
        year: year,
        month: month
    };

    const response = await solarmanFetch(endpoint, {
        method: 'POST',
        token: token,
        body: body
    });

    return response.data || response;
}
