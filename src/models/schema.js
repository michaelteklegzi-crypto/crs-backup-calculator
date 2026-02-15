/**
 * CRS Data Models & Schemas
 * Version 2.0.0
 * 
 * Defines the critical data structures used across the application.
 * These are the single source of truth for Web UI and future Native integrations.
 */

// --- 1. Load Data Structure ---

/**
 * Represents a single appliance or load item.
 * @typedef {Object} LoadItem
 * @property {string} id - Unique identifier (UUID or timestamp)
 * @property {string} name - Human readable name (e.g. "Air Conditioner")
 * @property {number} watts - Rated power consumption in Watts
 * @property {number} quantity - Number of units
 * @property {number} hours - Daily runtime hours (0-24)
 * @property {boolean} [isCustom] - Whether the item was manually added by user
 * @property {string} [category] - Optional category for grouping (e.g. 'kitchen', 'office')
 */

export const EMPTY_LOAD_ITEM = {
    id: '',
    name: '',
    watts: 0,
    quantity: 1,
    hours: 0,
    isCustom: false
};

// --- 2. System Configuration (Design Output) ---

/**
 * The engineered system design output from the calculation engine.
 * @typedef {Object} SystemDesign
 * @property {Object} recommended - Hardware specifications
 * @property {number} recommended.pvKw - Solar Array Size (kW)
 * @property {number} recommended.batteryKwh - Battery Bank Size (kWh)
 * @property {number} recommended.inverterKw - Inverter Rating (kW)
 * @property {Object} units - Physical unit counts
 * @property {number} units.panels - Number of PV panels
 * @property {number} units.batteries - Number of battery modules
 * @property {number} units.inverters - Number of inverter units
 * @property {number} totalDailyEnergyWh - Calculated daily consumption
 * @property {number} peakPowerW - Maximum coincident power demand
 */

// --- 3. Financial Model (Investment Output) ---

/**
 * The financial analysis and projection data.
 * @typedef {Object} FinancialModel
 * @property {number} capexSolar - Total upfront investment for Solar solution
 * @property {number} capexDiesel - Total upfront investment for Generator solution
 * @property {number} roiYears - Return on Investment period (years)
 * @property {Object} analysis - Detailed financial analysis metrics
 * @property {number} analysis.annualBillSavings - Yearly savings vs Grid
 * @property {number} analysis.solarFraction - % of energy from Solar
 * @property {number} analysis.tco5YearSolar - 5yr Total Cost of Ownership (Solar)
 * @property {number} analysis.tco5YearDiesel - 5yr Total Cost of Ownership (Diesel)
 * @property {Array<{year: number, Solar: number, Diesel: number}>} comparisonData - Yearly cumulative cost data
 */

// --- 4. User Configuration & Preferences ---

/**
 * User-specific settings for the calculation.
 * @typedef {Object} UserConfig
 * @property {number} outageHours - Desired backup duration (hours)
 * @property {string} userType - 'residential' | 'sme' | 'commercial'
 * @property {string} [region] - Geographic region (for solar irradiation data - Future)
 */

export const DEFAULT_USER_CONFIG = {
    outageHours: 4,
    userType: 'residential',
    region: 'ET-ADDIS'
};

// --- 5. Project Schema (Database) ---

/**
 * The structure of a saved project in the database.
 * @typedef {Object} Project
 * @property {string} id - UUID
 * @property {string} user_id - Owner UUID
 * @property {string} name - Project Name
 * @property {string} [client_name] - Name of the client (for consultants)
 * @property {LoadItem[]} load_profile - The appliance list JSON
 * @property {SystemDesign} system_design - The calculated system snapshot
 * @property {FinancialModel} financial_snapshot - The financial metrics snapshot
 * @property {UserConfig} config - The configuration used for calculation
 * @property {string} status - 'draft' | 'proposed' | 'accepted'
 * @property {string} created_at - ISO timestamp
 */
