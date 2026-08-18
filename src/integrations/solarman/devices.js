/**
 * SOLARMAN Devices API
 * Discovers and retrieves devices (inverters, meters, etc.) for a specific plant.
 * 
 * IMPORTANT: Server-side only.
 */

import { solarmanFetch } from './client.js';

/**
 * Retrieve a paginated list of devices for a specific plant.
 * 
 * @param {string} token - The active access token
 * @param {string} plantId - The Solarman Plant ID
 * @param {number} page - Page number (default 1)
 * @param {number} size - Page size (default 20)
 * @returns {Promise<Object>} Object containing the list of devices and total count
 */
export async function getDevices(token, plantId, page = 1, size = 20) {
    const endpoint = `/device/v1.0/list`;
    
    // According to typical API structures for Solarman:
    const body = {
        stationId: plantId,
        page: page,
        size: size
    };

    const response = await solarmanFetch(endpoint, {
        method: 'POST',
        token: token,
        body: body
    });

    const data = response.data || response;
    
    const rawDevices = data.list || data.deviceList || [];
    
    const devices = rawDevices.map(d => ({
        deviceSn: d.deviceSn || d.sn,
        deviceType: d.deviceType || 'UNKNOWN',
        name: d.name || d.deviceName,
        status: d.status || d.deviceState,
        _raw: d
    }));

    return {
        total: data.total || devices.length,
        devices: devices,
        page: page,
        size: size
    };
}
