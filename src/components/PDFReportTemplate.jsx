import React from 'react';
import {
    AreaChart, Area, LineChart, Line, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ShieldCheck, Zap, Battery, Sun, DollarSign, Activity, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const PDFReportTemplate = ({ reportId, systemSize, financials, hourlyData, clientName = "Valued Client", userType, outageHours }) => {
    
    // Safety check
    if (!systemSize || !financials) return <div id={reportId}>Invalid Configuration</div>;

    const { batteryKwh, inverterKw, pvKw } = systemSize.recommended;
    const { capexSolar, capexDiesel, analysis } = financials;

    const formatCurrency = (val) => new Intl.NumberFormat('en-ET', {
        style: 'currency', currency: 'ETB', maximumFractionDigits: 0
    }).format(val);

    const formatNumber = (val) => new Intl.NumberFormat('en-US').format(Number(val));

    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    // Explicit light theme colors
    const colors = {
        primary: '#2563eb', // Bright Blue
        secondary: '#059669', // Emerald Green
        slateText: '#1e293b',
        mutedText: '#64748b',
        border: '#e2e8f0',
        bgBox: '#f8fafc',
        warning: '#f59e0b',
        amber: '#d97706'
    };

    // Computed values
    const numPanels = systemSize.recommended.units?.panels || Math.ceil((pvKw * 1000) / 500);
    const estArea = numPanels * 2.5;
    const dailySolarYield = ((Array.isArray(hourlyData) ? hourlyData.reduce((a,c) => a + (c.solar||0), 0) : 0) / 1000).toFixed(1);

    return (
    const pageStyle = { width: '1000px', minHeight: '1414px', padding: '40px', background: '#ffffff', color: colors.slateText, fontFamily: '"Inter", "Segoe UI", sans-serif', boxSizing: 'border-box', position: 'relative' };

    return (
        <div id={reportId}>
            {/* ─── PAGE 1 ─── */}
            <div className="pdf-page" style={pageStyle}>
            {/* ─── BRAND HEADER ──────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${colors.primary}`, paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img src="/images/crs_logo.png" alt="CRS Logo" style={{ height: '50px' }} />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: colors.primary, letterSpacing: '-0.5px' }}>
                            CLIMATE RESILIENCE SOLUTIONS (CRS)
                        </h1>
                        <div style={{ fontSize: '14px', color: colors.mutedText, marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Power Architecture & Engineering Feasibility Report
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: colors.mutedText, marginBottom: '4px' }}>Prepared For:</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: colors.slateText }}>{clientName}</div>
                    <div style={{ fontSize: '14px', color: colors.mutedText, marginTop: '4px' }}>{todayDate}</div>
                </div>
            </div>

            {/* ─── EXECUTIVE SUMMARY / FINANCIALS ────────────────────────── */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <div style={{ flex: '1', background: colors.bgBox, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.secondary, marginBottom: '16px' }}>
                        <DollarSign size={24} />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Investment Summary</h2>
                    </div>
                    
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '13px', color: colors.mutedText, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estimated Total System CAPEX</div>
                        <div style={{ fontSize: '36px', fontWeight: 800, color: colors.slateText, lineHeight: 1.2 }}>{formatCurrency(capexSolar)}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: `1px solid ${colors.border}`, paddingTop: '16px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: colors.mutedText }}>Projected ROI Period</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: colors.primary }}>{financials.roiYears} Years</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: colors.mutedText }}>Estimated Annual Utility Offset</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: colors.secondary }}>{formatCurrency(analysis.annualBillSavings)}</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                            <div style={{ fontSize: '12px', color: colors.mutedText }}>Projected 5-Year Lifecycle Savings (vs. Diesel Baseline)</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: colors.slateText }}>{formatCurrency(analysis.tco5YearDiesel - analysis.tco5YearSolar)}</div>
                        </div>
                    </div>
                </div>

                {/* MODELED PARAMETERS */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: colors.bgBox, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.primary, marginBottom: '16px' }}>
                            <ShieldCheck size={20} />
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Modeled Operating Parameters</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: `1px dashed ${colors.border}`, paddingBottom: '8px' }}>
                            <span style={{ color: colors.mutedText, fontSize: '14px' }}>Battery-Only Backup Autonomy</span>
                            <span style={{ fontWeight: 600 }}>~{outageHours}h (modeled peak load)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: `1px dashed ${colors.border}`, paddingBottom: '8px' }}>
                            <span style={{ color: colors.mutedText, fontSize: '14px' }}>Peak Simultaneous Load (Modeled)</span>
                            <span style={{ fontWeight: 600 }}>{formatNumber(systemSize.peakPowerW)} W</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: `1px dashed ${colors.border}`, paddingBottom: '8px' }}>
                            <span style={{ color: colors.mutedText, fontSize: '14px' }}>Estimated Daily Demand</span>
                            <span style={{ fontWeight: 600 }}>{(systemSize.totalDailyEnergyWh / 1000).toFixed(1)} kWh/day</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: colors.mutedText, fontSize: '14px' }}>Projected Solar-Assisted Load Coverage</span>
                            <span style={{ fontWeight: 600, color: colors.secondary }}>{financials.analysis.solarFraction}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── TECHNICAL ARCHITECTURE ────────────────────────────────── */}
            <h2 style={{ fontSize: '20px', color: colors.slateText, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color={colors.primary} /> Engineered Hardware Sizing
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                {/* PV Array */}
                <div style={{ padding: '24px', border: `1px solid ${colors.border}`, borderRadius: '12px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#f59e0b' }}></div>
                    <Sun size={32} color="#f59e0b" style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{pvKw} <span style={{ fontSize: '14px', fontWeight: 500, color: colors.mutedText }}>kWp</span></div>
                    <div style={{ fontSize: '13px', color: colors.mutedText, marginTop: '4px' }}>PV Array Peak Capacity</div>
                    <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '6px', fontWeight: 600 }}>
                        {numPanels}× 500W Panels
                    </div>
                    <div style={{ fontSize: '11px', color: colors.mutedText, marginTop: '2px' }}>
                        (Est. Roof Area: {estArea} m²)
                    </div>
                </div>

                {/* Battery */}
                <div style={{ padding: '24px', border: `1px solid ${colors.border}`, borderRadius: '12px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: colors.secondary }}></div>
                    <Battery size={32} color={colors.secondary} style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{batteryKwh} <span style={{ fontSize: '14px', fontWeight: 500, color: colors.mutedText }}>kWh</span></div>
                    <div style={{ fontSize: '13px', color: colors.mutedText, marginTop: '4px' }}>Nominal Storage Capacity</div>
                    <div style={{ fontSize: '11px', color: colors.mutedText, marginTop: '4px' }}>
                        Usable ≈ {(batteryKwh * 0.9).toFixed(0)} kWh (90% DoD)
                    </div>
                </div>

                {/* Inverter */}
                <div style={{ padding: '24px', border: `1px solid ${colors.border}`, borderRadius: '12px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: colors.primary }}></div>
                    <Zap size={32} color={colors.primary} style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{inverterKw} <span style={{ fontSize: '14px', fontWeight: 500, color: colors.mutedText }}>kW</span></div>
                    <div style={{ fontSize: '13px', color: colors.mutedText, marginTop: '4px' }}>Hybrid Inverter (Continuous)</div>
                    <div style={{ fontSize: '11px', color: colors.mutedText, marginTop: '4px' }}>
                        {systemSize.recommended.is3Phase ? '3-Phase Configuration' : 'Single-Phase Configuration'}
                    </div>
                </div>
            </div>

            {/* ─── AUTONOMY ASSUMPTIONS ──────────────────────────────────── */}
            <div style={{ background: '#fffbeb', border: `1px solid ${colors.warning}40`, borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.amber, marginBottom: '10px' }}>
                    <Info size={18} />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Battery Autonomy Assumptions</h3>
                </div>
                <div style={{ fontSize: '13px', color: colors.slateText, lineHeight: 1.7 }}>
                    The stated ~{outageHours}-hour autonomy reflects the estimated battery-supported runtime after the battery bank reaches full charge,
                    assuming modeled simultaneous load conditions and minimal or no solar contribution during discharge. Calculations are based on:
                </div>
                <ul style={{ fontSize: '13px', color: colors.slateText, lineHeight: 1.8, margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    <li>Usable battery capacity ({(batteryKwh * 0.9).toFixed(0)} kWh at 90% depth of discharge)</li>
                    <li>Modeled simultaneous peak load ({formatNumber(systemSize.peakPowerW)} W)</li>
                    <li>Inverter conversion efficiency (~95%)</li>
                    <li>Battery state of charge at start of discharge (assumed 100%)</li>
                </ul>
            </div>

            </div> {/* END PAGE 1 */}

            {/* ─── PAGE 2 ─── */}
            <div className="pdf-page" style={pageStyle}>

            {/* ─── HYBRID OPERATIONAL ENERGY LOGIC ──────────────────────── */}
            <h2 style={{ fontSize: '20px', color: colors.slateText, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color={colors.secondary} /> Hybrid Operational Energy Logic
            </h2>
            <div style={{ marginBottom: '30px' }}>
                <div style={{ background: colors.bgBox, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', color: colors.slateText, lineHeight: 1.8, margin: '0 0 12px 0' }}>
                        During daylight hours, the PV array simultaneously powers active facility loads and charges the battery storage system. 
                        Excess solar production is prioritized toward battery charging after serving real-time load demand.
                    </p>
                    <p style={{ fontSize: '13px', color: colors.slateText, lineHeight: 1.8, margin: '0 0 12px 0' }}>
                        Actual daytime operational runtime may extend significantly beyond the stated battery-only autonomy window 
                        due to continuous PV-assisted load support. The modeled autonomy figure represents a worst-case scenario 
                        under assumed operating conditions (e.g., extended cloud cover or nighttime discharge).
                    </p>
                </div>

                {/* OPERATIONAL FLOW DIAGRAM */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {/* Daytime */}
                    <div style={{ border: `1px solid ${colors.warning}50`, borderRadius: '12px', padding: '20px', background: '#fffbeb' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: colors.amber, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                            ☀ Daytime — Solar Active
                        </div>
                        <div style={{ fontSize: '13px', color: colors.slateText, lineHeight: 1.6 }}>
                            <div style={{ marginBottom: '6px' }}>PV → <strong>Facility Load (Priority)</strong></div>
                            <div style={{ marginBottom: '6px' }}>Surplus PV → <strong>Battery Charging</strong></div>
                            <div style={{ fontSize: '11px', color: colors.mutedText }}>Grid/diesel remains standby only</div>
                        </div>
                    </div>

                    {/* Night / Outage */}
                    <div style={{ border: `1px solid ${colors.primary}40`, borderRadius: '12px', padding: '20px', background: '#eff6ff' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                            🌙 Night / Grid Outage
                        </div>
                        <div style={{ fontSize: '13px', color: colors.slateText, lineHeight: 1.6 }}>
                            <div style={{ marginBottom: '6px' }}>Battery → <strong>Critical Load</strong></div>
                            <div style={{ fontSize: '11px', color: colors.mutedText }}>Runtime limited by battery SoC and load magnitude</div>
                        </div>
                    </div>

                    {/* Low Battery */}
                    <div style={{ border: `1px solid #ef444440`, borderRadius: '12px', padding: '20px', background: '#fef2f2' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                            ⚡ Low Battery / Recovery
                        </div>
                        <div style={{ fontSize: '13px', color: colors.slateText, lineHeight: 1.6 }}>
                            <div style={{ marginBottom: '6px' }}>Grid or Generator → <strong>Load + Battery Recovery</strong></div>
                            <div style={{ fontSize: '11px', color: colors.mutedText }}>Inverter manages charge priority and load balancing</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── PERFORMANCE VISUALIZATION ─────────────────────────────── */}
            <h2 style={{ fontSize: '20px', color: colors.slateText, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color={colors.primary} /> Simulated Daily Energy Dispatch
            </h2>
            <div style={{ padding: '24px', border: `1px solid ${colors.border}`, borderRadius: '12px', background: colors.bgBox, marginBottom: '30px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '20px' }}>
                    {/* Graph sidebar stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: colors.mutedText, textTransform: 'uppercase' }}>Projected Solar Offset</div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: colors.secondary }}>{financials.analysis.solarFraction}%</div>
                            <div style={{ fontSize: '11px', color: colors.mutedText }}>High daytime solar offset potential</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: colors.mutedText, textTransform: 'uppercase' }}>Simulated Daily PV Yield</div>
                            <div style={{ fontSize: '24px', fontWeight: 600, color: colors.primary }}>
                                {dailySolarYield} kWh
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: colors.mutedText, textTransform: 'uppercase' }}>Battery-Only Backup</div>
                            <div style={{ fontSize: '24px', fontWeight: 600, color: colors.amber }}>
                                ~{outageHours}h
                            </div>
                            <div style={{ fontSize: '11px', color: colors.mutedText }}>After full charge, no PV assist</div>
                        </div>
                        <div style={{ marginTop: 'auto', fontSize: '11px', color: colors.mutedText, background: '#fff', border: `1px solid ${colors.border}`, padding: '12px', borderRadius: '8px' }}>
                            <Info size={14} style={{ marginBottom: '4px' }} />
                            Simulation assumes 95% inverter efficiency and standard irradiation constants for the modeled location.
                        </div>
                    </div>

                    {/* Recharts Area - explicitly light themed */}
                    <div style={{ height: '260px' }}>
                        <ComposedChart width={600} height={260} data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSolarLight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: colors.mutedText }} interval={3} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: colors.mutedText }} />
                            
                            <Area isAnimationActive={false} type="monotone" yAxisId="left" dataKey="solar" name="PV Generation (Wh)" stroke={colors.primary} strokeWidth={2} fill="url(#colorSolarLight)" />
                            <Line isAnimationActive={false} type="step" yAxisId="left" dataKey="load" name="Facility Load (Wh)" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                            
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </ComposedChart>
                    </div>
                </div>
            </div>

            {/* ─── FOOTER DISCLAIMER ────────────────────────────────────── */}
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', paddingTop: '16px', borderTop: `2px solid ${colors.border}` }}>
                <div style={{ fontSize: '11px', color: colors.mutedText, lineHeight: 1.7, marginBottom: '16px', background: colors.bgBox, padding: '14px 16px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                    <strong style={{ color: colors.slateText }}>Disclaimer:</strong> System performance projections are based on modeled load assumptions, 
                    irradiation estimates, inverter efficiency factors, and simulated operating conditions. Actual field performance may vary depending 
                    on weather patterns, real-time load behavior, equipment configuration, installation quality, and operational practices. 
                    This document constitutes an engineering feasibility snapshot and does not represent a binding performance guarantee.
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.mutedText }}>
                    <div>info@crs-worldwide.com • https://crs-worldwide.com</div>
                    <div>Proprietary Engineering Feasibility Report • {todayDate}</div>
                </div>
            </div>

            </div> {/* END PAGE 2 */}

        </div>
    );
};

export default PDFReportTemplate;
