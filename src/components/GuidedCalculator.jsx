import React, { useState, useEffect } from 'react';
import {
    Zap, Home, Briefcase, Server, Monitor, Wifi,
    ArrowRight, ArrowLeft, Check, Plus, Trash2,
    Info, Clock, BarChart3, ChevronRight, Settings, X
} from 'lucide-react';

const LOAD_CATEGORIES = {
    residential: [
        {
            id: 'essential',
            label: 'Essential Loads',
            icon: Zap,
            description: 'Critical for daily living',
            items: [
                { name: 'LED Bulbs (Pack)', watts: 50, hours: 6 },
                { name: 'Refrigerator', watts: 150, hours: 24 },
                { name: 'WiFi Router', watts: 15, hours: 24 },
                { name: 'LCD TV', watts: 100, hours: 4 },
                { name: 'Phone Chargers', watts: 20, hours: 4 }
            ]
        },
        {
            id: 'comfort',
            label: 'Comfort & Kitchen',
            icon: Home,
            description: 'Lifestyle & Convenience',
            items: [
                { name: 'Air Conditioner', watts: 1500, hours: 6 },
                { name: 'Washing Machine', watts: 500, hours: 1 },
                { name: 'Water Pump', watts: 750, hours: 0.5 },
                { name: 'Microwave', watts: 1200, hours: 0.3 },
                { name: 'Electric Kettle', watts: 2000, hours: 0.2 },
                { name: 'Iron', watts: 1500, hours: 0.3 },
                { name: 'Electric Cooker', watts: 3000, hours: 1 }
            ]
        }
    ],
    sme: [
        {
            id: 'core',
            label: 'Core Operations',
            icon: Briefcase,
            description: 'Basic office functionality',
            items: [
                { name: 'Office Lighting', watts: 150, hours: 9 },
                { name: 'Desktop PC', watts: 250, hours: 9 },
                { name: 'Laptop', watts: 65, hours: 8 },
                { name: 'WiFi / Network', watts: 30, hours: 24 },
                { name: 'Printer / Copier', watts: 400, hours: 1 }
            ]
        },
        {
            id: 'critical',
            label: 'Critical Systems',
            icon: Server,
            description: 'High dependency infrastructure',
            items: [
                { name: 'Server Rack (Small)', watts: 800, hours: 24 },
                { name: 'Security Camera System', watts: 60, hours: 24 },
                { name: 'POS Terminal', watts: 50, hours: 10 },
                { name: 'Medical Fridge', watts: 200, hours: 24 }
            ]
        }
    ]
};

const PRESETS = {
    residential: [
        { label: 'Small Apartment', loads: [{ name: 'LED Bulbs (Pack)', watts: 40, quantity: 1, hours: 5 }, { name: 'WiFi Router', watts: 10, quantity: 1, hours: 24 }, { name: 'Refrigerator', watts: 150, quantity: 1, hours: 24 }, { name: 'LCD TV', watts: 100, quantity: 1, hours: 4 }] },
        { label: '3-Bedroom Villa', loads: [{ name: 'LED Bulbs (Pack)', watts: 100, quantity: 1, hours: 6 }, { name: 'WiFi Router', watts: 15, quantity: 1, hours: 24 }, { name: 'Refrigerator', watts: 200, quantity: 1, hours: 24 }, { name: 'LCD TV', watts: 150, quantity: 2, hours: 4 }, { name: 'Water Pump', watts: 750, quantity: 1, hours: 1 }] }
    ],
    sme: [
        { label: 'Small Office', loads: [{ name: 'Office Lighting', watts: 200, quantity: 1, hours: 9 }, { name: 'WiFi / Network', watts: 30, quantity: 1, hours: 24 }, { name: 'Laptop', watts: 65, quantity: 4, hours: 8 }, { name: 'Printer / Copier', watts: 300, quantity: 1, hours: 1 }] },
        { label: 'Retail Shop', loads: [{ name: 'Office Lighting', watts: 300, quantity: 1, hours: 10 }, { name: 'POS Terminal', watts: 50, quantity: 1, hours: 10 }, { name: 'Security Camera System', watts: 40, quantity: 1, hours: 24 }] }
    ]
};

const STEPS = [
    { id: 1, label: 'Loads' },
    { id: 2, label: 'Runtime' },
    { id: 3, label: 'Review' }
];

const GuidedCalculator = ({ userType, appliances, setAppliances, outageHours, setOutageHours, phase, setPhase, onCalculate, onBack }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [activeCategory, setActiveCategory] = useState(null);
    const [editingLoad, setEditingLoad] = useState(null); // Load being configured { name, watts, qty ... }

    // Initialize with a preset if empty? No, let user choose.

    const totalWatts = appliances.reduce((sum, app) => sum + (app.watts * app.quantity), 0);
    const dailyKwh = appliances.reduce((sum, app) => sum + (app.watts * app.quantity * app.hours), 0) / 1000;

    const handleAddLoad = (item) => {
        setEditingLoad({ ...item, quantity: 1, id: Date.now() });
    };

    const handleSaveLoad = () => {
        if (!editingLoad) return;
        setAppliances(prev => [...prev, editingLoad]);
        setEditingLoad(null);
    };

    const handleUpdateLoad = (val, field) => {
        setEditingLoad(prev => ({ ...prev, [field]: val }));
    };

    const removeLoad = (id) => {
        setAppliances(prev => prev.filter(a => a.id !== id));
    };

    const applyPreset = (preset) => {
        setAppliances(preset.loads.map(l => ({ ...l, id: Math.random() })));
    };

    const isSelected = (name) => appliances.some(a => a.name === name);

    const handleAddCustomLoad = () => {
        setEditingLoad({ name: '', watts: 100, quantity: 1, hours: 2, id: Date.now(), isCustom: true });
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', minHeight: '80vh', alignItems: 'stretch' }}>

            {/* LEFT: Main Content */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-charcoal)', border: '1px solid var(--color-border-glass)', padding: 0, overflow: 'hidden' }}>

                {/* Step Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <button onClick={onBack} style={{ marginRight: '1rem', background: 'none', color: 'var(--color-text-muted)', padding: 0 }}><ArrowLeft /></button>
                    <div style={{ display: 'flex', gap: '2rem', flex: 1, justifyContent: 'center' }}>
                        {STEPS.map(step => (
                            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: currentStep === step.id ? 'white' : (currentStep > step.id ? 'var(--color-accent-emerald)' : 'var(--color-text-muted)') }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: currentStep === step.id ? 'var(--color-accent-electric-blue)' : (currentStep > step.id ? 'var(--color-accent-emerald)' : 'rgba(255,255,255,0.1)'),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: currentStep >= step.id ? 'white' : '#64748b'
                                }}>
                                    {currentStep > step.id ? <Check size={14} /> : step.id}
                                </div>
                                <span style={{ fontSize: '0.9rem', fontWeight: currentStep === step.id ? 600 : 400 }}>{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

                    {/* STEP 1: LOAD SELECTION */}
                    {currentStep === 1 && (
                        <div className="animate-fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'white' }}>Define Critical Loads</h2>
                                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                        Precision inputs ensure accurate inverter sizing.
                                    </p>
                                </div>
                                <button
                                    onClick={handleAddCustomLoad}
                                    className="btn-primary"
                                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--color-border-glass)', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                >
                                    + Custom Device
                                </button>
                            </div>

                            {/* Presets */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                {PRESETS[userType].map((preset, i) => (
                                    <button
                                        key={i}
                                        onClick={() => applyPreset(preset)}
                                        style={{
                                            padding: '0.75rem 1.25rem', borderRadius: '2rem', border: '1px solid var(--color-border-glass)',
                                            background: 'rgba(255,255,255,0.03)', color: 'var(--color-text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap'
                                        }}
                                        className="hover:bg-white/5 hover:text-white hover:border-white/20 transition-all"
                                    >
                                        + {preset.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {LOAD_CATEGORIES[userType].map(cat => (
                                    <div key={cat.id} style={{
                                        borderRadius: '1rem', border: '1px solid var(--color-border-glass)', background: 'rgba(255,255,255,0.02)', padding: '1.5rem',
                                        transition: 'all 0.3s'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-accent-electric-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <cat.icon size={20} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', color: 'white' }}>{cat.label}</h3>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cat.description}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            {cat.items.map(item => {
                                                const selected = isSelected(item.name);
                                                return (
                                                    <button
                                                        key={item.name}
                                                        onClick={() => handleAddLoad(item)}
                                                        style={{
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem',
                                                            borderRadius: '0.75rem',
                                                            background: selected ? 'rgba(211, 47, 47, 0.1)' : 'rgba(255,255,255,0.03)',
                                                            border: selected ? '1px solid var(--color-primary)' : '1px solid transparent',
                                                            color: selected ? 'white' : 'var(--color-text-muted)',
                                                            cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', width: '100%',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        className="hover:bg-white/5 hover:text-white transition-colors"
                                                    >
                                                        <span>{item.name}</span>
                                                        {selected ? <Check size={16} color="var(--color-primary)" /> : <Plus size={16} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: RUNTIME PREFERENCE */}
                    {currentStep === 2 && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'white' }}>Backup Duration</h2>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '3rem' }}>
                                How long do you need these appliances to run during a power outage?
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                                {[4, 8, 12].map(hrs => (
                                    <button
                                        key={hrs}
                                        onClick={() => setOutageHours(hrs)}
                                        style={{
                                            padding: '2rem', borderRadius: '1rem',
                                            border: outageHours === hrs ? '2px solid var(--color-accent-electric-blue)' : '1px solid var(--color-border-glass)',
                                            background: outageHours === hrs ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                                            color: outageHours === hrs ? 'white' : 'var(--color-text-muted)',
                                            textAlign: 'center', transition: 'all 0.3s'
                                        }}
                                    >
                                        <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{hrs}</div>
                                        <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Hours</div>
                                    </button>
                                ))}
                            </div>

                            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>
                                <label className="label" style={{ marginBottom: '1rem', display: 'block' }}>Custom Duration (Hours)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <Clock size={24} color="var(--color-text-muted)" />
                                    <input
                                        type="range" min="1" max="24" step="1"
                                        value={outageHours}
                                        onChange={(e) => setOutageHours(Number(e.target.value))}
                                        style={{ flex: 1 }}
                                    />
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', minWidth: '80px', textAlign: 'right' }}>
                                        {outageHours} h
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: REVIEW */}
                    {currentStep === 3 && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'white' }}>System Architecture Review</h2>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                                Verify your load profile and connection type.
                            </p>

                            {/* Phase Selection */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '1rem' }}>Grid Connection Phase</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    {[
                                        { id: '1-phase', label: 'Single Phase', desc: 'Typical Residential' },
                                        { id: '3-phase', label: 'Three Phase', desc: 'Large Home / Ind.' },
                                        { id: 'unknown', label: "I Don't Know", desc: 'Defaults to Single' }
                                    ].map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setPhase(p.id)}
                                            style={{
                                                padding: '1rem', borderRadius: '0.5rem',
                                                border: phase === p.id ? '2px solid var(--color-accent-electric-blue)' : '1px solid var(--color-border-glass)',
                                                background: phase === p.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                                                color: phase === p.id ? 'white' : 'var(--color-text-muted)',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{p.label}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{p.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Peak Continuous Load</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{totalWatts} W</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-accent-emerald)', marginTop: '0.5rem' }}>Peak Demand</div>
                                </div>
                                <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Backup Duration</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>{outageHours} Hours</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-accent-electric-blue)', marginTop: '0.5rem' }}>Autonomy</div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid var(--color-border-glass)', overflow: 'hidden' }}>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border-glass)', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Selected Appliances</div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {appliances.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No appliances selected.</div>
                                    ) : (
                                        appliances.map(app => (
                                            <div key={app.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 30px', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--color-border-glass)', alignItems: 'center' }}>
                                                <div style={{ color: 'white' }}>{app.name}</div>
                                                <div style={{ color: 'var(--color-text-muted)' }}>{app.watts}W</div>
                                                <div style={{ color: 'var(--color-text-muted)' }}>x {app.quantity}</div>
                                                <div style={{ color: 'var(--color-text-muted)' }}>{app.hours}h</div>
                                                <button onClick={() => removeLoad(app.id)} style={{ color: '#ef4444', background: 'none', cursor: 'pointer', padding: 0 }}><Trash2 size={16} /></button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Controls */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    <button
                        onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()}
                        style={{ color: 'var(--color-text-muted)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}
                    >
                        Back
                    </button>
                    {currentStep < 3 ? (
                        <button onClick={() => setCurrentStep(currentStep + 1)} className="btn-primary">
                            Next Step
                        </button>
                    ) : (
                        <button onClick={onCalculate} className="btn-primary" style={{ background: 'var(--color-accent-emerald)', padding: '1rem 3rem' }}>
                            Generate Architecture <Zap size={18} style={{ marginLeft: '0.5rem' }} />
                        </button>
                    )}
                </div>

            </div>

            {/* RIGHT: Live Summary Panel */}
            <div className="card" style={{ width: '340px', background: 'var(--color-bg-charcoal)', border: '1px solid var(--color-border-glass)', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderBottom: '1px solid var(--color-border-glass)' }}>
                    <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', textAlign: 'center' }}>Live Logic</h3>
                </div>

                <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                    <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                            <Zap size={18} />
                            <span style={{ fontWeight: 500, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peak Rating</span>
                        </div>
                        <div style={{
                            fontSize: '4rem', fontWeight: 800,
                            color: 'var(--color-primary)', // Red for impact
                            lineHeight: 1,
                            textShadow: '0 0 30px rgba(211, 47, 47, 0.2)'
                        }}>
                            {totalWatts}
                        </div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>Watts (Continuous)</div>
                    </div>

                    <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--color-border-glass)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                            <BarChart3 size={18} />
                            <span style={{ fontWeight: 500, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Energy Demand</span>
                        </div>
                        <div style={{ fontSize: '3rem', fontWeight: 700, color: 'white' }}>{dailyKwh.toFixed(1)}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>kWh / day</div>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--color-border-glass)' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: '1.5', textAlign: 'center' }}>
                        {currentStep === 1 && "Accurate wattage ensures your inverter won't trip during peak usage."}
                        {currentStep === 2 && "Generators are costly to run. More battery hours = less fuel burned."}
                        {currentStep === 3 && "Review your critical loads. Are there any always-on devices you missed?"}
                    </p>
                </div>
            </div>

            {/* Load Config Modal */}
            {editingLoad && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '450px', background: '#1e1e1e', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-premium)' }}>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', color: 'white' }}>
                                {editingLoad.isCustom ? 'Add Custom Device' : `Configure ${editingLoad.name}`}
                            </h3>
                            <button onClick={() => setEditingLoad(null)} style={{ background: 'none', color: 'var(--color-text-muted)' }}><X size={20} /></button>
                        </div>

                        {editingLoad.isCustom && (
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Device Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={editingLoad.name}
                                    onChange={(e) => handleUpdateLoad(e.target.value, 'name')}
                                    placeholder="e.g. Pool Pump"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="label">Quantity of Units</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border-glass)' }}>
                                <button onClick={() => handleUpdateLoad(Math.max(1, editingLoad.quantity - 1), 'quantity')} className="btn-icon-only" style={{ width: '40px', height: '40px' }}>-</button>
                                <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, flex: 1, textAlign: 'center' }}>{editingLoad.quantity}</span>
                                <button onClick={() => handleUpdateLoad(editingLoad.quantity + 1, 'quantity')} className="btn-icon-only" style={{ width: '40px', height: '40px' }}>+</button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="label">Rated Wattage (W)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={editingLoad.watts}
                                onChange={(e) => handleUpdateLoad(Number(e.target.value), 'watts')}
                                style={{ fontSize: '1.2rem', padding: '1rem' }}
                            />
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                check device label for "Rated Power"
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label className="label">Daily Runtime Duration</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    <span>{editingLoad.hours} Hours / Day</span>
                                </div>
                                <input
                                    type="range" min="0.5" max="24" step="0.5"
                                    value={editingLoad.hours}
                                    onChange={(e) => handleUpdateLoad(Number(e.target.value), 'hours')}
                                    style={{ width: '100%', height: '6px', accentColor: 'var(--color-accent-electric-blue)' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    <span>30m</span>
                                    <span>12h</span>
                                    <span>24h (Always On)</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-emerald)', marginTop: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                                    <Info size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                    Tip: Be conservative. Over-estimating runtime significantly increases battery cost.
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setEditingLoad(null)} style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--color-border-glass)', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-full)' }}>Cancel</button>
                            <button onClick={handleSaveLoad} className="btn-primary" style={{ flex: 1, background: 'var(--color-primary)' }}>
                                {editingLoad.isCustom ? 'Add Device' : 'Confirm Load'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default GuidedCalculator;
