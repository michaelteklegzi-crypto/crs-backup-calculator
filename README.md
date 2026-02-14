# Solarazma | CRS Backup Power Calculator

A premium, interactive solar design tool built for **Climate Resilient Solutions (CRS)**. 
Inspired by the "Solarazma" philosophy, this calculator provides clean, real-time visualization of energy flows and financial impacts.

## Key Features
- **Real-Time Design**: System sizing updates instantly as you adjust appliances and constraints.
- **Hourly Visualization**: See a 24-hour simulation of Solar Generation vs. Consumption vs. Battery State of Charge.
- **Financial Transparency**: Clear comparison of Solar CAPEX vs. Diesel OPEX over 7 years.
- **Glassmorphic UI**: A modern, dark-themed interface designed for clarity and engagement.

## Project Structure
- `src/components/`
  - `Calculator.jsx`: Interactive load builder.
  - `Results.jsx`: Dual-view visualization (Energy Flow & Financials).
  - `AdminPanel.jsx`: Configuration for extensive system parameters.
- `src/utils/logic.js`: 
  - `calculateSystemSize`: Autosizing based on load.
  - `calculateHourlyEnergy`: 24h simulation engine (Gaussian solar + weighted load profiles).
  - `calculateFinancials`: ROI and TCO engine.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Locally**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Design Philosophy
This app follows the "Solarazma" principles:
- **Educational**: Helps users understand *when* they use energy, not just how much.
- **Transparent**: Assumptions are visible (via Admin panel) and results are explained clearly.
- **Aesthetic**: Uses high-contrast energy colors (Amber/Emerald) against deep slate backgrounds for readability and "premium" feel.
