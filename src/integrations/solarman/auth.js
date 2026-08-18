/**
 * SOLARMAN Authentication Service
 * Handles obtaining and refreshing access tokens using the APP_ID and APP_SECRET.
 * 
 * IMPORTANT: Server-side only.
 */

import crypto from 'crypto'; // Node.js built-in, adjust if using Edge Functions that need Web Crypto API
import { solarmanFetch } from './client.js';

/**
 * Encrypt a string (e.g. password) using SHA-256 as required by Solarman API
 * (Solarman requires a SHA-256 hash of the password for auth)
 */
export function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Authenticate with SOLARMAN API
 * Returns the access token, refresh token, and expiration.
 */
export async function authenticate(appId, appSecret, username, passwordHash) {
    const endpoint = `/account/v1.0/token?appId=${appId}`;
    
    // As per Solarman OpenAPI, token request usually requires:
    // POST /account/v1.0/token?appId=...
    // Body: { appSecret, email: username, password: passwordHash }
    // (Note: The exact fields might vary, email vs username, adjusting for typical standard)
    
    const body = {
        appSecret: appSecret,
        email: username, // Or 'username': username depending on exact Solarman version, usually email
        password: passwordHash
    };

    const response = await solarmanFetch(endpoint, {
        method: 'POST',
        body: body
    });

    // Response typically contains: { access_token, refresh_token, expires_in }
    // Standardize the return
    return {
        accessToken: response.access_token || response.data?.access_token,
        refreshToken: response.refresh_token || response.data?.refresh_token,
        expiresIn: response.expires_in || response.data?.expires_in, // typically in seconds
        retrievedAt: new Date().toISOString()
    };
}

/**
 * Refresh an existing token
 */
export async function refreshToken(appId, appSecret, existingRefreshToken) {
    // If the API supports refresh tokens directly
    const endpoint = `/account/v1.0/token?appId=${appId}`;
    // Assuming refresh grant type
    const body = {
        appSecret: appSecret,
        grant_type: 'refresh_token',
        refresh_token: existingRefreshToken
    };

    const response = await solarmanFetch(endpoint, {
        method: 'POST',
        body: body
    });

    return {
        accessToken: response.access_token || response.data?.access_token,
        refreshToken: response.refresh_token || response.data?.refresh_token,
        expiresIn: response.expires_in || response.data?.expires_in,
        retrievedAt: new Date().toISOString()
    };
}
