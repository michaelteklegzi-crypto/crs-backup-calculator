import React, { useState, useEffect } from 'react';
import { X, Info, Database, Settings, ChevronDown, ChevronRight, User, Phone, MapPin, Calendar, DollarSign, FileText, RefreshCw, Save, Truck, Activity } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { runCostEngine } from '../utils/costEngine';

const DESCRIPTIONS = {
    SYSTEM_EFFICIENCY: "Overall system efficiency factor (0-1). Accounts for wire loss, etc.",
    DEPTH_OF_DISCHARGE: "Usable battery capacity (0.9 = 90% for Li-ion).",
    PEAK_SUN_HOURS: "Average daily peak sun hours for the region.",
    INVERTER_OVERSIZE_FACTOR: "Ratio of Inverter Size to Peak Load (Safety margin).",

    SPEC_PV_WATTAGE: "Wattage of a single PV Panel (e.g., 550W).",
    SPEC_BATTERY_KWH: "Capacity of a single Battery Unit (e.g., 5kWh).",
    SPEC_INVERTER_KW: "Capacity of a single Inverter Unit (e.g., 5kW).",

    COST_UNIT_PV_PANEL: "Cost of ONE PV Panel Unit (ETB) - Auto-calculated.",
    COST_UNIT_BATTERY: "Cost of ONE Battery Unit (ETB) - Auto-calculated.",
    COST_UNIT_INVERTER: "Cost of ONE 1-Phase Inverter (5kW) - Auto-calculated.",
    COST_UNIT_INVERTER_3PH: "Cost of ONE 3-Phase Inverter (15kW) - Auto-calculated.",

    COST_INSTALLATION_FLAT: "Flat fee for installation labor and logistics (ETB).",
    MAINTENANCE_ANNUAL_SOLAR: "Annual maintenance cost for cleaning and checkups (ETB).",

    GRID_PRICE_PER_KWH: "Current Grid Tariff per kWh (ETB).",
    GRID_INFLATION_RATE: "Annual expected increase in grid electricity prices (decimal).",

    // Generator Constants
    GEN_CAPEX: "Generator initial cost (ETB).",
    GEN_FUEL_CONSUMPTION_LPH: "Liters of diesel consumed per hour.",
    GEN_MAINTENANCE_COST_PER_HOUR: "Generator maintenance/hour (ETB).",
    FUEL_PRICE_PER_LITER: "Diesel fuel price (ETB).",
    INFLATION_RATE: "Fuel inflation rate (decimal)."
};

const AdminPanel = ({ constants, onUpdate, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('leads'); // 'params' | 'leads' | 'banks' | 'costs'
    const [localConstants, setLocalConstants] = useState(constants);
    const [leads, setLeads] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedLead, setExpandedLead] = useState(null);

    // Cost Module State
    const [costSettings, setCostSettings] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(null);
    const [calculating, setCalculating] = useState(false);

    // Bank Form State
    const [newBank, setNewBank] = useState({ name: '', interest_rate: '' });

    useEffect(() => {
        if (isOpen) {
            if (activeTab === 'leads') fetchLeads();
            if (activeTab === 'banks') fetchBanks();
            if (activeTab === 'costs') fetchCostSettings();
        }
    }, [isOpen, activeTab]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const { data: leadsData, error: leadsError } = await supabase
                .from('leads')
                .select(`
                    *,
                    proposals(*),
                    site_visits(*),
                    loan_applications(*)
                `)
                .order('created_at', { ascending: false });

            if (leadsError) throw leadsError;
            setLeads(leadsData || []);
        } catch (err) {
            console.error("Error fetching admin data:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBanks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('banks').select('*').order('name');
            if (error) throw error;
            setBanks(data || []);
        } catch (err) {
            console.error("Error fetching banks:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCostSettings = async () => {
        setLoading(true);
        try {
            // Fetch Equipment Settings
            const { data: settings, error } = await supabase.from('equipment_import_costs').select('*').order('equipment_type');
            if (error) throw error;
            setCostSettings(settings || []);

            // Fetch Latest Exchange Rate
            const { data: rate, error: rateError } = await supabase.from('exchange_rates').select('*').order('fetched_at', { ascending: false }).limit(1).single();
            if (rate) setExchangeRate(rate);
        } catch (err) {
            console.error("Error fetching cost settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCostSettingChange = (id, field, value) => {
        setCostSettings(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: parseFloat(value) || 0 } : item
        ));
    };

    const saveCostSettings = async () => {
        setLoading(true);
        try {
            const updates = costSettings.map(item => ({
                id: item.id,
                equipment_type: item.equipment_type,
                import_usd: item.import_usd,
                shipping_usd: item.shipping_usd,
                customs_duty_percent: item.customs_duty_percent,
                inland_transport_etb: item.inland_transport_etb,
                margin_percent: item.margin_percent
            }));

            const { error } = await supabase.from('equipment_import_costs').upsert(updates);
            if (error) throw error;
            alert("Cost settings saved successfully.");
        } catch (err) {
            console.error("Error saving cost settings:", err);
            alert("Failed to save settings.");
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculateCosts = async () => {
        setCalculating(true);
        try {
            // 1. Save current settings first to ensure logic uses latest
            await saveCostSettings();

            // 2. Run Engine
            const result = await runCostEngine(); // Returns { exchangeRate, costs: { COST_UNIT_PV... } }

            // 3. Update Local Constants
            const newConstants = { ...localConstants, ...result.costs };
            setLocalConstants(newConstants);

            // 4. Trigger Parent Update (App.jsx)
            onUpdate(newConstants);

            // 5. Refresh UI
            setExchangeRate({ rate_sell: result.exchangeRate, fetched_at: new Date().toISOString() });

            // Format nice message
            const details = Object.entries(result.costs)
                .map(([k, v]) => `${k.replace('COST_UNIT_', '')}: ${new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(v)}`)
                .join('\n');

            alert(`Costs recalculated successfully using Exchange Rate: ${result.exchangeRate.toFixed(4)} ETB/USD.\n\nNew Unit Costs:\n${details}`);

        } catch (err) {
            console.error("Cost Calculation Logic Failed:", err);
            alert(`Calculation failed: ${err.message}`);
        } finally {
            setCalculating(false);
        }
    };

    const handleAddBank = async (e) => {
        e.preventDefault();
        if (!newBank.name || !newBank.interest_rate) return;

        try {
            const { error } = await supabase.from('banks').insert([{
                name: newBank.name,
                interest_rate: parseFloat(newBank.interest_rate),
                active: true
            }]);

            if (error) throw error;

            setNewBank({ name: '', interest_rate: '' });
            fetchBanks();
        } catch (err) {
            console.error("Error adding bank:", err);
            alert("Failed to add bank.");
        }
    };

    const deleteBank = async (id) => {
        if (!confirm("Are you sure you want to delete this bank?")) return;
        try {
            const { error } = await supabase.from('banks').delete().eq('id', id);
            if (error) throw error;
            fetchBanks();
        } catch (err) {
            console.error("Error deleting bank:", err);
        }
    };

    const handleChange = (key, value) => {
        setLocalConstants(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0
        }));
    };

    const handleSave = () => {
        onUpdate(localConstants);
        onClose();
    };

    const formatLabel = (key) => {
        return key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatCurrency = (val) => {
        if (!val && val !== 0) return 'ETB 0';
        return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(val);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div className="card" style={{ width: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: 0 }}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Settings size={20} /> Admin Dashboard
                    </h2>
                    <button onClick={onClose} className="btn-icon-only" style={{ color: '#94a3b8' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={() => setActiveTab('leads')}
                        style={{
                            flex: 1,
                            padding: '1rem 1.5rem', background: 'transparent',
                            borderBottom: activeTab === 'leads' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'leads' ? 'white' : '#94a3b8',
                            fontWeight: activeTab === 'leads' ? 600 : 400,
                            cursor: 'pointer'
                        }}
                    >
                        Leads & Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('costs')}
                        style={{
                            flex: 1,
                            padding: '1rem 1.5rem', background: 'transparent',
                            borderBottom: activeTab === 'costs' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'costs' ? 'white' : '#94a3b8',
                            fontWeight: activeTab === 'costs' ? 600 : 400,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        <DollarSign size={16} /> Cost Engine
                    </button>
                    <button
                        onClick={() => setActiveTab('banks')}
                        style={{
                            padding: '1rem 1.5rem', background: 'transparent',
                            borderBottom: activeTab === 'banks' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'banks' ? 'white' : '#94a3b8',
                            fontWeight: activeTab === 'banks' ? 600 : 400,
                            cursor: 'pointer'
                        }}
                    >
                        Banks & Rates
                    </button>
                    <button
                        onClick={() => setActiveTab('params')}
                        style={{
                            padding: '1rem 1.5rem', background: 'transparent',
                            borderBottom: activeTab === 'params' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'params' ? 'white' : '#94a3b8',
                            fontWeight: activeTab === 'params' ? 600 : 400,
                            cursor: 'pointer'
                        }}
                    >
                        System Parameters
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

                    {/* LEADS TAB */}
                    {activeTab === 'leads' && (
                        <div className="animate-fade-in">
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading data...</div>
                            ) : leads.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
                                    No leads found.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {leads.map(lead => (
                                        <div key={lead.id} className="card" style={{ padding: '0', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>

                                            {/* Header */}
                                            <div
                                                onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                                                style={{
                                                    padding: '1rem', cursor: 'pointer', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr auto', alignItems: 'center', gap: '1rem',
                                                    background: expandedLead === lead.id ? 'rgba(255,255,255,0.05)' : 'transparent'
                                                }}
                                            >
                                                <div style={{ fontWeight: 600, color: 'white' }}>{lead.name}</div>
                                                <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{lead.email || lead.phone}</div>
                                                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(lead.created_at).toLocaleDateString()}</div>

                                                {/* Indicators */}
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {lead.proposals?.length > 0 && <span title="Proposal Generated" style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontSize: '0.75rem' }}>P</span>}
                                                    {lead.site_visits?.length > 0 && <span title="Site Visit Requested" style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontSize: '0.75rem' }}>SV</span>}
                                                    {lead.loan_applications?.length > 0 && <span title="Loan Applied" style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', fontSize: '0.75rem' }}>$</span>}
                                                </div>

                                                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{lead.source}</div>

                                                <div style={{ transform: expandedLead === lead.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                    <ChevronDown size={20} color="#64748b" />
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {expandedLead === lead.id && (
                                                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                                                        {/* Contact Info */}
                                                        <div>
                                                            <h4 style={{ color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Contact Details</h4>
                                                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.25rem 0' }}>Phone: <span style={{ color: 'white' }}>{lead.phone}</span></p>
                                                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.25rem 0' }}>Email: <span style={{ color: 'white' }}>{lead.email || '-'}</span></p>
                                                            {lead.company && <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.25rem 0' }}>Company: <span style={{ color: 'white' }}>{lead.company}</span></p>}
                                                        </div>

                                                        {/* Applications */}
                                                        <div>
                                                            <h4 style={{ color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Loan Applications</h4>
                                                            {lead.loan_applications?.length > 0 ? (
                                                                lead.loan_applications.map(loan => (
                                                                    <div key={loan.id} style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                                                        <div>{formatCurrency(loan.loan_amount)} • <span style={{ color: '#facc15' }}>{loan.status}</span></div>
                                                                        <div style={{ fontSize: '0.8rem' }}>{loan.term_years} Yrs • Down: {formatCurrency(loan.down_payment)}</div>
                                                                    </div>
                                                                ))
                                                            ) : <div style={{ fontSize: '0.9rem', color: '#64748b' }}>None</div>}

                                                            <h4 style={{ color: '#cbd5e1', marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Site Visits</h4>
                                                            {lead.site_visits?.length > 0 ? (
                                                                lead.site_visits.map(visit => (
                                                                    <div key={visit.id} style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                                                                        <div style={{ color: 'white' }}>{visit.address}</div>
                                                                        <div>{visit.preferred_date || 'Flexible'} • <span style={{ color: '#4ade80' }}>{visit.status}</span></div>
                                                                        {visit.notes && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#64748b' }}>"{visit.notes}"</div>}
                                                                    </div>
                                                                ))
                                                            ) : <div style={{ fontSize: '0.9rem', color: '#64748b' }}>None</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* COST ENGINE TAB (NEW) */}
                    {activeTab === 'costs' && (
                        <div className="animate-fade-in">
                            {/* Exchange Rate Status */}
                            <div className="card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Activity size={20} color="var(--color-accent-emerald)" /> Live Exchange Rate Mode
                                    </h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                        Calculations use daily market rates automatically.
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>USD / ETB Rate</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>
                                        {exchangeRate ? exchangeRate.rate_sell.toFixed(2) : '---'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        Last Updated: {exchangeRate ? new Date(exchangeRate.fetched_at).toLocaleTimeString() : 'Never'}
                                    </div>
                                </div>
                            </div>

                            {/* Equipment Cost Tables */}
                            <div style={{ display: 'grid', gap: '2rem' }}>
                                {costSettings.map(item => (
                                    <div key={item.id} className="card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                {item.equipment_type.replace('_', ' ')}
                                            </h3>
                                            <div style={{ color: 'var(--color-accent-electric-blue)', fontSize: '0.9rem' }}>
                                                Landed Cost Config
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                                            <div>
                                                <label className="label">Import Cost (USD)</label>
                                                <input type="number" className="input-field" value={item.import_usd} onChange={(e) => handleCostSettingChange(item.id, 'import_usd', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="label">Shipping (USD)</label>
                                                <input type="number" className="input-field" value={item.shipping_usd} onChange={(e) => handleCostSettingChange(item.id, 'shipping_usd', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="label">Customs Duty (%)</label>
                                                <input type="number" className="input-field" value={item.customs_duty_percent} onChange={(e) => handleCostSettingChange(item.id, 'customs_duty_percent', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="label">Inland Transport (ETB)</label>
                                                <input type="number" className="input-field" value={item.inland_transport_etb} onChange={(e) => handleCostSettingChange(item.id, 'inland_transport_etb', e.target.value)} />
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <label className="label" style={{ marginBottom: 0 }}>Margin / Markup (%)</label>
                                                <input type="number" className="input-field" style={{ width: '100px' }} value={item.margin_percent} onChange={(e) => handleCostSettingChange(item.id, 'margin_percent', e.target.value)} />
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Current Calculated Unit Cost</div>
                                                <div style={{ fontSize: '1.25rem', color: 'white', fontWeight: 600 }}>
                                                    {formatCurrency(
                                                        item.equipment_type === 'pv_panel' ? localConstants.COST_UNIT_PV_PANEL :
                                                            item.equipment_type === 'battery_unit' ? localConstants.COST_UNIT_BATTERY :
                                                                localConstants.COST_UNIT_INVERTER
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {costSettings.length === 0 && !loading && (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', border: '1px dashed #ef4444', borderRadius: '0.5rem' }}>
                                        Error: Cost Settings tables not found. Please run the SQL setup script.
                                    </div>
                                )}
                            </div>

                            {/* Action Bar */}
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                                <button onClick={saveCostSettings} disabled={loading} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Save size={18} /> Save Settings Only
                                </button>
                                <button onClick={handleRecalculateCosts} disabled={calculating} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: calculating ? '#64748b' : 'var(--color-primary)' }}>
                                    <RefreshCw size={18} className={calculating ? 'animate-spin' : ''} />
                                    {calculating ? 'Running Cost Engine...' : 'Recalculate Unit Costs'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* BANKS TAB */}
                    {activeTab === 'banks' && (
                        <div className="animate-fade-in">
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1rem' }}>Add New Bank Partner</h3>
                                <form onSubmit={handleAddBank} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                    <div>
                                        <label className="label">Bank Name</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. CBE"
                                            value={newBank.name}
                                            onChange={e => setNewBank({ ...newBank, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Interest Rate (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="input-field"
                                            placeholder="16.5"
                                            value={newBank.interest_rate}
                                            onChange={e => setNewBank({ ...newBank, interest_rate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ padding: '0.8rem 1.5rem' }}>Add Bank</button>
                                </form>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1rem' }}>Active Bank Partners</h3>
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1' }}>Bank Name</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1' }}>Interest Rate</th>
                                            <th style={{ padding: '1rem', textAlign: 'right', color: '#cbd5e1' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {banks.map(bank => (
                                            <tr key={bank.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem', color: 'white' }}>{bank.name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--color-accent)' }}>{bank.interest_rate}%</td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => deleteBank(bank.id)}
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {banks.length === 0 && (
                                            <tr>
                                                <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No banks found. Add one above.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* PARAMS TAB */}
                    {activeTab === 'params' && (
                        <div>
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px dashed var(--color-accent)', borderRadius: '0.5rem', background: 'rgba(234, 179, 8, 0.1)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <Info size={20} color="var(--color-accent)" />
                                <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                                    <strong>Note:</strong> Some parameters below (Cost Units) are managed automatically by the Cost Engine. Manual edits here may be overwritten.
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {Object.entries(localConstants).map(([key, value]) => (
                                    <div key={key} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.5rem' }}>
                                        <label className="label" style={{ color: '#cbd5e1' }}>{formatLabel(key)}</label>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="input-field"
                                                style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                                value={value}
                                                onChange={(e) => handleChange(key, e.target.value)}
                                            />
                                        </div>
                                        <small style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', lineHeight: 1.4 }}>
                                            {DESCRIPTIONS[key] || "System parameter."}
                                        </small>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <button onClick={handleSave} className="btn-primary">Save Changes</button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
