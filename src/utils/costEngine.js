import { supabase } from './supabaseClient';

// Constants for fallback
const FALLBACK_EXCHANGE_RATE = 126.00; // Safe default if API fails

/**
 * Fetches the latest USD to ETB exchange rate.
 * Tries external API first, falls back to database or hardcoded value.
 */
export async function fetchExchangeRate() {
    try {
        // Try free API first (CBE scraping is blocked by CORS in browser)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        const rate = data.rates.ETB;

        if (rate) {
            // Log successful fetch
            await supabase.from('exchange_rates').insert([{
                rate_buy: rate * 0.95, // Simulated spread
                rate_sell: rate,
                source: 'ExchangeRate-API',
                status: 'success'
            }]);
            return rate;
        }
        throw new Error('API returned no ETB rate');
    } catch (error) {
        console.warn('Exchange Rate Fetch Failed:', error);

        // Fallback: Get last known rate from DB
        const { data, error: dbError } = await supabase
            .from('exchange_rates')
            .select('rate_sell')
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single();

        if (data) return data.rate_sell;

        return FALLBACK_EXCHANGE_RATE;
    }
}

/**
 * Calculates landed cost for a specific equipment type.
 * 
 * Formula:
 * 1. Import Cost ETB = USD Cost * Exchange Rate
 * 2. Shipping ETB = USD Shipping * Exchange Rate
 * 3. Base Landed = Import ETB + Shipping ETB + Inland Transport + Port Handling + (Import ETB * Duty %)
 * 4. Final Cost = Base Landed * (1 + Margin %)
 */
export function calculateLandedCost(equipment, exchangeRate) {
    const importEtb = equipment.import_usd * exchangeRate;
    const shippingEtb = equipment.shipping_usd * exchangeRate;

    // Duty is percentage of Import Value
    const dutyEtb = importEtb * (equipment.customs_duty_percent / 100);

    const baseLandedCost = importEtb + shippingEtb + dutyEtb + equipment.inland_transport_etb + (equipment.port_handling_etb || 0);

    const finalCost = baseLandedCost * (1 + (equipment.margin_percent / 100));

    return Math.round(finalCost);
}

/**
 * Main Orchestrator:
 * 1. Fetches Exchange Rate
 * 2. Fetches Equipment Cost Settings
 * 3. Calculates New Unit Costs
 * 4. Updates System Parameters (in memory/DB)
 */
export async function runCostEngine() {
    // 1. Get Rate
    const exchangeRate = await fetchExchangeRate();

    // 2. Get Equipment Settings
    const { data: equipmentList, error } = await supabase
        .from('equipment_import_costs')
        .select('*');

    if (error || !equipmentList) throw new Error('Failed to fetch equipment costs');

    // 3. Calculate
    const results = {};
    const equipmentMap = {
        'pv_panel': 'COST_UNIT_PV_PANEL',
        'battery_unit': 'COST_UNIT_BATTERY',
        // Map 1PH 5kW to the standard 'COST_UNIT_INVERTER' for backward compatibility
        'inverter_1ph_5kw': 'COST_UNIT_INVERTER',
        // Also map it to a specific key if we want to be explicit later
        'inverter_3ph_15kw': 'COST_UNIT_INVERTER_3PH'
    };

    for (const item of equipmentList) {
        const finalCost = calculateLandedCost(item, exchangeRate);
        const paramKey = equipmentMap[item.equipment_type];

        if (paramKey) {
            results[paramKey] = finalCost;

            // Log Calculation
            await supabase.from('calculated_unit_costs').insert([{
                equipment_type: item.equipment_type,
                exchange_rate_used: exchangeRate,
                final_unit_cost_etb: finalCost
            }]);
        }
    }

    return {
        exchangeRate,
        costs: results
    };
}
