import React, { useState } from 'react';
import {
    AreaChart, Area, LineChart, Line, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Download, Share2, Sun, Battery, Zap, DollarSign,
    TrendingUp, AlertTriangle, ShieldCheck, Activity,
    ChevronDown, ChevronUp, FileText, ArrowRight, CheckCircle, Check, Info
} from 'lucide-react';
import { calculateSystemSize, calculateFinancials, DEFAULT_CONSTANTS } from '../utils/logic'; // Import logic functions

const PremiumResults = ({ systemSize, financials, comparisonData, hourlyData, hourlyNote, onGetProposal, onFinance, onOpenAdvisory, userType, outageHours, constants = DEFAULT_CONSTANTS }) => {
    const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'financial' | 'reliability'
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [technicalView, setTechnicalView] = useState(false);
    const [showSoC, setShowSoC] = useState(false);

    // Future Scenario State
    const [showFutureModal, setShowFutureModal] = useState(false);
    const [futureData, setFutureData] = useState(null);

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

    const { batteryKwh, inverterKw, pvKw, is3Phase } = systemSize.recommended;
    const { capexSolar, capexDiesel, analysis } = financials;

    const formatCurrency = (val) => new Intl.NumberFormat('en-ET', {
        style: 'currency', currency: 'ETB', maximumFractionDigits: 0
    }).format(val);

    const formatNumber = (val) => new Intl.NumberFormat('en-US').format(Number(val));

    // Calculate Future Scenario (20% Growth)
    const handleFutureScenario = () => {
        const growthFactor = 1.2;

        // Create synthetic load based on current totals
        // We reverse engineer a single "Aggregate Load" item
        const currentDailyWh = systemSize.totalDailyEnergyWh;
        const currentPeakW = systemSize.peakPowerW;

        // Future values
        const syntheticProfile = [{
            name: 'Projected Future Load',
            quantity: 1,
            watts: currentPeakW * growthFactor,
            hours: (currentDailyWh * growthFactor) / (currentPeakW * growthFactor) // Preserve hours ratio
        }];

        const currentPhase = is3Phase ? '3-phase' : '1-phase';

        const futureSize = calculateSystemSize(syntheticProfile, outageHours, currentPhase, constants);
        const futureFinance = calculateFinancials(futureSize, { outageHoursPerDay: outageHours }, constants);

        setFutureData({
            size: futureSize,
            financials: futureFinance
        });
        setShowFutureModal(true);
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', color: 'white', paddingBottom: '4rem' }}>

            {/* FUTURE SCENARIO MODAL */}
            {showFutureModal && futureData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000
                }} onClick={() => setShowFutureModal(false)}>

                    <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '900px', background: '#0f172a', border: '1px solid var(--color-accent-electric-blue)', boxShadow: '0 0 50px rgba(59, 130, 246, 0.2)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid var(--color-border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Activity color="var(--color-accent-electric-blue)" /> Future Growth Simulation
                                </h2>
                                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Comparing current needs vs. projected +20% load increase.</p>
                            </div>
                            <button onClick={() => setShowFutureModal(false)} className="btn-icon-only"><span style={{ fontSize: '1.5rem' }}>&times;</span></button>
                        </div>

                        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* CURRENT */}
                            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid var(--color-border-glass)' }}>
                                <div style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Current Specs</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>{formatCurrency(financials.capexSolar)}</div>
                                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                                        <span>PV Array</span> <span>{systemSize.recommended.pvKw} kWp</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                                        <span>Battery Bank</span> <span>{systemSize.recommended.batteryKwh} kWh</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                                        <span>Inverter</span> <span>{systemSize.recommended.inverterKw} kW</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                        <CheckCircle size={16} color="var(--color-primary)" /> PV - 20 Years
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                        <CheckCircle size={16} color="var(--color-primary)" /> Battery - 10 Years
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                        <ShieldCheck size={16} color="var(--color-accent-emerald)" /> Total System - 5 Years
                                    </div>
                                </div>
                            </div>

                            {/* FUTURE */}
                            <div style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '1rem', border: '1px solid var(--color-accent-electric-blue)', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '-10px', right: '20px', background: 'var(--color-accent-electric-blue)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>+20% SCENARIO</div>
                                <div style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', color: 'var(--color-accent-electric-blue)', marginBottom: '1rem' }}>Projected Specs</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>{formatCurrency(futureData.financials.capexSolar)}</div>

                                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white' }}>
                                        <span>PV Array</span>
                                        <span style={{ fontWeight: 600 }}>{futureData.size.recommended.pvKw} kWp <span style={{ fontSize: '0.8rem', color: 'var(--color-accent-emerald)' }}>(+{Math.max(0, (futureData.size.recommended.pvKw - systemSize.recommended.pvKw).toFixed(2))})</span></span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white' }}>
                                        <span>Battery Bank</span>
                                        <span style={{ fontWeight: 600 }}>{futureData.size.recommended.batteryKwh} kWh <span style={{ fontSize: '0.8rem', color: 'var(--color-accent-emerald)' }}>(+{futureData.size.recommended.batteryKwh - systemSize.recommended.batteryKwh})</span></span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white' }}>
                                        <span>Inverter</span>
                                        <span style={{ fontWeight: 600 }}>{futureData.size.recommended.inverterKw} kW <span style={{ fontSize: '0.8rem', color: 'var(--color-accent-emerald)' }}>(+{futureData.size.recommended.inverterKw - systemSize.recommended.inverterKw})</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--color-border-glass)', background: 'rgba(0,0,0,0.2)', textAlign: 'right' }}>
                            <button onClick={() => setShowFutureModal(false)} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--color-border-glass)' }}>Close Simulation</button>
                        </div>
                    </div>
                </div>
            )}

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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'help' }} title="Maximum simultaneous power draw allowed">
                                Rated Peak Load <Info size={12} color="var(--color-text-muted)" />
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white' }}>{((systemSize.totalDailyEnergyWh || 0) / 1000).toFixed(1)} kWh</div>
                            <div>Daily Demand</div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <CheckCircle size={12} color="var(--color-accent-emerald)" />
                    <span>Model Confidence: High</span>
                    <span style={{ margin: '0 4px', opacity: 0.3 }}>|</span>
                    <span>Factors Applied: Inverter Eff. (95%), DoD (90%), Safety Buffer (15%)</span>
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
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Usable Storage Capacity</div>
                                {technicalView && <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginTop: '0.5rem' }}>LiFePO4 • 6000 Cycles</div>}
                            </div>

                            {/* Inverter */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--color-accent-electric-blue)' }}></div>
                                <Zap size={24} color="var(--color-accent-electric-blue)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                                    {inverterKw} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>kW</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Inverter Rated Output</div>
                                {technicalView && <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-electric-blue)', marginTop: '0.5rem' }}>Pure Sine Wave • 5ms Transfer</div>}
                            </div>

                            {/* PV Array */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--color-primary)' }}></div>
                                <Sun size={24} color="var(--color-primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                                    {pvKw} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>kWp</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>PV Array Peak Power</div>
                                {technicalView && <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.5rem' }}>Monocrystalline • High Efficiency</div>}
                            </div>
                        </div>

                        {/* System Diagram Simplification */}
                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '1rem', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.5rem', borderRadius: '50%' }}>
                                    <CheckCircle size={20} color="var(--color-accent-electric-blue)" />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Configuration Validation</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6' }}>
                                        This {systemSize.recommended.inverterKw}kW architecture is sized to handle your peak continuous load of <strong>{formatNumber(systemSize.peakPowerW)}W</strong> with a <span style={{ color: 'var(--color-accent-emerald)', fontWeight: 600 }}>{(systemSize.recommended.inverterKw * 1000 - systemSize.peakPowerW) / 1000}kW headroom buffer</span> for startup surges.
                                    </p>
                                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6', marginTop: '0.5rem' }}>
                                        The {systemSize.recommended.batteryKwh}kWh battery bank provides <strong>{outageHours} hours</strong> of guaranteed autonomy at full rated load, extending up to {Math.round(outageHours * 1.5)} hours under normal usage patterns.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* What-If Scenarios (New) */}
                        <div style={{ marginTop: '1rem' }}>
                            <button className="card hover:bg-white/5 transition-all" style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid var(--color-border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={handleFutureScenario}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-highlight)' }}>
                                    <Activity size={18} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Test Scenario: Add 20% Future Growth Buffer</span>
                                </div>
                                <ArrowRight size={16} color="var(--color-text-muted)" />
                            </button>
                        </div>

                    </div>

                    {/* 4️⃣ RELIABILITY METRICS */}
                    <div className="card" style={{ background: 'var(--color-surface-matte)', border: '1px solid var(--color-border-glass)', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
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
                        {hourlyNote && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Info size={14} color="var(--color-accent-electric-blue)" /> {hourlyNote}
                            </div>
                        )}

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
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Grid Autonomy Factor</span>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white' }}>
                                    {financials.analysis.solarFraction}%
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4', marginTop: '0.5rem' }}>
                                    Percentage of total load demand met directly by solar PV.
                                </div>
                            </div>

                            {/* Metric 2: Production */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <Sun size={24} color="var(--color-primary)" />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Daily Energy Yield</span>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white' }}>
                                    {((Array.isArray(hourlyData) ? hourlyData.reduce((acc, curr) => acc + (curr.solar || 0), 0) : 0) / 1000).toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b' }}>kWh</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4', marginTop: '0.5rem' }}>
                                    Average daily production based on local irradiance data.
                                </div>
                            </div>

                            {/* Metric 3: Excess / Safety */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <Battery size={24} color="var(--color-secondary)" />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Surplus Generation Potential</span>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white' }}>
                                    {((Array.isArray(hourlyData) ? hourlyData.reduce((acc, curr) => acc + Math.max(0, (curr.solar || 0) - (curr.load || 0)), 0) : 0) / 1000).toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b' }}>kWh</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4', marginTop: '0.5rem' }}>
                                    Available energy for battery charging or future load growth.
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

                        {/* What this delivers */}
                        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border-glass)' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Check size={16} color="var(--color-primary)" /> System Deliverables
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div style={{ width: '4px', height: '4px', background: '#94a3b8', borderRadius: '50%', marginTop: '8px' }}></div>
                                    <span><strong>{userType === 'sme' ? 'Business Continuity:' : 'Energy Security:'}</strong> Zero downtime during grid failures.</span>
                                </li>
                                <li style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div style={{ width: '4px', height: '4px', background: '#94a3b8', borderRadius: '50%', marginTop: '8px' }}></div>
                                    <span><strong>Asset Value:</strong> 25+ year solar panel lifespan.</span>
                                </li>
                                <li style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div style={{ width: '4px', height: '4px', background: '#94a3b8', borderRadius: '50%', marginTop: '8px' }}></div>
                                    <span><strong>Operational Savings:</strong> {financials.analysis.solarFraction}% reduction in utility bills.</span>
                                </li>
                            </ul>
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
                            <Download size={20} style={{ marginRight: '0.75rem' }} /> Download Technical Proposal
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                onClick={onFinance}
                                className="card"
                                style={{
                                    padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)',
                                    color: 'white', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.75rem', borderRadius: '50%' }}>
                                    <DollarSign size={24} color="#60a5fa" />
                                </div>
                                <span style={{ fontSize: '1rem', fontWeight: 600 }}>Finance Application</span>
                            </button>

                            <button
                                onClick={() => onOpenAdvisory('consultation')}
                                className="card"
                                style={{
                                    padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)',
                                    color: 'white', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-accent-emerald)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '50%' }}>
                                    <FileText size={24} color="#34d399" />
                                </div>
                                <span style={{ fontSize: '1rem', fontWeight: 600 }}>Schedule Consultation</span>
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
