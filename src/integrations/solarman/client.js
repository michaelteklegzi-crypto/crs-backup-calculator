/**
 * SOLARMAN API Base Client
 * Handles HTTP requests, rate limiting, and standard error handling to the SOLARMAN API.
 * 
 * IMPORTANT: This module MUST be executed in a server-side environment (Node.js/Vercel/Edge).
 * It must NEVER be imported directly into a frontend React component.
 */

const DEFAULT_BASE_URL = process.env.SOLARMAN_API_BASE_URL || 'https://globalapi.solarmanpv.com';
const APP_ID = process.env.SOLARMAN_APP_ID;
const APP_SECRET = process.env.SOLARMAN_APP_SECRET;

/**
 * Standardized fetch wrapper for SOLARMAN API
 */
export async function solarmanFetch(endpoint, options = {}, retries = 3) {
    const url = `${DEFAULT_BASE_URL}${endpoint}`;
    
    // Add required query parameter (appId) for most requests, though usually it's in the body for POST, or headers.
    // Assuming standard Bearer token auth if access_token is provided in options.
    const headers = {
        'Content-Type': 'application/json',
        ...(options.token ? { 'Authorization': `Bearer ${options.token}` } : {}),
        ...options.headers
    };

    const fetchOptions = {
        method: options.method || 'GET',
        headers,
    };

    if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, fetchOptions);

        if (response.status === 429) {
            // Rate limit handling
            if (retries > 0) {
                const retryAfter = response.headers.get('Retry-After') || 2;
                console.warn(`SOLARMAN API Rate Limit Hit. Retrying in ${retryAfter} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                return solarmanFetch(endpoint, options, retries - 1);
            } else {
                throw new Error('SOLARMAN API Rate Limit Exceeded.');
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SOLARMAN API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        
        // Solarman often returns a 'success' flag or 'code' inside the JSON
        if (data.code !== undefined && data.code !== 200 && data.success !== true) {
            throw new Error(`SOLARMAN API Logic Error: Code ${data.code} - ${data.msg || 'Unknown error'}`);
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError' || error.message.includes('fetch')) {
             if (retries > 0) {
                 await new Promise(resolve => setTimeout(resolve, 1000));
                 return solarmanFetch(endpoint, options, retries - 1);
             }
        }
        throw error;
    }
}
