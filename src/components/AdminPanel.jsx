import React, { useState, useEffect } from 'react';
import { X, Info, Database, Settings, ChevronDown, ChevronRight, User, Phone, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const DESCRIPTIONS = {
    SYSTEM_EFFICIENCY: "Overall system efficiency factor (0-1). Accounts for wire loss, etc.",
    DEPTH_OF_DISCHARGE: "Usable battery capacity (0.9 = 90% for Li-ion).",
    PEAK_SUN_HOURS: "Average daily peak sun hours for the region.",
    INVERTER_OVERSIZE_FACTOR: "Ratio of Inverter Size to Peak Load (Safety margin).",

    SPEC_PV_WATTAGE: "Wattage of a single PV Panel (e.g., 550W).",
    SPEC_BATTERY_KWH: "Capacity of a single Battery Unit (e.g., 5kWh).",
    SPEC_INVERTER_KW: "Capacity of a single Inverter Unit (e.g., 5kW).",

    COST_UNIT_PV_PANEL: "Cost of ONE PV Panel Unit (ETB).",
    COST_UNIT_BATTERY: "Cost of ONE Battery Unit (ETB).",
    COST_UNIT_INVERTER: "Cost of ONE Inverter Unit (ETB).",

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
    const [activeTab, setActiveTab] = useState('leads'); // 'params' | 'leads' | 'banks'
    const [localConstants, setLocalConstants] = useState(constants);
    const [leads, setLeads] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedLead, setExpandedLead] = useState(null);

    // Bank Form State
    const [newBank, setNewBank] = useState({ name: '', interest_rate: '' });

    useEffect(() => {
        if (isOpen) {
            if (activeTab === 'leads') fetchLeads();
            if (activeTab === 'banks') fetchBanks();
        }
    }, [isOpen, activeTab]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            // Fetch relevant data
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
        if (!val) return 'ETB 0';
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
            <div className="card" style={{ width: '900px', height: '90vh', display: 'flex', flexDirection: 'column', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: 0 }}>

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
