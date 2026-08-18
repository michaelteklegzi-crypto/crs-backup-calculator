/**
 * SOLARMAN Plants API
 * Discovers and retrieves plants/installations for an authenticated connection.
 * 
 * IMPORTANT: Server-side only.
 */

import { solarmanFetch } from './client.js';

/**
 * Retrieve a paginated list of plants associated with the account.
 * 
 * @param {string} token - The active access token
 * @param {number} page - Page number (default 1)
 * @param {number} size - Page size (default 20)
 * @returns {Promise<Object>} Object containing the list of plants and total count
 */
export async function getPlants(token, page = 1, size = 20) {
    // Solarman API typically uses POST for pagination queries on plants
    // e.g. /station/v1.0/list
    const endpoint = `/station/v1.0/list`;
    
    const body = {
        page: page,
        size: size
    };

    const response = await solarmanFetch(endpoint, {
        method: 'POST',
        token: token,
        body: body
    });

    const data = response.data || response;
    
    // Normalize the return structure
    // Ensure we handle different potential structures of Solarman API
    const rawPlants = data.list || data.stationList || [];
    
    const plants = rawPlants.map(p => ({
        solarmanPlantId: p.id || p.stationId,
        name: p.name || p.stationName,
        location: p.location || p.address || 'Unknown',
        capacityKw: p.capacity || p.installedCapacity || 0,
        status: p.status || p.stationStatus || 'Unknown',
        commissioningDate: p.commissioningDate || null,
        // Preserve raw for debugging/troubleshooting
        _raw: p
    }));

    return {
        total: data.total || plants.length,
        plants: plants,
        page: page,
        size: size
    };
}

/**
 * Retrieve details for a specific plant
 */
export async function getPlantDetails(token, plantId) {
    // Some versions use /station/v1.0/info
    const endpoint = `/station/v1.0/info`;
    const body = { id: plantId }; // or stationId: plantId
    
    const response = await solarmanFetch(endpoint, {
        method: 'POST',
        token: token,
        body: body
    });
    
    return response.data || response;
}
