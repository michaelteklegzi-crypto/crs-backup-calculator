import React from 'react';
import {
    AreaChart, Area, LineChart, Line, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ShieldCheck, Zap, Battery, Sun, DollarSign, Activity, CheckCircle, Info } from 'lucide-react';

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
        bgBox: '#f8fafc'
    };

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${colors.primary}`, paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <img src="/images/crs_logo.png" alt="CRS Logo" style={{ height: '50px' }} />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: colors.primary, letterSpacing: '-0.5px' }}>
                            CLIMATE RESILIENCE SOLUTIONS (CRS)
                        </h1>
                        <div style={{ fontSize: '14px', color: colors.mutedText, marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Power Architecture & Investment Report
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: colors.mutedText, marginBottom: '4px' }}>Prepared For:</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: colors.slateText }}>{clientName}</div>
                    <div style={{ fontSize: '14px', color: colors.mutedText, marginTop: '4px' }}>{todayDate}</div>
                </div>
            </div>

            {/* EXECUTIVE SUMMARY / FINANCIALS */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <div style={{ flex: '1', background: colors.bgBox, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.secondary, marginBottom: '16px' }}>
                        <DollarSign size={24} />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Financial Overview</h2>
                    </div>
                    
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '13px', color: colors.mutedText, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total System CAPEX</div>
                        <div style={{ fontSize: '36px', fontWeight: 800, color: colors.slateText, lineHeight: 1.2 }}>{formatCurrency(capexSolar)}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: `1px solid ${colors.border}`, paddingTop: '16px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: colors.mutedText }}>Projected ROI</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: colors.primary }}>{financials.roiYears} Years</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: colors.mutedText }}>Annual Utility Savings</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: colors.secondary }}>{formatCurrency(analysis.annualBillSavings)}</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                            <div style={{ fontSize: '12px', color: colors.mutedText }}>5-Year Lifecycle Savings (vs Diesel)</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: colors.slateText }}>{formatCurrency(analysis.tco5YearDiesel - analysis.tco5YearSolar)}</div>
                        </div>
                    </div>
                </div>

                {/* REQUIREMENT METRICS */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: colors.bgBox, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.primary, marginBottom: '16px' }}>
                            <ShieldCheck size={20} />
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Targeted Parameters</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: `1px dashed ${colors.border}`, paddingBottom: '8px' }}>
                            <span style={{ color: colors.mutedText, fontSize: '14px' }}>Autonomy Target</span>
                            <span style={{ fontWeight: 600 }}>{outageHours} Hours Guarantee</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: `1px dashed ${colors.border}`, paddingBottom: '8px' }}>
                            <span style={{ color: colors.mutedText, fontSize: '14px' }}>Peak Simultaneous Load</span>
                            <span style={{ fontWeight: 600 }}>{formatNumber(systemSize.peakPowerW)} Watts</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: colors.mutedText, fontSize: '14px' }}>Calculated Daily Demand</span>
                            <span style={{ fontWeight: 600 }}>{(systemSize.totalDailyEnergyWh / 1000).toFixed(1)} kWh/day</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TECHNICAL ARCHITECTURE */}
            <h2 style={{ fontSize: '20px', color: colors.slateText, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color={colors.primary} /> Engineered Hardware Sizing
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                {/* PV Array */}
                <div style={{ padding: '24px', border: `1px solid ${colors.border}`, borderRadius: '12px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#f59e0b' }}></div>
                    <Sun size={32} color="#f59e0b" style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{pvKw} <span style={{ fontSize: '14px', fontWeight: 500, color: colors.mutedText }}>kWp</span></div>
                    <div style={{ fontSize: '13px', color: colors.mutedText, marginTop: '4px' }}>PV Array Peak Power</div>
                    <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '6px', fontWeight: 600 }}>
                        {systemSize.recommended.units?.panels || Math.ceil((pvKw * 1000) / 500)}x 500W Panels
                    </div>
                    <div style={{ fontSize: '11px', color: colors.mutedText, marginTop: '2px' }}>
                        (Est. Area: {(systemSize.recommended.units?.panels || Math.ceil((pvKw * 1000) / 500)) * 2.5} m²)
                    </div>
                </div>

                {/* Battery */}
                <div style={{ padding: '24px', border: `1px solid ${colors.border}`, borderRadius: '12px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: colors.secondary }}></div>
                    <Battery size={32} color={colors.secondary} style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{batteryKwh} <span style={{ fontSize: '14px', fontWeight: 500, color: colors.mutedText }}>kWh</span></div>
                    <div style={{ fontSize: '13px', color: colors.mutedText, marginTop: '4px' }}>Usable Storage Capacity</div>
                </div>

                {/* Inverter */}
                <div style={{ padding: '24px', border: `1px solid ${colors.border}`, borderRadius: '12px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: colors.primary }}></div>
                    <Zap size={32} color={colors.primary} style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '28px', fontWeight: 800 }}>{inverterKw} <span style={{ fontSize: '14px', fontWeight: 500, color: colors.mutedText }}>kW</span></div>
                    <div style={{ fontSize: '13px', color: colors.mutedText, marginTop: '4px' }}>Continuous Hybrid Inverter</div>
                </div>
            </div>

            {/* PERFORMANCE VISUALIZATION */}
            <h2 style={{ fontSize: '20px', color: colors.slateText, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color={colors.secondary} /> Daily Performance Vector (Simulated)
            </h2>
            <div style={{ padding: '24px', border: `1px solid ${colors.border}`, borderRadius: '12px', background: colors.bgBox }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '20px' }}>
                    {/* Graph sidebar stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: colors.mutedText, textTransform: 'uppercase' }}>Grid Independence</div>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: colors.secondary }}>{financials.analysis.solarFraction}%</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: colors.mutedText, textTransform: 'uppercase' }}>Daily Yield Avg</div>
                            <div style={{ fontSize: '24px', fontWeight: 600, color: colors.primary }}>
                                {((Array.isArray(hourlyData) ? hourlyData.reduce((a,c) => a + (c.solar||0), 0) : 0) / 1000).toFixed(1)} kWh
                            </div>
                        </div>
                        <div style={{ marginTop: 'auto', fontSize: '12px', color: colors.mutedText, background: '#fff', border: `1px solid ${colors.border}`, padding: '12px', borderRadius: '8px' }}>
                            <Info size={14} style={{ marginBottom: '4px' }} />
                            Model accounts for 95% inverter efficiency and environmental buffer constants.
                        </div>
                    </div>

                    {/* Recharts Area - explicitly light themed without ResponsiveContainer for PDF rendering */}
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
                            
                            <Area isAnimationActive={false} type="monotone" yAxisId="left" dataKey="solar" name="Solar Yield" stroke={colors.primary} strokeWidth={2} fill="url(#colorSolarLight)" />
                            <Line isAnimationActive={false} type="step" yAxisId="left" dataKey="load" name="Load Demand" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                            
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </ComposedChart>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: `2px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.mutedText }}>
                <div>info@crs-worldwide.com • https://crs-worldwide.com</div>
                <div>Proprietary Engineering Snapshot • Generated automatically.</div>
            </div>

        </div>
    );
};

export default PDFReportTemplate;
