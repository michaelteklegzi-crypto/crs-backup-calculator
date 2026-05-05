import React from 'react';
import { ShieldCheck, Zap, Battery, Activity, Info, MapPin, Phone, User } from 'lucide-react';
import { calculatePowerKW, calculateThreePhaseMetrics, calculateEquipmentLoad, runCrossCheck } from '../utils/fieldLogic';

const FieldAuditReportTemplate = ({ reportId, siteData }) => {
    
    if (!siteData) return <div id={reportId}>No Data</div>;

    const { 
        client_name, branch_name, location, voltage, phase_type, power_factor,
        entered_by_name, measurements, equipment, general_info, created_at 
    } = siteData;

    const formatNumber = (val) => new Intl.NumberFormat('en-US').format(Number(val) || 0);
    const dateFormatted = new Date(created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    // Explicit light theme colors
    const colors = {
        primary: '#2563eb', // Bright Blue
        secondary: '#059669', // Emerald Green
        slateText: '#1e293b',
        mutedText: '#64748b',
        border: '#e2e8f0',
        bgBox: '#f8fafc',
        danger: '#ef4444',
        warning: '#f59e0b'
    };

    const isThreePhase = phase_type === 'three_phase';
    const nMeas = measurements?.normal || { r: 0, s: 0, t: 0, l: 0 };
    const pMeas = measurements?.peak || { r: 0, s: 0, t: 0, l: 0 };
    
    // Auto Calculate Measurements
    let phaseKw = 0; // Normal load
    let peakKw = 0;  // Peak load
    let imbalance = null;
    
    if (isThreePhase) {
        imbalance = calculateThreePhaseMetrics(parseFloat(nMeas.r)||0, parseFloat(nMeas.s)||0, parseFloat(nMeas.t)||0);
        phaseKw = calculatePowerKW(voltage, imbalance.average, power_factor, 'three_phase');
        
        const avgPeak = ((parseFloat(pMeas.r)||0) + (parseFloat(pMeas.s)||0) + (parseFloat(pMeas.t)||0)) / 3;
        peakKw = calculatePowerKW(voltage, avgPeak, power_factor, 'three_phase');
    } else {
        phaseKw = calculatePowerKW(voltage, parseFloat(nMeas.l)||0, power_factor, 'single_phase');
        peakKw = calculatePowerKW(voltage, parseFloat(pMeas.l)||0, power_factor, 'single_phase');
    }

    // Equipment Load
    const eqTotals = calculateEquipmentLoad(equipment || []);

    // Cross-Check Intelligence
    const crossCheck = runCrossCheck(peakKw, eqTotals.totalKw);

    return (
        <div id={reportId} style={{ 
            width: '1000px', // Fixed canvas width for snapshot
            padding: '40px', 
            background: '#ffffff', 
            color: colors.slateText,
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            boxSizing: 'border-box'
        }}>
            {/* BRAND HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${colors.primary}`, paddingBottom: '20px', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: colors.primary, letterSpacing: '-0.5px' }}>
                        CLIMATE RESILIENCE SOLUTIONS
                    </h1>
                    <div style={{ fontSize: '14px', color: colors.mutedText, marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Field Load Measurement & Energy Analysis
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: colors.mutedText, marginBottom: '4px' }}>Audited By:</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: colors.slateText }}>{entered_by_name || 'Field Engineer'}</div>
                    <div style={{ fontSize: '14px', color: colors.mutedText, marginTop: '4px' }}>{dateFormatted}</div>
                </div>
            </div>

            {/* SITE INFORMATION */}
            <div style={{ background: colors.bgBox, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '18px', color: colors.slateText, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={20} color={colors.primary} /> Site Details
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: colors.mutedText, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12}/> Client
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{client_name || '-'}</div>
                        <div style={{ fontSize: '13px', color: colors.mutedText }}>{branch_name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: colors.mutedText, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12}/> Location
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{location || '-'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: colors.mutedText, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12}/> Contact
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{general_info?.contact_person || '-'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: colors.mutedText, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Zap size={12}/> Grid Config
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>
                            {voltage}V • {isThreePhase ? '3-Phase' : '1-Phase'}
                        </div>
                    </div>
                </div>
            </div>

            {/* MEASUREMENTS & CROSS-CHECK */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                {/* Measurements Block */}
                <div style={{ flex: '1.5', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={20} color={colors.secondary} /> Electrical Measurements
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                        {isThreePhase ? (
                            <>
                                <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <div style={{ fontSize: '12px', color: colors.danger, fontWeight: 600 }}>R-Phase</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{pMeas.r} A</div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                    <div style={{ fontSize: '12px', color: colors.warning, fontWeight: 600 }}>S-Phase</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{pMeas.s} A</div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    <div style={{ fontSize: '12px', color: colors.primary, fontWeight: 600 }}>T-Phase</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{pMeas.t} A</div>
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: colors.bgBox, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                                <div style={{ fontSize: '12px', color: colors.mutedText, fontWeight: 600 }}>Line Current</div>
                                <div style={{ fontSize: '24px', fontWeight: 700 }}>{pMeas.l} A</div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', borderTop: `1px solid ${colors.border}`, paddingTop: '16px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: colors.mutedText }}>Calculated Power</div>
                            <div style={{ fontSize: '18px', fontWeight: 700 }}>{phaseKw.toFixed(2)} kW</div>
                        </div>
                        {isThreePhase && imbalance && (
                            <>
                                <div>
                                    <div style={{ fontSize: '12px', color: colors.mutedText }}>Average Current</div>
                                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{imbalance.average.toFixed(1)} A</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: colors.mutedText }}>Phase Imbalance</div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: imbalance.isImbalanced ? colors.danger : colors.secondary }}>
                                        {imbalance.maxDeviationPercent.toFixed(1)}%
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Scenarios & Intelligence */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: colors.bgBox, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px', flex: 1 }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={18} color={colors.secondary} /> Validation Check
                        </h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: `1px dashed ${colors.border}`, paddingBottom: '8px' }}>
                            <span style={{ color: colors.mutedText, fontSize: '14px' }}>Measured Peak</span>
                            <span style={{ fontWeight: 600 }}>{peakKw.toFixed(2)} kW</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: `1px dashed ${colors.border}`, paddingBottom: '8px' }}>
                            <span style={{ color: colors.mutedText, fontSize: '14px' }}>Equipment Load</span>
                            <span style={{ fontWeight: 600 }}>{eqTotals.totalKw.toFixed(2)} kW</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: colors.mutedText, fontSize: '14px' }}>Deviation</span>
                            <span style={{ fontWeight: 700, color: crossCheck.isMismatched ? colors.danger : colors.secondary }}>
                                {crossCheck.differencePercent.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* EQUIPMENT LIST */}
            <h2 style={{ fontSize: '18px', color: colors.slateText, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Battery size={20} color={colors.primary} /> Equipment Breakdown
            </h2>
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ background: colors.bgBox }}>
                        <tr>
                            <th style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, color: colors.mutedText, fontWeight: 600 }}>Category</th>
                            <th style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, color: colors.mutedText, fontWeight: 600 }}>Equipment</th>
                            <th style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, color: colors.mutedText, fontWeight: 600 }}>Qty</th>
                            <th style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, color: colors.mutedText, fontWeight: 600 }}>Power (W)</th>
                            <th style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, color: colors.mutedText, fontWeight: 600 }}>Hrs/Day</th>
                            <th style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, color: colors.mutedText, fontWeight: 600, textAlign: 'right' }}>Total (kW)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {equipment && equipment.length > 0 ? equipment.map((eq, idx) => {
                            const totalKw = ((Number(eq.quantity) * Number(eq.power_watts)) / 1000).toFixed(2);
                            return (
                                <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                    <td style={{ padding: '12px 16px' }}>{eq.category || '-'}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{eq.equipment_type || '-'}</td>
                                    <td style={{ padding: '12px 16px' }}>{eq.quantity}</td>
                                    <td style={{ padding: '12px 16px' }}>{eq.power_watts}</td>
                                    <td style={{ padding: '12px 16px' }}>{eq.operating_hours}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{totalKw}</td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: colors.mutedText }}>No equipment recorded.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot style={{ background: colors.bgBox }}>
                        <tr>
                            <td colSpan="5" style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: colors.mutedText }}>Total Load:</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: '16px', color: colors.primary }}>{eqTotals.totalKw.toFixed(2)} kW</td>
                        </tr>
                        <tr>
                            <td colSpan="5" style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: colors.mutedText }}>Total Energy Demand:</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: '16px', color: colors.secondary }}>{eqTotals.totalKwh.toFixed(2)} kWh</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* FOOTER */}
            <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: `2px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.mutedText }}>
                <div>info@crs-worldwide.com • https://crs-worldwide.com</div>
                <div>Proprietary Engineering Snapshot • Generated automatically from Field App.</div>
            </div>

        </div>
    );
};

export default FieldAuditReportTemplate;
