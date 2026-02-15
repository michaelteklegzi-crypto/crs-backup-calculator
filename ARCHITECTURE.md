# CRS Platform Architecture
> Version: 2.0.0 (Stabilized)

Measurement-Grade Energy Infrastructure Platform.
This document defines the architectural layers, data models, and API structures for the CRS platform, ensuring scalability across Web (Desktop/Mobile) and future Native applications.

---

## 🏗 System Layering

The CRS platform is strictly divided into three architectural layers to ensure stability and reusability.

### **Layer 1: Calculation Engine (Core Logic)**
*   **Role**: Pure functional logic for sizing, financial modeling, and performance simulation.
*   **State**: Stateless. Input -> Process -> Output.
*   **Location**: `src/utils/logic.js` (Current), Future: Shared NPM Package / Edge Function.
*   **Dependents**: Used by Web UI (Layer 2) and Native Apps (Layer 3).
*   **Key Functions**:
    *   `calculateSystemSize(loads, preferences)`: Determines generic hardware requirements.
    *   `calculateFinancials(system, marketData)`: Generates TCO, ROI, and Cashflow models.
    *   `calculateHourlyEnergy(system, loadProfile)`: Simulates 24h performance vectors.

### **Layer 2: Web Interface (The Current Platform)**
*   **Role**: The primary interaction layer for users and consultants.
*   **Implementation**: React (Vite) + Supabase.
*   **Dual-State UX**:
    *   **Desktop Mode**: Analytical Workbench (Multi-column, dense data).
    *   **Mobile Mode**: Guided Builder (Step-based, stack layout).
*   **Routing**: Single Page Application (SPA) with virtual tab routing.

### **Layer 3: Native Interface (Future)**
*   **Role**: Offline-first tool for field consultants.
*   **Implementation**: React Native / Swift (Future).
*   **Data Sync**: Queued sync to Supabase when online.
*   **Logic**: Imports Layer 1 logic directly for offline calculations.

---

## 💾 Data Models & Schema

### 1. Load Profile Object
The atomic unit of energy demand.

```javascript
/**
 * @typedef {Object} LoadItem
 * @property {string} id - Unique UUID
 * @property {string} name - Human readable name (e.g. "Air Conditioner")
 * @property {number} watts - Rated power consumption
 * @property {number} quantity - Number of units
 * @property {number} hours - Daily runtime hours (0-24)
 * @property {string} category - 'essential' | 'comfort' | 'critical'
 * @property {boolean} isCustom - User defined vs Preset
 */
```

### 2. System Configuration (The "Design")
The output of the sizing engine.

```javascript
/**
 * @typedef {Object} SystemDesign
 * @property {Object} recommended
 * @property {number} recommended.pvKw - Total Solar Capacity (kWp)
 * @property {number} recommended.batteryKwh - Total Storage (kWh)
 * @property {number} recommended.inverterKw - Total Inversion (kW)
 * @property {Object} units - Hardware counts (panels, batteries, inverters)
 * @property {number} totalDailyEnergyWh - Total consumption
 * @property {number} peakPowerW - Max coincident demand
 */
```

### 3. Project Schema (Save Data)
Stored in Supabase `projects` table.

```javascript
/**
 * @typedef {Object} Project
 * @property {uuid} id
 * @property {uuid} user_id
 * @property {string} name - Project Title
 * @property {string} client_name - Optional
 * @property {string} location - GPS or City
 * @property {LoadItem[]} load_profile - JSONB
 * @property {SystemDesign} system_design - JSONB (Snapshot)
 * @property {Object} financial_snapshot - JSONB (ROI, CAPEX at time of design)
 * @property {number} outage_hours - Design constraint
 * @property {string} status - 'draft' | 'proposed' | 'sold'
 * @property {timestamp} created_at
 * @property {timestamp} updated_at
 */
```

---

## 🔌 API Structure (Future V1)

Standardized endpoints for the Calculation Engine (if moved to Serverless).

### `POST /api/v1/calculate`
**Request:**
```json
{
  "loads": [...LoadItems],
  "preferences": {
    "outageHours": 4,
    "userType": "residential",
    "region": "ET-ADDIS" // For future solar irradiation data
  }
}
```

**Response:**
```json
{
  "system": { ...SystemDesign },
  "financials": {
    "capex": 450000,
    "roi_years": 4.2,
    "comparison_table": [...]
  },
  "simulation": {
    "hourly_vectors": [...]
  }
}
```

### `POST /api/v1/projects`
**Request:**
```json
{
  "project_name": "Villa 42 Backup",
  "client_id": "cust_123",
  "loads": [...],
  "design_snapshot": {...}
}
```

---

## 🔐 Security & Operations

### Authentication
*   **Provider**: Supabase Auth (JWT).
*   **Roles**:
    *   `public`: Guest Calculator (No save).
    *   `user`: Residential Client (Save own projects).
    *   `consultant`: CRS Agent (Manage multiple client projects, see margins).
    *   `admin`: System Config (Pricing, Hardware specs).

### Deployment Strategy
*   **Web**: Vercel / Netlify (CI/CD from `main`).
*   **Database**: Supabase (PostgreSQL).
*   **Edge Functions**: Financial Logic (Optional for proprietary formulas).

---

## 📝 Development Guidelines

1.  **Logic Separation**: Never write calculation logic inside UI components. Always refer to `src/utils/logic.js`.
2.  **Responsive Gates**: Use `MainLayout` media queries to switch between Desktop/Mobile views. Do not create separate URLs (m.site.com).
3.  **Type Safety**: Use JSDoc or PropTypes to enforce the Data Models defined above.
