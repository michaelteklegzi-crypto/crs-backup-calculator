import React, { useState } from 'react';
import { Plus, Trash2, Zap, Info } from 'lucide-react';

const TYPICAL_RANGES = {
    'LED': { min: 3, max: 100 },
    'Ref': { min: 50, max: 800 }, // Refrigerator
    'Tel': { min: 30, max: 500 }, // Television
    'Lap': { min: 20, max: 150 }, // Laptop
    'Wi': { min: 5, max: 50 },    // WiFi
    'Pum': { min: 300, max: 3000 }, // Pump
    'Fan': { min: 20, max: 150 },
    'Air': { min: 800, max: 4000 }, // AC
    'Iro': { min: 800, max: 2500 }, // Iron
    'Ket': { min: 1000, max: 3000 }, // Kettle
    'Sto': { min: 1000, max: 4000 }, // Stove
    'Boil': { min: 1000, max: 4000 } // Boiler
};

const getWattageWarning = (name, watts) => {
    if (!name || !watts) return null;
    // Simple fuzzy match check
    const key = Object.keys(TYPICAL_RANGES).find(k => name.toLowerCase().includes(k.toLowerCase()));
    if (key) {
        const range = TYPICAL_RANGES[key];
        if (watts < range.min || watts > range.max) {
            return `Typical range: ${range.min}-${range.max}W`;
        }
    }
    // General sanity check if no match
    if (watts > 5000) return 'Very high wattage?';
    return null;
};

const COMMON_APPLIANCES = [
    { name: 'LED Bulbs (5x)', watts: 50 },
    { name: 'Refrigerator', watts: 150 },
    { name: 'Television (LED)', watts: 80 },
    { name: 'Laptop', watts: 60 },
    { name: 'WiFi Router', watts: 10 },
    { name: 'Water Pump', watts: 750 },
    { name: 'Fan', watts: 60 },
    { name: 'Air Conditioner (Small)', watts: 1500 },
];

const Calculator = ({ appliances, setAppliances, outageHours, setOutageHours, onCalculate }) => {

    const addAppliance = () => {
        setAppliances([
            ...appliances,
            { id: Date.now(), name: 'New Appliance', watts: 100, quantity: 1, hours: 2 }
        ]);
    };

    const removeAppliance = (id) => {
        setAppliances(appliances.filter(a => a.id !== id));
    };

    const updateAppliance = (id, field, value) => {
        setAppliances(appliances.map(a =>
            a.id === id ? { ...a, [field]: value } : a
        ));
    };

    const totalLoad = appliances.reduce((sum, app) => sum + (app.watts * app.quantity * app.hours), 0);

    return (
        <div className="card" style={{ height: '100%' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>Energy Profile</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Define your backup needs. Break down your appliances to see accurate requirements.
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Daily Load</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{(totalLoad / 1000).toFixed(1)} kWh</div>
                </div>
            </div>

            {/* Outage Slider */}
            <div style={{ marginBottom: '2.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <label className="label" style={{ margin: 0, color: 'white' }}>Backup Duration Needed</label>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{outageHours} Hours</span>
                </div>
                <input
                    type="range" min="1" max="24" step="1"
                    style={{ width: '100%' }}
                    value={outageHours}
                    onChange={(e) => setOutageHours(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span>1 hr</span>
                    <span>12 hr</span>
                    <span>24 hr</span>
                </div>
            </div>

            {/* Appliance List */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 500 }}>Appliances</h3>
                    <button onClick={addAppliance} className="btn-icon-only" style={{ width: 'auto', padding: '0 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', gap: '0.5rem' }}>
                        <Plus size={14} /> Add Pattern
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 2fr) 1fr 0.7fr 30px', gap: '0.75rem', padding: '0 0.5rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <div>Item</div>
                    <div>Watts</div>
                    <div>Qty</div>
                    <div></div>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {appliances.map((app) => (
                        <div key={app.id} className="animate-fade-in" style={{
                            display: 'grid', gridTemplateColumns: 'minmax(100px, 2fr) 1fr 0.7fr 30px', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center',
                            background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {/* Name Input with Datalist */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <input
                                    className="input-field"
                                    list="common-appliances"
                                    value={app.name}
                                    onChange={(e) => updateAppliance(app.id, 'name', e.target.value)}
                                    placeholder="Device (e.g. Fridge)"
                                    style={{ padding: '0.4rem', fontSize: '0.9rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--color-border-glass)', borderRadius: 0 }}
                                />
                                {getWattageWarning(app.name, app.watts) && (
                                    <span style={{ fontSize: '0.65rem', color: 'orange', marginTop: '2px' }}>
                                        {getWattageWarning(app.name, app.watts)}
                                    </span>
                                )}
                            </div>

                            <input
                                type="number" className="input-field" value={app.watts}
                                onChange={(e) => updateAppliance(app.id, 'watts', Number(e.target.value))}
                                style={{ padding: '0.4rem', textAlign: 'center', borderColor: getWattageWarning(app.name, app.watts) ? 'orange' : 'inherit' }}
                            />

                            <input
                                type="number" className="input-field" value={app.quantity}
                                onChange={(e) => updateAppliance(app.id, 'quantity', Number(e.target.value))}
                                style={{ padding: '0.4rem', textAlign: 'center' }}
                            />

                            {/* Hidden Hours Input (State preserved but UI removed) */}
                            {/* We assume hours = outageHours or default daily usage. 
                                Ideally we show "Daily Hrs" but user said it's confusing.
                            */}

                            <button onClick={() => removeAppliance(app.id)} style={{ color: 'var(--color-text-muted)', background: 'none', padding: '0' }} className="hover:text-red-500">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <datalist id="common-appliances">
                    {COMMON_APPLIANCES.map(ca => <option key={ca.name} value={ca.name} />)}
                </datalist>

                {/* Submit Action */}
                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={onCalculate}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
                    >
                        <Zap size={20} />
                        Calculate System Requirements
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                        Get instant sizing for solar, battery, and inverter.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Calculator;
