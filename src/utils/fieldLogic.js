/**
 * Field Logic Utilities — Engineering-Grade Calculation Engine
 * 
 * Contains all engineering calculations for Single-Phase and Three-Phase
 * backup system load assessment, sizing, validation, and reporting.
 * 
 * FORMULAS:
 *   Single Phase:  P (kW) = V × I × PF / 1000
 *   Three Phase:   P (kW) = √3 × V × I × PF / 1000
 */

// ─────────────────────────────────────────────────────
// 1. CORE CALCULATIONS (preserved from original)
// ─────────────────────────────────────────────────────

export const calculatePowerKW = (voltage, current, powerFactor, phaseType) => {
    if (!voltage || !current) return 0;
    const pf = powerFactor || 0.85;
    if (phaseType === 'three_phase') {
        return (Math.sqrt(3) * voltage * current * pf) / 1000;
    }
    // single_phase
    return (voltage * current * pf) / 1000;
};

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
    
    const difference = Math.abs(measuredPeakKw - equipmentTotalKw);
    const maxVal = Math.max(measuredPeakKw, equipmentTotalKw);
    
    if (maxVal === 0) return { differencePercent: 0, isMismatched: false };
    
    const differencePercent = (difference / maxVal) * 100;
    
    return {
        differencePercent,
        isMismatched: differencePercent > 15
    };
};


// ─────────────────────────────────────────────────────
// 2. ENGINEERING DESIGN LOAD DETERMINATION
// ─────────────────────────────────────────────────────

/**
 * Design Load = MAX(Measured Peak, Measured Continuous × Growth Factor)
 * @param {number} measuredPeakKw   Highest measured operational load (kW)
 * @param {number} measuredContKw   Normal/continuous measured load (kW)
 * @param {number} growthFactor     Future growth allowance (default 1.20)
 * @returns {number} Design load in kW
 */
export const calculateDesignLoad = (measuredPeakKw, measuredContKw, growthFactor = 1.20) => {
    const peakVal = measuredPeakKw || 0;
    const contWithGrowth = (measuredContKw || 0) * growthFactor;
    return Math.max(peakVal, contWithGrowth);
};


// ─────────────────────────────────────────────────────
// 3. BATTERY SIZING
// ─────────────────────────────────────────────────────

/**
 * Battery Capacity (kWh) = Design Load × Backup Duration × System Loss Margin
 * @param {number} designLoadKw     Engineering design load (kW)
 * @param {number} backupHours      Required autonomy hours
 * @param {number} lossMargin       System loss compensation (default 1.15)
 * @returns {{ rawKwh: number, roundedKwh: number }} Raw and rounded battery capacity
 */
export const calculateBatteryCapacity = (designLoadKw, backupHours = 4, lossMargin = 1.15) => {
    const rawKwh = (designLoadKw || 0) * backupHours * lossMargin;
    // Round up to nearest 5kWh battery module increment
    const roundedKwh = Math.ceil(rawKwh / 5) * 5;
    return { rawKwh, roundedKwh };
};


// ─────────────────────────────────────────────────────
// 4. INVERTER SIZING
// ─────────────────────────────────────────────────────

/**
 * Inverter = Design Load × 1.25 (surge headroom), rounded to commercial sizes.
 * Single-Phase: nearest 5kW, Three-Phase: nearest 10kW
 * @param {number} designLoadKw     Engineering design load (kW)
 * @param {string} phaseType        'single_phase' | 'three_phase'
 * @returns {{ requiredKw: number, commercialKw: number }} Raw and rounded inverter size
 */
export const calculateInverterSize = (designLoadKw, phaseType = 'single_phase') => {
    const requiredKw = (designLoadKw || 0) * 1.25; // 25% surge headroom
    const step = phaseType === 'three_phase' ? 10 : 5;
    const commercialKw = Math.ceil(requiredKw / step) * step;
    return { requiredKw, commercialKw: Math.max(commercialKw, step) }; // Minimum 1 unit
};


// ─────────────────────────────────────────────────────
// 5. PHASE ANALYSIS ENGINE
// ─────────────────────────────────────────────────────

/**
 * Deep phase analysis across all measurement scenarios.
 * Detects: zero-phase, severe imbalance, single-phase dominance.
 */
export const runPhaseAnalysis = (measurements, voltage, powerFactor) => {
    const warnings = [];
    const scenarios = ['normal', 'peak', 'full'];
    const scenarioResults = {};

    scenarios.forEach(key => {
        const meas = measurements?.[key] || { r: 0, s: 0, t: 0 };
        const r = parseFloat(meas.r) || 0;
        const s = parseFloat(meas.s) || 0;
        const t = parseFloat(meas.t) || 0;
        const total = r + s + t;

        const metrics = calculateThreePhaseMetrics(r, s, t);

        // Zero-phase detection
        const hasZeroPhase = [r, s, t].some(v => v === 0) && total > 0;
        if (hasZeroPhase) {
            warnings.push(`⚠ ${key.charAt(0).toUpperCase() + key.slice(1)} Load: One or more phases reading 0A while others carry load. Site may not be operating as balanced three-phase.`);
        }

        // Severe imbalance
        if (metrics.isImbalanced && total > 0) {
            warnings.push(`⚠ ${key.charAt(0).toUpperCase() + key.slice(1)} Load: Severe phase imbalance detected (${metrics.maxDeviationPercent.toFixed(1)}% deviation). Further verification recommended.`);
        }

        // Single-phase dominance: one phase carries >60% of total current
        if (total > 0) {
            const maxPhase = Math.max(r, s, t);
            const dominancePercent = (maxPhase / total) * 100;
            if (dominancePercent > 60) {
                const dominantLabel = maxPhase === r ? 'R' : maxPhase === s ? 'S' : 'T';
                warnings.push(`⚠ ${key.charAt(0).toUpperCase() + key.slice(1)} Load: ${dominantLabel}-Phase carries ${dominancePercent.toFixed(0)}% of total current — possible single-phase dominant operation.`);
            }
        }

        scenarioResults[key] = {
            r, s, t,
            metrics,
            hasZeroPhase,
            powerKw: calculatePowerKW(voltage, metrics.average, powerFactor, 'three_phase')
        };
    });

    return { scenarioResults, warnings };
};


// ─────────────────────────────────────────────────────
// 6. ENGINEERING VALIDATION WARNINGS
// ─────────────────────────────────────────────────────

/**
 * Auto-generates engineering validation warnings from site data.
 */
export const generateValidationWarnings = (siteData, loads, crossCheck, phaseWarnings = []) => {
    const warnings = [];

    // Missing voltage
    if (!siteData.voltage || siteData.voltage === 0) {
        warnings.push({ severity: 'critical', message: '⚠ Voltage not provided. All power calculations are estimated only and should not be used for final sizing.' });
    }

    // Missing measurement sets
    const measSets = siteData.measurements || {};
    const measKeys = ['normal', 'peak', 'full'];
    const isThreePhase = siteData.phase_type === 'three_phase';
    let completeSets = 0;
    measKeys.forEach(key => {
        const m = measSets[key];
        if (!m) return;
        if (isThreePhase) {
            if ((parseFloat(m.r) || 0) > 0 || (parseFloat(m.s) || 0) > 0 || (parseFloat(m.t) || 0) > 0) completeSets++;
        } else {
            if ((parseFloat(m.l) || 0) > 0) completeSets++;
        }
    });
    if (completeSets === 0) {
        warnings.push({ severity: 'critical', message: '⚠ No field measurements recorded. Sizing is based entirely on equipment schedule and may not reflect actual operating conditions.' });
    } else if (completeSets < 3) {
        warnings.push({ severity: 'warning', message: `⚠ Only ${completeSets} of 3 measurement scenarios recorded. Additional measurements recommended for higher confidence.` });
    }

    // Missing operating hours in equipment
    const eqList = siteData.equipment || [];
    const missingHours = eqList.filter(eq => !eq.operating_hours || Number(eq.operating_hours) === 0);
    if (missingHours.length > 0 && eqList.length > 0) {
        warnings.push({ severity: 'warning', message: `⚠ ${missingHours.length} equipment item(s) have missing operating hours. Energy demand calculations may be inaccurate.` });
    }

    // Load deviation
    if (crossCheck && crossCheck.isMismatched) {
        warnings.push({ severity: 'warning', message: `⚠ Significant deviation (${crossCheck.differencePercent.toFixed(1)}%) detected between measured operational load and listed equipment load. Cross-verify equipment schedule.` });
    }

    // Extremely low measured load vs connected
    if (loads && loads.connected > 0 && loads.measuredPeak > 0) {
        const ratio = loads.measuredPeak / loads.connected;
        if (ratio < 0.2) {
            warnings.push({ severity: 'info', message: '⚠ Measured peak load is less than 20% of connected equipment load. Site may have been under light operating conditions during measurement.' });
        }
    }

    // Phase warnings passthrough
    phaseWarnings.forEach(w => {
        warnings.push({ severity: 'warning', message: w });
    });

    return warnings;
};


// ─────────────────────────────────────────────────────
// 7. ENGINEERING CONFIDENCE SCORE
// ─────────────────────────────────────────────────────

/**
 * Weighted confidence scoring algorithm.
 * 
 * Factor              | Weight
 * --------------------|-------
 * Measurement sets    | 25%
 * Voltage provided    | 20%
 * Equipment correl.   | 20%
 * Phase balance       | 20%
 * Data consistency    | 15%
 */
export const calculateConfidenceScore = (siteData, loads, crossCheck, phaseAnalysis, warningCount) => {
    const factors = [];
    let totalScore = 0;

    // 1. Measurement completeness (25%)
    const measSets = siteData.measurements || {};
    const isThreePhase = siteData.phase_type === 'three_phase';
    let completeSets = 0;
    ['normal', 'peak', 'full'].forEach(key => {
        const m = measSets[key];
        if (!m) return;
        if (isThreePhase) {
            if ((parseFloat(m.r) || 0) > 0 || (parseFloat(m.s) || 0) > 0 || (parseFloat(m.t) || 0) > 0) completeSets++;
        } else {
            if ((parseFloat(m.l) || 0) > 0) completeSets++;
        }
    });
    const measScore = completeSets === 3 ? 1 : completeSets >= 1 ? 0.5 : 0;
    const measLabel = completeSets === 3 ? 'All 3 measurement scenarios recorded' : completeSets >= 1 ? `Only ${completeSets} of 3 scenarios recorded` : 'No measurements recorded';
    factors.push({ name: 'Measurement Completeness', weight: 25, score: measScore, detail: measLabel });
    totalScore += measScore * 25;

    // 2. Voltage provided (20%)
    const hasVoltage = siteData.voltage && siteData.voltage > 0;
    factors.push({ name: 'Voltage Availability', weight: 20, score: hasVoltage ? 1 : 0, detail: hasVoltage ? `${siteData.voltage}V recorded` : 'Voltage not provided' });
    totalScore += (hasVoltage ? 1 : 0) * 20;

    // 3. Equipment correlation (20%)
    const devPct = crossCheck?.differencePercent || 0;
    const eqScore = devPct <= 15 ? 1 : devPct <= 30 ? 0.5 : 0;
    const eqLabel = devPct <= 15 ? `${devPct.toFixed(1)}% deviation — good correlation` : devPct <= 30 ? `${devPct.toFixed(1)}% deviation — moderate` : `${devPct.toFixed(1)}% deviation — poor correlation`;
    factors.push({ name: 'Equipment Correlation', weight: 20, score: eqScore, detail: eqLabel });
    totalScore += eqScore * 20;

    // 4. Phase balance quality (20%)
    let phaseScore = 1;
    let phaseLabel = 'Single-phase system — N/A';
    if (isThreePhase && phaseAnalysis) {
        const peakImbalance = phaseAnalysis.scenarioResults?.peak?.metrics?.maxDeviationPercent || 0;
        phaseScore = peakImbalance <= 10 ? 1 : peakImbalance <= 20 ? 0.5 : 0;
        phaseLabel = peakImbalance <= 10 ? `${peakImbalance.toFixed(1)}% imbalance — balanced` : peakImbalance <= 20 ? `${peakImbalance.toFixed(1)}% imbalance — moderate` : `${peakImbalance.toFixed(1)}% imbalance — severe`;
    }
    factors.push({ name: 'Phase Balance Quality', weight: 20, score: phaseScore, detail: phaseLabel });
    totalScore += phaseScore * 20;

    // 5. Data consistency (15%)
    const warnCount = warningCount || 0;
    const consScore = warnCount === 0 ? 1 : warnCount <= 2 ? 0.5 : 0;
    const consLabel = warnCount === 0 ? 'No validation issues' : `${warnCount} validation warning(s) raised`;
    factors.push({ name: 'Data Consistency', weight: 15, score: consScore, detail: consLabel });
    totalScore += consScore * 15;

    // Determine rating
    let rating = 'LOW';
    if (totalScore >= 75) rating = 'HIGH';
    else if (totalScore >= 45) rating = 'MEDIUM';

    // Reasoning
    let reasoning = '';
    if (rating === 'HIGH') {
        reasoning = 'Report data is comprehensive and internally consistent. Engineering recommendations carry high reliability for deployment decisions.';
    } else if (rating === 'MEDIUM') {
        reasoning = 'Report data has moderate completeness or minor inconsistencies. Recommendations are suitable for preliminary sizing but additional field verification is advised before final procurement.';
    } else {
        reasoning = 'Report data has significant gaps or inconsistencies. Recommendations should be treated as preliminary estimates only. A follow-up field audit is strongly recommended.';
    }

    return { score: totalScore, rating, factors, reasoning };
};


// ─────────────────────────────────────────────────────
// 8. ENGINEERING OBSERVATIONS GENERATOR
// ─────────────────────────────────────────────────────

/**
 * Generates intelligent, dynamic engineering narrative observations.
 */
export const generateObservations = (siteData, loads, crossCheck, phaseAnalysis, confidence) => {
    const observations = [];

    // Load comparison observation
    if (loads.connected > 0 && loads.measuredPeak > 0) {
        const ratio = loads.measuredPeak / loads.connected;
        if (ratio < 0.5) {
            observations.push('Measured load appears substantially lower than connected equipment load. This suggests not all listed equipment was operating during the measurement window, or duty cycles are lower than expected.');
        } else if (ratio > 1.1) {
            observations.push('Measured peak load exceeds the equipment schedule total. Unrecorded loads may be present on-site, or equipment power ratings may be understated.');
        } else {
            observations.push('Measured operational load correlates well with the listed equipment schedule, indicating a consistent and reliable data set.');
        }
    }

    // Phase analysis observations (three-phase only)
    if (siteData.phase_type === 'three_phase' && phaseAnalysis?.warnings?.length > 0) {
        observations.push('Phase readings indicate abnormal current distribution. Load redistribution across phases should be investigated to prevent neutral overloading and potential equipment damage.');
    }

    // Sizing basis
    if (loads.measuredPeak > 0 && loads.measuredPeak >= (loads.measuredContinuous * 1.2)) {
        observations.push('Backup sizing has been based on measured peak operational condition, which exceeds the growth-adjusted continuous load. This provides conservative sizing.');
    } else if (loads.measuredContinuous > 0) {
        observations.push('Backup sizing has been based on growth-adjusted continuous load, which exceeds the measured peak. The 20% growth factor ensures headroom for future demand increases.');
    }

    // Future expansion
    if (loads.futureExpansionDetected) {
        observations.push('Field notes indicate planned future equipment additions. Inverter recommendation includes additional headroom to accommodate expansion without system replacement.');
    }

    // Confidence-based observation
    if (confidence?.rating === 'LOW') {
        observations.push('Data completeness is below optimal levels. It is recommended to revisit the site with complete measurement equipment to capture all three load scenarios (Normal, Peak, Full) before final procurement.');
    }

    // Backup hours observation
    const backupHrs = siteData.backup_hours || siteData.general_info?.backup_hours || 4;
    if (backupHrs >= 8) {
        observations.push(`Extended autonomy of ${backupHrs} hours requested. Battery bank sizing is significant — consider staged battery deployment if budget constraints apply.`);
    }

    return observations;
};


// ─────────────────────────────────────────────────────
// 9. FUTURE EXPANSION DETECTION
// ─────────────────────────────────────────────────────

/**
 * Scans notes and equipment for future expansion keywords.
 * Returns expansion metadata and additional kW reserve recommendation.
 */
export const detectFutureExpansion = (notes, equipment) => {
    const expansionKeywords = ['atm', 'recycler', 'ac', 'air condition', 'terminal', 'expansion', 'additional', 'future', 'planned', 'upcoming', 'new branch', 'extra'];
    const notesLower = (notes || '').toLowerCase();

    const matchedKeywords = expansionKeywords.filter(kw => notesLower.includes(kw));
    const detected = matchedKeywords.length > 0;

    // Estimate additional kW reserve based on keyword context
    let additionalKw = 0;
    if (notesLower.includes('atm') || notesLower.includes('recycler')) additionalKw += 3;
    if (notesLower.includes('ac') || notesLower.includes('air condition')) additionalKw += 5;
    if (notesLower.includes('terminal')) additionalKw += 1;
    if (notesLower.includes('lighting') || notesLower.includes('extra')) additionalKw += 1;

    return {
        detected,
        matchedKeywords,
        additionalKw,
        notes: detected
            ? `Future expansion indicators found: ${matchedKeywords.join(', ')}. An additional ${additionalKw} kW reserve has been factored into inverter recommendation.`
            : 'No future expansion indicators detected in field notes.'
    };
};


// ─────────────────────────────────────────────────────
// 10. MASTER ORCHESTRATOR
// ─────────────────────────────────────────────────────

/**
 * Runs the complete engineering analysis pipeline and returns
 * a single result object used by both the report template and dashboard.
 * 
 * @param {object} siteData  Full site form data
 * @returns {object}         Complete engineering analysis
 */
export const runFullEngineeringAnalysis = (siteData) => {
    const isThreePhase = siteData.phase_type === 'three_phase';
    const voltage = siteData.voltage || 0;
    const pf = siteData.power_factor || 0.85;
    const backupHours = siteData.backup_hours || siteData.general_info?.backup_hours || 4;

    const GROWTH_FACTOR = 1.20;
    const LOSS_MARGIN = 1.15;

    // ── Measurement-derived loads ──
    const nMeas = siteData.measurements?.normal || { r: 0, s: 0, t: 0, l: 0 };
    const pMeas = siteData.measurements?.peak || { r: 0, s: 0, t: 0, l: 0 };
    const fMeas = siteData.measurements?.full || { r: 0, s: 0, t: 0, l: 0 };

    const calcKw = (meas) => {
        if (isThreePhase) {
            const r = parseFloat(meas.r) || 0;
            const s = parseFloat(meas.s) || 0;
            const t = parseFloat(meas.t) || 0;
            const avg = (r + s + t) / 3;
            return calculatePowerKW(voltage, avg, pf, 'three_phase');
        }
        return calculatePowerKW(voltage, parseFloat(meas.l) || 0, pf, 'single_phase');
    };

    const normalKw = calcKw(nMeas);
    const peakKw = calcKw(pMeas);
    const fullKw = calcKw(fMeas);

    // ── Equipment (connected) load ──
    const eqTotals = calculateEquipmentLoad(siteData.equipment || []);

    // ── Load classifications ──
    const measuredContinuousKw = normalKw;
    const measuredPeakKw = Math.max(peakKw, fullKw);
    const connectedKw = eqTotals.totalKw;

    // ── Design load ──
    const designLoadKw = calculateDesignLoad(measuredPeakKw, measuredContinuousKw, GROWTH_FACTOR);
    // If no measurements at all, fall back to connected load with growth
    const effectiveDesignLoad = designLoadKw > 0 ? designLoadKw : connectedKw * GROWTH_FACTOR;

    // ── Future expansion ──
    const futureExpansion = detectFutureExpansion(
        siteData.general_info?.notes || '',
        siteData.equipment || []
    );

    // ── Sizing ──
    const battery = calculateBatteryCapacity(effectiveDesignLoad, backupHours, LOSS_MARGIN);
    const inverterDesignLoad = effectiveDesignLoad + (futureExpansion.detected ? futureExpansion.additionalKw : 0);
    const inverter = calculateInverterSize(inverterDesignLoad, siteData.phase_type);

    // ── Phase analysis ──
    let phaseAnalysis = null;
    if (isThreePhase) {
        phaseAnalysis = runPhaseAnalysis(siteData.measurements, voltage, pf);
    }

    // ── Cross-check ──
    const crossCheck = runCrossCheck(measuredPeakKw, connectedKw);

    // ── Loads object ──
    const loads = {
        connected: connectedKw,
        connectedKwh: eqTotals.totalKwh,
        measuredContinuous: measuredContinuousKw,
        measuredPeak: measuredPeakKw,
        designLoad: effectiveDesignLoad,
        normalKw,
        peakKw,
        fullKw,
        futureExpansionDetected: futureExpansion.detected
    };

    // ── Validation warnings ──
    const validationWarnings = generateValidationWarnings(
        siteData, loads, crossCheck,
        phaseAnalysis?.warnings || []
    );

    // ── Confidence score ──
    const confidence = calculateConfidenceScore(
        siteData, loads, crossCheck, phaseAnalysis,
        validationWarnings.filter(w => w.severity !== 'info').length
    );

    // ── Observations ──
    const observations = generateObservations(siteData, loads, crossCheck, phaseAnalysis, confidence);

    // ── Assumptions ──
    const assumptions = {
        voltage: voltage || 'Not provided',
        powerFactor: pf,
        growthFactor: GROWTH_FACTOR,
        lossMargin: LOSS_MARGIN,
        backupHours,
        surgeHeadroom: 1.25,
        phaseType: isThreePhase ? 'Three-Phase' : 'Single-Phase'
    };

    return {
        loads,
        sizing: {
            battery,
            inverter
        },
        phaseAnalysis,
        crossCheck,
        validationWarnings,
        confidence,
        observations,
        assumptions,
        futureExpansion,
        measurementDetails: {
            normal: { ...nMeas, kw: normalKw },
            peak: { ...pMeas, kw: peakKw },
            full: { ...fMeas, kw: fullKw }
        }
    };
};
