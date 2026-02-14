/**
 * CRS Backup Power Calculator Logic
 * Version 1.0
 */

// Defaults based on standard engineering practices and prompt
// Defaults based on standard engineering practices and prompt
export const DEFAULT_CONSTANTS = {
    // Solar Constants
    SYSTEM_EFFICIENCY: 0.85,
    DEPTH_OF_DISCHARGE: 0.90, // Lithium Ion assumed as "best tech"
    PEAK_SUN_HOURS: 5.5, // Average for Ethiopia
    INVERTER_OVERSIZE_FACTOR: 1.25,

    // Component Unit Specifications (for sizing)
    SPEC_PV_WATTAGE: 550, // 550W Panel
    SPEC_BATTERY_KWH: 5,   // 5kWh Battery Unit
    SPEC_INVERTER_KW: 5,   // 5kW Inverter Unit

    // Component Unit Costs (ETB)
    COST_UNIT_PV_PANEL: 15000,
    COST_UNIT_BATTERY: 180000,
    COST_UNIT_INVERTER: 85000,

    // Other Costs
    COST_INSTALLATION_FLAT: 50000,
    MAINTENANCE_ANNUAL_SOLAR: 5000, // Fixed annual maintenance for cleaning etc

    // Grid / Comparison Logic
    GRID_PRICE_PER_KWH: 3, // Current Grid Tariff (Tier 1/2) - User can adjust
    GRID_INFLATION_RATE: 0.12, // Annual grid price increase

    // Legacy Generator Constants (Restored for Comparison)
    GEN_CAPEX: 650000, // Adjusted estimate for quality 10kVA Silent Diesel
    GEN_FUEL_CONSUMPTION_LPH: 3.5,
    GEN_MAINTENANCE_COST_PER_HOUR: 50,
    FUEL_PRICE_PER_LITER: 100, // Adjusted market rate
    INFLATION_RATE: 0.15 // Fuel inflation
};

export function calculateSystemSize(loadProfile, outageHours, constants = DEFAULT_CONSTANTS) {
    // 1. Calculate Total Daily Energy (Wh) and Peak Power (W)
    let totalDailyEnergyWh = 0;
    let peakPowerW = 0;

    loadProfile.forEach(item => {
        const dailyWh = item.watts * item.hours * item.quantity;
        totalDailyEnergyWh += dailyWh;
        peakPowerW += item.watts * item.quantity; // Peak assumption
    });

    // 2. Solar PV Sizing
    // Daily Energy / (Sun Hours * Efficiency)
    const requiredPVKw = (totalDailyEnergyWh / 1000) / (constants.PEAK_SUN_HOURS * constants.SYSTEM_EFFICIENCY);

    // 3. Battery Sizing
    const requiredBatteryKwh = ((peakPowerW / 1000) * outageHours) / constants.DEPTH_OF_DISCHARGE;

    // 4. Inverter Sizing
    const requiredInverterKw = (peakPowerW / 1000) * constants.INVERTER_OVERSIZE_FACTOR;

    // 5. Determine Unit Counts (Rounding up to multiple of 5 units logic)
    // Constraint: The user wants the displayed PV, Battery, Inverter capacity to be multiples of 5 (e.g., 5, 10, 15).

    // a. PV Sizing (Multiple of 5 kW)
    const rawPvKw = requiredPVKw;
    const finalPvKw = Math.max(5, Math.ceil(rawPvKw / 5) * 5); // Min 5kW

    // Recalculate panel count to match capacity
    const numPanels = Math.ceil((finalPvKw * 1000) / constants.SPEC_PV_WATTAGE);

    // b. Battery Sizing (Multiple of 5 kWh)
    const rawBatteryKwh = requiredBatteryKwh;
    const finalBatteryKwh = Math.max(5, Math.ceil(rawBatteryKwh / 5) * 5); // Min 5kWh
    const numBatteries = Math.ceil(finalBatteryKwh / constants.SPEC_BATTERY_KWH);

    // c. Inverter Sizing (Multiple of 5 kW)
    const rawInverterKw = requiredInverterKw;
    const finalInverterKw = Math.max(5, Math.ceil(rawInverterKw / 5) * 5); // Min 5kW
    const numInverters = Math.ceil(finalInverterKw / constants.SPEC_INVERTER_KW);

    return {
        totalDailyEnergyWh,
        peakPowerW,
        recommended: {
            pvKw: finalPvKw,
            batteryKwh: finalBatteryKwh,
            inverterKw: finalInverterKw,
            units: {
                panels: numPanels,
                batteries: numBatteries,
                inverters: numInverters
            }
        }
    };
}

export function calculateFinancials(systemSize, userInputs, constants) {
    const { units, pvKw } = systemSize.recommended;
    const { outageHoursPerDay } = userInputs;

    // 1. CAPEX: Solar System
    const costPV = units.panels * constants.COST_UNIT_PV_PANEL;
    const costBattery = units.batteries * constants.COST_UNIT_BATTERY;
    const costInverter = units.inverters * constants.COST_UNIT_INVERTER;
    const totalCapexSolar = costPV + costBattery + costInverter + constants.COST_INSTALLATION_FLAT;

    // 2. CAPEX: Diesel Generator
    const totalCapexDiesel = constants.GEN_CAPEX;

    // 3. Operational Costs (OPEX) Setup
    const dailyLoadKwh = systemSize.totalDailyEnergyWh / 1000;
    const annualLoadKwh = dailyLoadKwh * 365;

    // Diesel Scenario:
    // - Outage Consumption: Covered by Diesel
    // - Normal Consumption: Covered by Grid
    const dailyOutageKwh = (outageHoursPerDay / 24) * dailyLoadKwh; // Approximation
    const annualOutageKwh = dailyOutageKwh * 365;
    const annualGridKwh_DieselScenario = annualLoadKwh - annualOutageKwh;

    const dailyFuelLiters = constants.GEN_FUEL_CONSUMPTION_LPH * outageHoursPerDay;
    const annualFuelCostStart = dailyFuelLiters * 365 * constants.FUEL_PRICE_PER_LITER;
    const annualGenMaintenance = outageHoursPerDay * 365 * constants.GEN_MAINTENANCE_COST_PER_HOUR;

    // Solar Scenario:
    // - Generation: Covered by Solar
    // - Deficit: Covered by Grid (Residual)
    // - Outage: Covered by Battery (already paid for in Capex)
    const annualSolarGenKwh = pvKw * constants.PEAK_SUN_HOURS * constants.SYSTEM_EFFICIENCY * 365; // Simple Self-Consumption Model
    const annualGridKwh_SolarScenario = Math.max(0, annualLoadKwh - annualSolarGenKwh);

    let cumulativeSolar = totalCapexSolar;
    let cumulativeDiesel = totalCapexDiesel;

    const comparisonData = [];

    // YEAR 0
    comparisonData.push({
        year: 0,
        Solar: Math.round(cumulativeSolar),
        Diesel: Math.round(cumulativeDiesel),
        SolarYearly: 0,
        DieselYearly: 0
    });

    for (let year = 1; year <= 7; year++) {
        // Inflation factors
        const gridRate = Math.pow(1 + constants.GRID_INFLATION_RATE, year - 1);
        const fuelRate = Math.pow(1 + constants.INFLATION_RATE, year - 1);

        // --- Diesel Path Costs ---
        // 1. Grid Bill
        const gridCostDiesel = annualGridKwh_DieselScenario * constants.GRID_PRICE_PER_KWH * gridRate;
        // 2. Generator OpEx (Fuel + Maint)
        const genCost = (annualFuelCostStart * fuelRate) + annualGenMaintenance;
        const yearlyDiesel = gridCostDiesel + genCost;

        cumulativeDiesel += yearlyDiesel;

        // --- Solar Path Costs ---
        // 1. Residual Grid Bill
        const gridCostSolar = annualGridKwh_SolarScenario * constants.GRID_PRICE_PER_KWH * gridRate;
        // 2. Maintenance
        const yearlySolar = constants.MAINTENANCE_ANNUAL_SOLAR + gridCostSolar;

        cumulativeSolar += yearlySolar;

        comparisonData.push({
            year,
            Solar: Math.round(cumulativeSolar),
            Diesel: Math.round(cumulativeDiesel),
            SolarYearly: Math.round(yearlySolar),
            DieselYearly: Math.round(yearlyDiesel)
        });
    }

    // ROI
    const roiEntry = comparisonData.find(y => y.Solar < y.Diesel);
    const roiYears = roiEntry ? roiEntry.year : "7+";

    // --- REPORTING METRICS ---
    // 1. Operational Cost Snapshot (Year 3)
    // Year 3 is 2 years of inflation after Year 1 base
    const gridRateY3 = Math.pow(1 + constants.GRID_INFLATION_RATE, 2);
    const fuelRateY3 = Math.pow(1 + constants.INFLATION_RATE, 2);

    const year3GridCostDiesel = annualGridKwh_DieselScenario * constants.GRID_PRICE_PER_KWH * gridRateY3;
    const year3GenCost = (dailyFuelLiters * 365 * constants.FUEL_PRICE_PER_LITER * fuelRateY3) + annualGenMaintenance;
    const year3TotalDiesel = Math.round(year3GridCostDiesel + year3GenCost);

    const year3GridCostSolar = annualGridKwh_SolarScenario * constants.GRID_PRICE_PER_KWH * gridRateY3;
    const year3TotalSolar = Math.round(constants.MAINTENANCE_ANNUAL_SOLAR + year3GridCostSolar);

    // 2. Utility Bill Savings (Year 1 Estimate)
    const annualBillSavings = Math.round((annualGridKwh_DieselScenario - annualGridKwh_SolarScenario) * constants.GRID_PRICE_PER_KWH);

    // 3. Solar Fraction / Self-Sufficiency
    const solarFraction = Math.min(100, Math.round(((annualLoadKwh - annualGridKwh_SolarScenario) / annualLoadKwh) * 100));

    return {
        capexSolar: totalCapexSolar,
        capexDiesel: totalCapexDiesel,
        roiYears,
        comparisonData,
        analysis: {
            year3TotalDiesel,
            year3TotalSolar,
            annualBillSavings,
            solarFraction
        }
    };
}

export function calculateHourlyEnergy(systemSize, totalDailyLoadWh) {
    const { pvKw, batteryKwh } = systemSize.recommended;
    const hourlyData = [];

    // Simulation state
    let batterySoC = batteryKwh * 0.5 * 1000; // Start at 50% capacity (in Wh)
    const batteryCapacityWh = batteryKwh * 1000;

    // Load Profile (Double Hump - Morning & Evening peaks)
    // Normalized distribution percentages for 24 hours
    const loadDistribution = [
        0.02, 0.02, 0.02, 0.02, 0.02, 0.04, // 0-5
        0.08, 0.10, 0.06, 0.04, 0.03, 0.03, // 6-11
        0.03, 0.03, 0.03, 0.04, 0.05, 0.08, // 12-17
        0.10, 0.10, 0.08, 0.06, 0.04, 0.03  // 18-23
    ];

    for (let i = 0; i < 24; i++) {
        // 1. Calculate Solar Generation for this hour (Simple Gaussian centered at 13:00)
        // Peak is roughly pvKw (derated slightly for realism 85%)
        const hourOffset = i - 13;
        const sigma = 2.5; // Spread of sunlight
        const solarIntensity = Math.exp(-0.5 * (hourOffset / sigma) ** 2);
        const solarGenWh = (pvKw * 1000 * 0.85) * solarIntensity;

        // 2. Calculate Load for this hour
        // If total load is very low, distribute evenly, otherwise use profile
        const loadWh = totalDailyLoadWh * loadDistribution[i];

        // 3. Battery Logic
        let netEnergy = solarGenWh - loadWh;
        let gridImport = 0;
        let gridExport = 0;
        let batteryFlow = 0; // +Charging, -Discharging

        if (netEnergy > 0) {
            // Surplus -> Charge Battery
            const spaceInBattery = batteryCapacityWh - batterySoC;
            const chargeAmount = Math.min(netEnergy, spaceInBattery);
            batterySoC += chargeAmount;
            batteryFlow = chargeAmount;

            // Remaining -> Grid Export / Wasted
            gridExport = netEnergy - chargeAmount;
        } else {
            // Deficit -> Discharge Battery
            const deficit = Math.abs(netEnergy);
            const energyAvailable = batterySoC; // Can run to 0 for sim
            const dischargeAmount = Math.min(deficit, energyAvailable);
            batterySoC -= dischargeAmount;
            batteryFlow = -dischargeAmount;

            // Remaining -> Grid Import / Generator
            gridImport = deficit - dischargeAmount;
        }

        hourlyData.push({
            hour: `${i}:00`,
            solar: Math.round(solarGenWh),
            load: Math.round(loadWh),
            batteryState: Math.round((batterySoC / batteryCapacityWh) * 100), // %
            batteryFlow: Math.round(batteryFlow),
            gridImport: Math.round(gridImport),
            gridExport: Math.round(gridExport)
        });
    }

    return hourlyData;
}

export function checkOptimality(systemSize, outageHours) {
    const { pvKw, batteryKwh, inverterKw } = systemSize.recommended;
    const warnings = [];

    // 1. Battery Duration Analysis
    // effective capacity at usage
    const usableBatteryKwh = batteryKwh * 0.9; // Depth of discharge
    // peak load estimation
    const peakLoadKw = systemSize.peakPowerW / 1000;

    // Duration at peak load
    const durationAtPeak = usableBatteryKwh / peakLoadKw;

    if (durationAtPeak < outageHours * 0.8) {
        warnings.push({
            type: 'warning',
            message: `Battery size (${batteryKwh} kWh) might be tight for ${outageHours} hours if running all appliances at once. Consider reducing load or increasing duration.`
        });
    } else {
        warnings.push({
            type: 'success',
            message: `Battery provides excellent backup for ${outageHours} hours.`
        });
    }

    // 2. Solar Recharge Analysis
    // Average daily gen
    const dailyGenKwh = pvKw * 5.5 * 0.85;

    if (dailyGenKwh < usableBatteryKwh) {
        warnings.push({
            type: 'warning',
            message: `Solar Array (${pvKw} kW) may struggle to fully recharge the battery in one day after a full drain.`
        });
    } else {
        warnings.push({
            type: 'success',
            message: `Solar Array is optimally sized to recharge the battery quickly.`
        });
    }

    // 3. Inverter Headroom
    const headroom = (inverterKw - peakLoadKw) / peakLoadKw;
    if (headroom < 0.2) {
        warnings.push({
            type: 'warning',
            message: `Inverter (${inverterKw} kW) is running close to capacity. Avoid adding more heavy appliances.`
        });
    }

    // 4. Grid dependency check
    if (dailyGenKwh > systemSize.totalDailyEnergyWh / 1000 * 1.5) {
        warnings.push({
            type: 'info',
            message: `System generates significantly more energy than daily use. You will reduce your grid bill to near zero.`
        });
    }

    return warnings;
}
