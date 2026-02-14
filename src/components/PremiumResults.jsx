import React, { useState } from 'react';
import {
    AreaChart, Area, LineChart, Line, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Download, Share2, Sun, Battery, Zap, DollarSign,
    TrendingUp, AlertTriangle, ShieldCheck, Activity,
    ChevronDown, ChevronUp, FileText, ArrowRight
} from 'lucide-react';

const PremiumResults = ({ systemSize, financials, comparisonData, hourlyData, onGetProposal, onFinance, onOpenAdvisory, userType, outageHours }) => {
    const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'financial' | 'reliability'
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [technicalView, setTechnicalView] = useState(false);
    const [showSoC, setShowSoC] = useState(false);

    // Initial check for data integrity
    if (!systemSize || !financials) {
        return (
            <div className="card" style={{ padding: '4rem', textAlign: 'center', color: '#cbd5e1', background: 'var(--color-bg-charcoal)' }}>
                <AlertTriangle size={64} color="var(--color-primary)" style={{ margin: '0 auto 2rem', opacity: 0.8 }} />
                <h3 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 300 }}>Configuration Incomplete</h3>
                <p style={{ maxWidth: '400px', margin: '0 auto', opacity: 0.7 }}>We need a bit more data to engineer your system. Please refine your load profile.</p>
            </div>
        );
    }

    const { batteryKwh, inverterKw, pvKw } = systemSize.recommended;
    const { capexSolar, capexDiesel, analysis } = financials;

    const formatCurrency = (val) => new Intl.NumberFormat('en-ET', {
        style: 'currency', currency: 'ETB', maximumFractionDigits: 0
    }).format(val);

    const formatNumber = (val) => new Intl.NumberFormat('en-US').format(val);

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', color: 'white', paddingBottom: '4rem' }}>

            {/* 1️⃣ HEADER SECTION — SYSTEM SUMMARY */}
            <div style={{ marginBottom: '3rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--color-accent-emerald)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={14} /> Engineered for {userType === 'sme' ? 'Business Continuity' : 'Residential Independence'}
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                            Power Architecture Report
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '3rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white' }}>{outageHours}h</div>
                            <div>Autonomy Target</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white' }}>{formatNumber(systemSize.peakPowerW || 0)} W</div>
                            <div>Rated Load</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white' }}>{((systemSize.totalDailyEnergyWh || 0) / 1000).toFixed(1)} kWh</div>
                            <div>Daily Demand</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '2rem' }}>

                {/* LEFT COLUMN: ARCHITECTURE & PERFORMANCE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* 2️⃣ ARCHITECTURE OVERVIEW */}
                    <div className="card" style={{ background: 'var(--color-surface-matte)', border: '1px solid var(--color-border-glass)', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Zap size={20} color="var(--color-accent-electric-blue)" /> Core Infrastructure
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <label className="switch">
                                    <input type="checkbox" checked={technicalView} onChange={() => setTechnicalView(!technicalView)} />
                                    <span className="slider round"></span>
                                </label>
                                Engineer View
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                            {/* Battery */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--color-secondary)' }}></div>
                                <Battery size={24} color="var(--color-secondary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                                    {batteryKwh} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>kWh</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Energy Storage</div>
                                {technicalView && <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginTop: '0.5rem' }}>LiFePO4 • 6000 Cycles</div>}
                            </div>

                            {/* Inverter */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--color-accent-electric-blue)' }}></div>
                                <Zap size={24} color="var(--color-accent-electric-blue)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                                    {inverterKw} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>kW</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Hybrid Inverter</div>
                                {technicalView && <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-electric-blue)', marginTop: '0.5rem' }}>Pure Sine Wave • 5ms Transfer</div>}
                            </div>

                            {/* PV Array */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--color-primary)' }}></div>
                                <Sun size={24} color="var(--color-primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                                    {pvKw} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>kWp</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Solar Capacity</div>
                                {technicalView && <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.5rem' }}>Monocrystalline • High Efficiency</div>}
                            </div>
                        </div>

                        {/* System Diagram Simplification */}
                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.7 }}>
                                <span style={{ fontSize: '0.9rem' }}>Grid Input</span>
                                <ArrowRight size={16} />
                                <span style={{ fontWeight: 600, color: 'white' }}>Hybrid Intelligence</span>
                                <ArrowRight size={16} />
                                <span style={{ fontSize: '0.9rem' }}>Critical Load</span>
                            </div>
                        </div>
                    </div>

                    {/* 4️⃣ RELIABILITY METRICS */}
                    <div className="card" style={{ background: 'var(--color-surface-matte)', border: '1px solid var(--color-border-glass)', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Activity size={20} color="var(--color-accent-emerald)" /> Performance Vectors
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <label className="switch" style={{ width: '28px', height: '16px' }}>
                                    <input type="checkbox" checked={showSoC} onChange={() => setShowSoC(!showSoC)} />
                                    <span className="slider round" style={{ backgroundColor: showSoC ? 'var(--color-secondary)' : '' }}></span>
                                </label>
                                Show Battery State (SoC)
                            </div>
                        </div>

                        {/* Interactive Graph Area */}
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} interval={3} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    {showSoC && <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />}

                                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <Area type="monotone" yAxisId="left" dataKey="solar" name="Solar Yield" stroke="var(--color-primary)" fill="url(#colorSolar)" />
                                    <Line type="step" yAxisId="left" dataKey="load" name="Consumption" stroke="#cbd5e1" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                    {showSoC && <Line type="monotone" yAxisId="right" dataKey="batteryState" name="Battery %" stroke="var(--color-secondary)" strokeWidth={2} dot={false} />}
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Performance Metrics & Narrative */}
                        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {/* Metric 1: Independence */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <ShieldCheck size={24} color="var(--color-accent-emerald)" />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Grid Independence</span>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white' }}>
                                    {financials.analysis.solarFraction}%
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4', marginTop: '0.5rem' }}>
                                    Your home runs effectively <strong>free of the grid</strong> for the majority of the day.
                                </div>
                            </div>

                            {/* Metric 2: Production */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <Sun size={24} color="var(--color-primary)" />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Daily Generation</span>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white' }}>
                                    {((hourlyData.reduce((acc, curr) => acc + (curr.solar || 0), 0)) / 1000).toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b' }}>kWh</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4', marginTop: '0.5rem' }}>
                                    Clean energy harvested directly from your roof, every single day.
                                </div>
                            </div>

                            {/* Metric 3: Excess / Safety */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <Battery size={24} color="var(--color-secondary)" />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Excess Energy</span>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white' }}>
                                    {((hourlyData.reduce((acc, curr) => acc + Math.max(0, (curr.solar || 0) - (curr.load || 0)), 0)) / 1000).toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b' }}>kWh</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4', marginTop: '0.5rem' }}>
                                    Surplus power available to keep your batteries 100% charged for the night.
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: FINANCIALS & ACTIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* 3️⃣ FINANCIAL SUMMARY */}
                    <div className="card" style={{
                        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                        border: '1px solid var(--color-border-glass)', padding: '2rem',
                        boxShadow: 'var(--shadow-premium)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', color: 'white' }}>
                            <DollarSign size={20} color="var(--color-accent-emerald)" /> Investment Overview
                        </h2>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Estimated System CAPEX</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', letterSpacing: '-0.5px' }}>
                                {formatCurrency(capexSolar)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-accent-emerald)', marginTop: '0.5rem' }}>
                                Inclusive of Installation & Commissioning
                            </div>
                        </div>

                        {/* Collapsible Breakdown */}
                        <div style={{ marginBottom: '2rem' }}>
                            <button
                                onClick={() => setShowBreakdown(!showBreakdown)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--color-border-glass)',
                                    color: 'var(--color-text-muted)',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    fontSize: '0.85rem', padding: '0.75rem 1.25rem',
                                    borderRadius: '2rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                            >
                                {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                {showBreakdown ? 'Hide Cost Breakdown' : 'View Cost Breakdown'}
                            </button>

                            {showBreakdown && (
                                <div className="animate-fade-in" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                        <span>Battery Bank</span> <span>{formatCurrency(financials.batteryCost)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                        <span>Hybrid Inverter</span> <span>{formatCurrency(financials.inverterCost)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                        <span>PV Array</span> <span>{formatCurrency(financials.panelCost)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                        <span>Install & BoS</span> <span>{formatCurrency(financials.installationCost)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ROI Indicator & Efficiency Metrics */}
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '0.5rem', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <TrendingUp size={20} color="var(--color-accent-emerald)" />
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-accent-emerald)', margin: 0 }}>Financial Efficiency</h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Projected ROI</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{financials.roiYears} Years</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Annual Savings</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent-emerald)' }}>{formatCurrency(analysis.annualBillSavings)}</div>
                                </div>
                            </div>

                            <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>5-Year Total Cost (ownership)</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{formatCurrency(analysis.tco5YearSolar)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>vs. Diesel Generator</span>
                                    <span style={{ fontSize: '0.9rem', color: '#ef4444', textDecoration: 'line-through' }}>{formatCurrency(analysis.tco5YearDiesel)}</span>
                                </div>
                                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-accent-emerald)', textAlign: 'right' }}>
                                    You save <strong>{formatCurrency(analysis.tco5YearDiesel - analysis.tco5YearSolar)}</strong> over 5 years.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5️⃣ NEXT ACTIONS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => onOpenAdvisory('report')}
                            className="btn-primary"
                            style={{
                                padding: '1.25rem', fontSize: '1.1rem', justifyContent: 'center',
                                background: 'linear-gradient(135deg, white 0%, #cbd5e1 100%)', color: '#0f172a',
                                boxShadow: '0 4px 20px rgba(255,255,255,0.2)'
                            }}>
                            <Download size={20} style={{ marginRight: '0.75rem' }} /> Download Architecture PDF
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                onClick={onFinance}
                                className="card"
                                style={{
                                    padding: '1rem', textAlign: 'center', cursor: 'pointer',
                                    border: '1px solid var(--color-border-glass)', background: 'transparent',
                                    color: 'white', transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-glass)'}
                            >
                                <DollarSign size={20} style={{ marginBottom: '0.5rem', margin: '0 auto', display: 'block' }} />
                                <span style={{ fontSize: '0.9rem' }}>Financing</span>
                            </button>

                            <button
                                onClick={() => onOpenAdvisory('consultation')}
                                className="card"
                                style={{
                                    padding: '1rem', textAlign: 'center', cursor: 'pointer',
                                    border: '1px solid var(--color-border-glass)', background: 'transparent',
                                    color: 'white', transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-accent-emerald)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-glass)'}
                            >
                                <FileText size={20} style={{ marginBottom: '0.5rem', margin: '0 auto', display: 'block' }} />
                                <span style={{ fontSize: '0.9rem' }}>Consultation</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                .switch { position: relative; display: inline-block; width: 34px; height: 20px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.2); transition: .4s; }
                .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
                input:checked + .slider { background-color: var(--color-accent-electric-blue); }
                input:checked + .slider:before { transform: translateX(14px); }
                .slider.round { border-radius: 34px; }
                .slider.round:before { border-radius: 50%; }
            `}</style>
        </div>
    );
};

export default PremiumResults;
