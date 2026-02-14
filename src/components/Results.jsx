import React, { useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, Share2, Sun, Battery, Zap, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
                <p style={{ color: '#94a3b8', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} style={{ color: entry.color, fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: 500 }}>
                        {entry.name}: {entry.value} {entry.unit || ''}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const Results = ({ systemSize, financials, comparisonData, hourlyData, onGetProposal, onFinance }) => {
    const [activeTab, setActiveTab] = useState('energy'); // 'energy' | 'financial'

    // Safety Check
    if (!systemSize || !financials || !comparisonData || !hourlyData) {
        return (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1' }}>
                <AlertTriangle size={48} color="#eab308" style={{ margin: '0 auto 1rem' }} />
                <h3>Results Data Unavailable</h3>
                <p>Please try recalculating your system parameters.</p>
            </div>
        );
    }

    const { analysis } = financials;
    if (!analysis) {
        return <div className="p-4">Calculating financial analysis...</div>
    }

    const formatCurrency = (val) => {
        if (isNaN(val)) return 'ETB 0';
        return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(val);
    };

    // Safe access for comparison chart summary
    const lastYearData = comparisonData.length > 0 ? comparisonData[comparisonData.length - 1] : { Diesel: 0, Solar: 0 };
    const breakEvenYear = comparisonData.find(d => d.Solar <= d.Diesel)?.year || '7+';

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Top Stats Row */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'stretch' }}>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}><Sun size={24} /></div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{systemSize.recommended?.pvKw || 0} kW</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Solar Array</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ color: 'var(--color-secondary)', marginBottom: '0.5rem' }}><Battery size={24} /></div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{systemSize.recommended?.batteryKwh || 0} kWh</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Battery Storage</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ color: 'var(--color-accent)', marginBottom: '0.5rem' }}><Zap size={24} /></div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{systemSize.recommended?.inverterKw || 0} kW</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Hybrid Inverter</div>
                    </div>
                </div>

                {/* Product Image */}
                <div style={{
                    width: '100px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '1rem',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <img src="/images/crs_product_unit.png" alt="CRS Unit" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('energy')}
                    style={{
                        padding: '0.75rem',
                        background: activeTab === 'energy' ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === 'energy' ? 'white' : 'var(--color-text-muted)',
                        borderRadius: '0.25rem',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                    }}
                >
                    Daily Energy Flow
                </button>
                <button
                    onClick={() => setActiveTab('financial')}
                    style={{
                        padding: '0.75rem',
                        background: activeTab === 'financial' ? 'var(--color-accent)' : 'transparent',
                        color: activeTab === 'financial' ? 'white' : 'var(--color-text-muted)',
                        borderRadius: '0.25rem',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                    }}
                >
                    Financial Analysis
                </button>
            </div>

            {/* Visualizations */}
            <div style={{ flex: 1, minHeight: '300px', position: 'relative' }}>
                {activeTab === 'energy' && (
                    <div className="animate-fade-in" style={{ width: '100%' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Simulated performance on a typical sunny day. Yellow is production, Green fill is battery charge level.
                        </p>
                        <div style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} interval={3} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                                    <Area type="monotone" yAxisId="left" dataKey="solar" name="Solar Yield (Wh)" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorSolar)" strokeWidth={2} />
                                    <Area type="step" yAxisId="left" dataKey="load" name="Consumption (Wh)" stroke="white" fill="rgba(255,255,255,0.05)" strokeDasharray="4 4" strokeWidth={1} />
                                    <Line type="monotone" yAxisId="right" dataKey="batteryState" name="Battery SoC (%)" stroke="var(--color-secondary)" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }}></div>
                                Solar Fraction: <strong>{analysis.solarFraction || 0}%</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1' }}></div>
                                Grid Dependency: <strong>{100 - (analysis.solarFraction || 0)}%</strong>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="animate-fade-in" style={{ width: '100%' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Cost Comparison (7 Years): <strong>Diesel Gen + Grid Bill</strong> vs <strong>Solar System + Residual Grid</strong>.
                        </p>
                        <div style={{ height: '300px', width: '100%', marginBottom: '1rem' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={comparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} padding={{ left: 20, right: 20 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}
                                        formatter={(value, name, props) => {
                                            if (name === 'Solar TCO' || name === 'Diesel TCO') return [formatCurrency(value), name];
                                            return [formatCurrency(value), name];
                                        }}
                                        labelStyle={{ color: '#94a3b8' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="Solar" name="Solar TCO" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Diesel" name="Diesel TCO" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Detailed breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                            {/* Running Cost Analysis */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    <TrendingUp size={16} /> Year 3 Running Cost
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '0.9rem' }}>Diesel + Grid:</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(analysis.year3TotalDiesel)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.9rem' }}>Solar + Grid:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{formatCurrency(analysis.year3TotalSolar)}</span>
                                </div>
                            </div>

                            {/* Bill Reduction */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    <DollarSign size={16} /> Annual Bill Savings
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                                    {formatCurrency(analysis.annualBillSavings)}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                    Reduced utility payments
                                </p>
                            </div>
                        </div>

                        {/* CAPEX Note */}
                        <div style={{ marginTop: '1rem', padding: '0.75rem', fontSize: '0.85rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ color: '#fff', fontWeight: 600 }}>Initial Investment (Year 0):</span> Solar System CAPEX is <strong>{formatCurrency(financials.capexSolar)}</strong> vs Generator CAPEX of <strong>{formatCurrency(financials.capexDiesel)}</strong>.
                        </div>

                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--color-secondary)', borderRadius: '0 4px 4px 0' }}>
                            <h4 style={{ color: 'var(--color-secondary)', fontSize: '0.9rem' }}>Total Projected Savings</h4>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.2rem 0 0' }}>
                                {(lastYearData.Diesel - lastYearData.Solar) > 0 ?
                                    `Save ${formatCurrency(lastYearData.Diesel - lastYearData.Solar)} over 7 Years` :
                                    `Break-even point near Year ${breakEvenYear}`
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                    onClick={onFinance}
                    className="btn-primary" // Reuse class but override colors
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'transparent', border: '1px solid var(--color-primary)',
                        boxShadow: 'none', color: 'var(--color-primary)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(211, 47, 47, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <DollarSign size={18} /> Finance Options
                </button>

                <button
                    onClick={onGetProposal}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Download size={18} /> Get Proposal
                </button>
            </div>
        </div>
    );
};

export default Results;
