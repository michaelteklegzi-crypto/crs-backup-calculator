import React from 'react';
import { runFullEngineeringAnalysis } from '../utils/fieldLogic';

const FieldAuditReportTemplate = ({ reportId, siteData }) => {
    if (!siteData) return <div id={reportId}>No Data</div>;

    const {
        client_name, branch_name, location, voltage, phase_type, power_factor,
        entered_by_name, measurements, equipment, general_info, created_at
    } = siteData;

    const backupHours = siteData.backup_hours || general_info?.backup_hours || 4;
    const analysis = runFullEngineeringAnalysis(siteData);
    const isThreePhase = phase_type === 'three_phase';
    const dateFormatted = new Date(created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const c = {
        primary: '#2563eb', secondary: '#059669', slate: '#1e293b', muted: '#64748b',
        border: '#e2e8f0', bg: '#f8fafc', danger: '#ef4444', warning: '#f59e0b',
        white: '#ffffff'
    };

    const sectionTitle = (icon, title) => (
        <h2 style={{ fontSize: '16px', color: c.slate, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `2px solid ${c.primary}`, paddingBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>{icon}</span> {title}
        </h2>
    );

    const statCard = (label, value, unit, color) => (
        <div style={{ flex: 1, textAlign: 'center', padding: '14px 10px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: color || c.slate }}>{value}</div>
            <div style={{ fontSize: '11px', color: c.muted }}>{unit}</div>
        </div>
    );

    const confidenceColor = analysis.confidence.rating === 'HIGH' ? c.secondary : analysis.confidence.rating === 'MEDIUM' ? c.warning : c.danger;

    const nMeas = measurements?.normal || {};
    const pMeas = measurements?.peak || {};
    const fMeas = measurements?.full || {};

    return (
        <div id={reportId} style={{ width: '1000px', padding: '36px', background: c.white, color: c.slate, fontFamily: '"Inter","Segoe UI",sans-serif', boxSizing: 'border-box', lineHeight: 1.5 }}>

            {/* ═══ 1. HEADER ═══ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `3px solid ${c.primary}`, paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: c.primary, letterSpacing: '-0.5px' }}>CLIMATE RESILIENCE SOLUTIONS</h1>
                    <div style={{ fontSize: '13px', color: c.muted, marginTop: '3px', letterSpacing: '1px', textTransform: 'uppercase' }}>Engineering Load Assessment &amp; Backup System Design Report</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: c.muted }}>Audited By</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{entered_by_name || 'Field Engineer'}</div>
                    <div style={{ fontSize: '13px', color: c.muted, marginTop: '2px' }}>{dateFormatted}</div>
                    <div style={{ marginTop: '6px', display: 'inline-block', padding: '2px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: `${confidenceColor}18`, color: confidenceColor, border: `1px solid ${confidenceColor}40` }}>
                        {analysis.confidence.rating} CONFIDENCE
                    </div>
                </div>
            </div>

            {/* ═══ 2. SITE SUMMARY ═══ */}
            <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '18px', marginBottom: '22px' }}>
                {sectionTitle('📋', 'Site Summary')}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', fontSize: '13px' }}>
                    <div><div style={{ fontSize: '11px', color: c.muted }}>Client</div><div style={{ fontWeight: 600, marginTop: '2px' }}>{client_name || '-'}</div><div style={{ color: c.muted, fontSize: '12px' }}>{branch_name}</div></div>
                    <div><div style={{ fontSize: '11px', color: c.muted }}>Location</div><div style={{ fontWeight: 600, marginTop: '2px' }}>{location || '-'}</div></div>
                    <div><div style={{ fontSize: '11px', color: c.muted }}>Grid Config</div><div style={{ fontWeight: 600, marginTop: '2px' }}>{voltage}V • {isThreePhase ? '3-Phase' : '1-Phase'}</div></div>
                    <div><div style={{ fontSize: '11px', color: c.muted }}>Target Autonomy</div><div style={{ fontWeight: 600, marginTop: '2px' }}>{backupHours} Hours</div></div>
                    <div><div style={{ fontSize: '11px', color: c.muted }}>Contact</div><div style={{ fontWeight: 600, marginTop: '2px' }}>{general_info?.contact_person || '-'}</div></div>
                </div>
            </div>

            {/* ═══ 3. MEASUREMENT SUMMARY ═══ */}
            <div style={{ marginBottom: '22px' }}>
                {sectionTitle('⚡', 'Measurement Summary')}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: `1px solid ${c.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                    <thead style={{ background: c.bg }}>
                        <tr>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: c.muted, borderBottom: `1px solid ${c.border}`, fontWeight: 600 }}>Scenario</th>
                            {isThreePhase ? (<><th style={{ padding: '10px', textAlign: 'center', color: '#ef4444', borderBottom: `1px solid ${c.border}`, fontWeight: 600 }}>R (A)</th><th style={{ padding: '10px', textAlign: 'center', color: c.warning, borderBottom: `1px solid ${c.border}`, fontWeight: 600 }}>S (A)</th><th style={{ padding: '10px', textAlign: 'center', color: c.primary, borderBottom: `1px solid ${c.border}`, fontWeight: 600 }}>T (A)</th></>) : (
                                <th style={{ padding: '10px', textAlign: 'center', color: c.muted, borderBottom: `1px solid ${c.border}`, fontWeight: 600 }}>Line (A)</th>
                            )}
                            <th style={{ padding: '10px 14px', textAlign: 'right', color: c.muted, borderBottom: `1px solid ${c.border}`, fontWeight: 600 }}>Calc. Power (kW)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[{ label: 'Normal Load', m: nMeas, kw: analysis.measurementDetails.normal.kw },
                          { label: 'Peak Load', m: pMeas, kw: analysis.measurementDetails.peak.kw },
                          { label: 'Full Load', m: fMeas, kw: analysis.measurementDetails.full.kw }
                        ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${c.border}` }}>
                                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{row.label}</td>
                                {isThreePhase ? (<><td style={{ padding: '10px', textAlign: 'center' }}>{row.m.r || 0}</td><td style={{ padding: '10px', textAlign: 'center' }}>{row.m.s || 0}</td><td style={{ padding: '10px', textAlign: 'center' }}>{row.m.t || 0}</td></>) : (
                                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.m.l || 0}</td>
                                )}
                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>{row.kw.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ═══ 4. PHASE ANALYSIS (3-phase only) ═══ */}
            {isThreePhase && analysis.phaseAnalysis && (
                <div style={{ marginBottom: '22px' }}>
                    {sectionTitle('🔌', 'Phase Analysis')}
                    {['normal', 'peak', 'full'].map(key => {
                        const sr = analysis.phaseAnalysis.scenarioResults?.[key];
                        if (!sr) return null;
                        const m = sr.metrics;
                        const badgeColor = m.maxDeviationPercent > 20 ? c.danger : m.maxDeviationPercent > 10 ? c.warning : c.secondary;
                        const badgeLabel = m.maxDeviationPercent > 20 ? 'SEVERE' : m.maxDeviationPercent > 10 ? 'MODERATE' : 'BALANCED';
                        return (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 14px', border: `1px solid ${c.border}`, borderRadius: '8px', marginBottom: '8px', fontSize: '13px' }}>
                                <div style={{ fontWeight: 600, width: '100px', textTransform: 'capitalize' }}>{key}</div>
                                <div style={{ color: c.muted }}>R: {sr.r}A / S: {sr.s}A / T: {sr.t}A</div>
                                <div style={{ color: c.muted }}>Avg: {m.average.toFixed(1)}A</div>
                                <div style={{ color: c.muted }}>Imbalance: <span style={{ color: badgeColor, fontWeight: 600 }}>{m.maxDeviationPercent.toFixed(1)}%</span></div>
                                <div style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: `${badgeColor}18`, color: badgeColor }}>{badgeLabel}</div>
                            </div>
                        );
                    })}
                    {analysis.phaseAnalysis.warnings.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            {analysis.phaseAnalysis.warnings.map((w, i) => (
                                <div key={i} style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', color: c.danger, marginBottom: '6px' }}>{w}</div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ 5. EQUIPMENT LOAD ANALYSIS ═══ */}
            <div style={{ marginBottom: '22px' }}>
                {sectionTitle('🔋', 'Equipment Load Analysis')}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: `1px solid ${c.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                    <thead style={{ background: c.bg }}>
                        <tr>{['Category','Equipment','Qty','Power (W)','Hrs/Day','Total (kW)'].map((h,i) => (
                            <th key={i} style={{ padding: '10px 12px', textAlign: i===5?'right':'left', color: c.muted, borderBottom: `1px solid ${c.border}`, fontWeight: 600 }}>{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody>
                        {equipment && equipment.length > 0 ? equipment.map((eq, idx) => (
                            <tr key={idx} style={{ borderBottom: `1px solid ${c.border}` }}>
                                <td style={{ padding: '8px 12px' }}>{eq.category || '-'}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 500 }}>{eq.equipment_type || '-'}</td>
                                <td style={{ padding: '8px 12px' }}>{eq.quantity}</td>
                                <td style={{ padding: '8px 12px' }}>{eq.power_watts}</td>
                                <td style={{ padding: '8px 12px' }}>{eq.operating_hours}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{((Number(eq.quantity||0)*Number(eq.power_watts||0))/1000).toFixed(2)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: c.muted }}>No equipment recorded.</td></tr>
                        )}
                    </tbody>
                    <tfoot style={{ background: c.bg }}>
                        <tr>
                            <td colSpan="5" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: c.muted }}>Connected Load:</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: c.primary }}>{analysis.loads.connected.toFixed(2)} kW</td>
                        </tr>
                        <tr>
                            <td colSpan="5" style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: c.muted }}>Daily Energy:</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: c.secondary }}>{analysis.loads.connectedKwh.toFixed(2)} kWh</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* ═══ 6. LOAD CLASSIFICATION ═══ */}
            <div style={{ marginBottom: '22px' }}>
                {sectionTitle('📊', 'Load Classification')}
                <div style={{ display: 'flex', gap: '12px' }}>
                    {statCard('Connected Load', analysis.loads.connected.toFixed(2), 'kW (Equipment Schedule)', c.muted)}
                    {statCard('Measured Continuous', analysis.loads.measuredContinuous.toFixed(2), 'kW (Normal Operation)', c.primary)}
                    {statCard('Measured Peak', analysis.loads.measuredPeak.toFixed(2), 'kW (Peak Operation)', c.warning)}
                    {statCard('Design Load', analysis.loads.designLoad.toFixed(2), 'kW (Engineering Basis)', c.secondary)}
                </div>
            </div>

            {/* ═══ 7. LOAD VALIDATION ═══ */}
            <div style={{ marginBottom: '22px' }}>
                {sectionTitle('✅', 'Load Validation Results')}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px 18px', border: `1px solid ${c.border}`, borderRadius: '10px', background: c.bg }}>
                    <div style={{ flex: 1, fontSize: '13px' }}><span style={{ color: c.muted }}>Measured Peak:</span> <b>{analysis.loads.measuredPeak.toFixed(2)} kW</b></div>
                    <div style={{ fontSize: '18px', color: c.muted }}>vs</div>
                    <div style={{ flex: 1, fontSize: '13px' }}><span style={{ color: c.muted }}>Equipment Load:</span> <b>{analysis.loads.connected.toFixed(2)} kW</b></div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: c.muted }}>Deviation</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: analysis.crossCheck.isMismatched ? c.danger : c.secondary }}>{analysis.crossCheck.differencePercent.toFixed(1)}%</div>
                    </div>
                </div>
                {analysis.crossCheck.isMismatched && (
                    <div style={{ marginTop: '8px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', color: c.danger }}>
                        ⚠ Significant deviation detected between measured operational load and listed equipment load. Cross-verify equipment schedule against site conditions.
                    </div>
                )}
            </div>

            {/* ═══ 8. ENGINEERING WARNINGS ═══ */}
            {analysis.validationWarnings.length > 0 && (
                <div style={{ marginBottom: '22px' }}>
                    {sectionTitle('⚠️', 'Engineering Warnings')}
                    {analysis.validationWarnings.map((w, i) => {
                        const bgMap = { critical: '#fef2f2', warning: '#fffbeb', info: '#eff6ff' };
                        const borderMap = { critical: '#fecaca', warning: '#fde68a', info: '#bfdbfe' };
                        const colorMap = { critical: c.danger, warning: '#b45309', info: c.primary };
                        return (
                            <div key={i} style={{ padding: '10px 14px', background: bgMap[w.severity], border: `1px solid ${borderMap[w.severity]}`, borderRadius: '6px', fontSize: '12px', color: colorMap[w.severity], marginBottom: '6px' }}>
                                {w.message}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══ 9. SYSTEM SIZING ═══ */}
            <div style={{ marginBottom: '22px' }}>
                {sectionTitle('⚙️', 'System Sizing Recommendations')}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, padding: '18px', border: `2px solid ${c.secondary}`, borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: c.muted, textTransform: 'uppercase', marginBottom: '6px' }}>Battery Capacity</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: c.secondary }}>{analysis.sizing.battery.roundedKwh} kWh</div>
                        <div style={{ fontSize: '11px', color: c.muted, marginTop: '4px' }}>Raw: {analysis.sizing.battery.rawKwh.toFixed(2)} kWh</div>
                    </div>
                    <div style={{ flex: 1, padding: '18px', border: `2px solid ${c.primary}`, borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: c.muted, textTransform: 'uppercase', marginBottom: '6px' }}>Inverter Size</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: c.primary }}>{analysis.sizing.inverter.commercialKw} kW</div>
                        <div style={{ fontSize: '11px', color: c.muted, marginTop: '4px' }}>Required: {analysis.sizing.inverter.requiredKw.toFixed(2)} kW</div>
                    </div>
                </div>
                {/* Formula breakdown */}
                <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '14px 18px', fontSize: '12px', color: c.muted }}>
                    <div style={{ fontWeight: 600, color: c.slate, marginBottom: '6px' }}>Calculation Breakdown</div>
                    <div style={{ marginBottom: '4px' }}>Design Load = MAX(Measured Peak, Continuous × {analysis.assumptions.growthFactor}) = <b style={{ color: c.slate }}>{analysis.loads.designLoad.toFixed(2)} kW</b></div>
                    <div style={{ marginBottom: '4px' }}>Battery = {analysis.loads.designLoad.toFixed(2)} kW × {backupHours}h × {analysis.assumptions.lossMargin} = <b style={{ color: c.slate }}>{analysis.sizing.battery.rawKwh.toFixed(2)} kWh</b> → rounded to <b style={{ color: c.secondary }}>{analysis.sizing.battery.roundedKwh} kWh</b></div>
                    <div>Inverter = {analysis.loads.designLoad.toFixed(2)} kW{analysis.futureExpansion.detected ? ` + ${analysis.futureExpansion.additionalKw} kW (expansion)` : ''} × {analysis.assumptions.surgeHeadroom} = <b style={{ color: c.slate }}>{analysis.sizing.inverter.requiredKw.toFixed(2)} kW</b> → rounded to <b style={{ color: c.primary }}>{analysis.sizing.inverter.commercialKw} kW</b></div>
                </div>
            </div>

            {/* ═══ 10. ASSUMPTIONS ═══ */}
            <div style={{ marginBottom: '22px' }}>
                {sectionTitle('📐', 'Calculation Assumptions & Transparency')}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: `1px solid ${c.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                    <tbody>
                        {[
                            ['Supply Voltage', `${analysis.assumptions.voltage}V`, !voltage ? 'NOT PROVIDED — results estimated' : ''],
                            ['Power Factor', analysis.assumptions.powerFactor, 'Industry standard for mixed loads'],
                            ['Growth Factor', `${((analysis.assumptions.growthFactor - 1) * 100).toFixed(0)}%`, 'Applied to continuous load for future demand'],
                            ['System Loss Margin', `${((analysis.assumptions.lossMargin - 1) * 100).toFixed(0)}%`, 'Accounts for cable, conversion, and thermal losses'],
                            ['Surge Headroom', `${((analysis.assumptions.surgeHeadroom - 1) * 100).toFixed(0)}%`, 'Inverter sizing buffer for inductive startup'],
                            ['Backup Duration', `${analysis.assumptions.backupHours} hours`, 'Client-specified autonomy requirement'],
                            ['Phase Configuration', analysis.assumptions.phaseType, '']
                        ].map(([param, value, note], i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${c.border}` }}>
                                <td style={{ padding: '8px 14px', fontWeight: 500, width: '200px' }}>{param}</td>
                                <td style={{ padding: '8px 14px', fontWeight: 700, color: c.primary }}>{value}</td>
                                <td style={{ padding: '8px 14px', color: note && note.includes('NOT PROVIDED') ? c.danger : c.muted, fontSize: '12px' }}>{note}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ═══ 11. CONFIDENCE SCORE ═══ */}
            <div style={{ marginBottom: '22px' }}>
                {sectionTitle('🎯', 'Engineering Confidence Score')}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <div style={{ textAlign: 'center', padding: '20px 28px', border: `2px solid ${confidenceColor}`, borderRadius: '12px', minWidth: '140px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: confidenceColor }}>{analysis.confidence.rating}</div>
                        <div style={{ fontSize: '11px', color: c.muted, marginTop: '4px' }}>{analysis.confidence.score}/100 points</div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '10px' }}>
                            <tbody>
                                {analysis.confidence.factors.map((f, i) => {
                                    const fColor = f.score === 1 ? c.secondary : f.score >= 0.5 ? c.warning : c.danger;
                                    return (
                                        <tr key={i} style={{ borderBottom: `1px solid ${c.border}` }}>
                                            <td style={{ padding: '6px 10px', fontWeight: 500 }}>{f.name}</td>
                                            <td style={{ padding: '6px 10px', color: c.muted }}>{f.weight}%</td>
                                            <td style={{ padding: '6px 10px', color: fColor, fontWeight: 600 }}>{f.score === 1 ? '●' : f.score >= 0.5 ? '◐' : '○'} {f.detail}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div style={{ fontSize: '12px', color: c.muted, fontStyle: 'italic', padding: '8px 10px', background: c.bg, borderRadius: '6px' }}>{analysis.confidence.reasoning}</div>
                    </div>
                </div>
            </div>

            {/* ═══ 12. OBSERVATIONS & FUTURE EXPANSION ═══ */}
            <div style={{ marginBottom: '22px' }}>
                {sectionTitle('🔍', 'Engineering Observations')}
                {analysis.observations.map((obs, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '6px', fontSize: '13px', color: c.slate, marginBottom: '6px', display: 'flex', gap: '8px' }}>
                        <span style={{ color: c.primary, fontWeight: 700 }}>•</span> {obs}
                    </div>
                ))}
            </div>

            {analysis.futureExpansion.detected && (
                <div style={{ marginBottom: '22px' }}>
                    {sectionTitle('🚀', 'Future Expansion Considerations')}
                    <div style={{ padding: '14px 18px', background: '#eff6ff', border: `1px solid #bfdbfe`, borderRadius: '8px', fontSize: '13px', color: c.primary }}>
                        {analysis.futureExpansion.notes}
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: `2px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: c.muted }}>
                <div>info@crs-worldwide.com • https://crs-worldwide.com</div>
                <div>Engineering Load Assessment Report • Generated automatically from CRS Field App</div>
            </div>
        </div>
    );
};

export default FieldAuditReportTemplate;
