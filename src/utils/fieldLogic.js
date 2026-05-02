/**
 * Field Logic Utilities
 * Contains engineering calculations for both Single-Phase and Three-Phase systems.
 */

// P (kW) = V × I × PF / 1000 (Single Phase)
// P (kW) = √3 × V × I × PF / 1000 (Three Phase)
export const calculatePowerKW = (voltage, current, powerFactor, phaseType) => {
    if (!voltage || !current) return 0;
    const pf = powerFactor || 0.85;
    if (phaseType === 'three_phase') {
        return (Math.sqrt(3) * voltage * current * pf) / 1000;
    }
    // single_phase
    return (voltage * current * pf) / 1000;
};

// Calculate average current and phase imbalance (for Three Phase)
export const calculateThreePhaseMetrics = (r, s, t) => {
    const currents = [r, s, t].map(Number).filter(n => !isNaN(n));
    if (currents.length !== 3) return { average: 0, maxDeviationPercent: 0, isImbalanced: false };
    
    const average = (currents[0] + currents[1] + currents[2]) / 3;
    if (average === 0) return { average: 0, maxDeviationPercent: 0, isImbalanced: false };

    const deviations = currents.map(c => Math.abs(c - average));
    const maxDeviation = Math.max(...deviations);
    const maxDeviationPercent = (maxDeviation / average) * 100;
    
    return {
        average,
        maxDeviationPercent,
        isImbalanced: maxDeviationPercent > 20
    };
};

export const calculateEnergyKWh = (powerKw, hours) => {
    return powerKw * (hours || 0);
};

export const calculateEquipmentLoad = (equipmentList) => {
    if (!equipmentList || !Array.isArray(equipmentList)) return { totalKw: 0, totalKwh: 0 };
    
    let totalKw = 0;
    let totalKwh = 0;
    
    equipmentList.forEach(eq => {
        const qty = Number(eq.quantity) || 0;
        const watts = Number(eq.power_watts) || 0;
        const hours = Number(eq.operating_hours) || 0;
        
        const kw = (qty * watts) / 1000;
        totalKw += kw;
        totalKwh += (kw * hours);
    });
    
    return { totalKw, totalKwh };
};

export const runCrossCheck = (measuredPeakKw, equipmentTotalKw) => {
    if (!measuredPeakKw || !equipmentTotalKw) return { differencePercent: 0, isMismatched: false };
    
    // Compare Peak load vs Total Equipment Load
    const difference = Math.abs(measuredPeakKw - equipmentTotalKw);
    const maxVal = Math.max(measuredPeakKw, equipmentTotalKw);
    
    if (maxVal === 0) return { differencePercent: 0, isMismatched: false };
    
    const differencePercent = (difference / maxVal) * 100;
    
    return {
        differencePercent,
        isMismatched: differencePercent > 15
    };
};
