import React, { useState, useEffect } from 'react';
import { X, Info, Database, Settings, ChevronDown, ChevronRight, User, Phone, MapPin, Calendar, DollarSign, FileText, RefreshCw, Save, Truck, Activity } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { runCostEngine } from '../utils/costEngine';
import PremiumResults from './PremiumResults';
import PDFReportTemplate from './PDFReportTemplate';
import { generatePDFReport } from '../utils/pdfExport';
import FieldAuditModule from './FieldAuditModule';

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
    COST_UNIT_INVERTER_3PH: "Cost of ONE 3-Phase Inverter (10kW) - Auto-calculated.",

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

const AdminPanel = ({ constants, onUpdate, isOpen, onClose, applianceCatalog, fetchApplianceCatalog, userRole, currentUser, onPushToCalculator }) => {
    const [activeTab, setActiveTab] = useState(userRole === 'field' ? 'field_audits' : 'leads'); // 'params' | 'leads' | 'banks' | 'costs' | 'appliances' | 'field_audits'
    const [localConstants, setLocalConstants] = useState(constants);
    const [leads, setLeads] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedLead, setExpandedLead] = useState(null);

    // Update default tab if role changes
    useEffect(() => {
        if (isOpen) {
            setActiveTab(userRole === 'field' ? 'field_audits' : 'leads');
        }
    }, [userRole, isOpen]);

    // Cost Module State
    const [costSettings, setCostSettings] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(null);
    const [calculating, setCalculating] = useState(false);

    // Bank Form State
    const [newBank, setNewBank] = useState({ name: '', interest_rate: '' });
    
    // Appliance Form State
    const [newAppliance, setNewAppliance] = useState({ name: '', watts: '', hours: '', duty_cycle: 1, user_type: 'residential', category_id: 'essential', category_label: 'Essential Loads' });
    const [editingAppliance, setEditingAppliance] = useState(null);
    const [editValues, setEditValues] = useState({ watts: '', duty_cycle: '' });

    // PDF Email Workflow State
    const [renderingReportForLead, setRenderingReportForLead] = useState(null);
    const [previewReportLead, setPreviewReportLead] = useState(null);

    const handleSendReport = async (lead) => {
        const proposal = lead.proposals?.[0];
        console.log('[PDF] Lead:', lead);
        console.log('[PDF] Proposal:', proposal);
        console.log('[PDF] analysis_json:', proposal?.analysis_json);
        
        if (!proposal) {
            return alert("No proposal found for this lead.");
        }
        if (!proposal.analysis_json) {
            return alert("Proposal exists but has no analysis_json stored. The lead was submitted before the new save-to-DB code was active. Please submit a NEW test lead and try again.");
        }

        const json = proposal.analysis_json;
        console.log('[PDF] systemSize:', json?.systemSize);
        console.log('[PDF] financials:', json?.financials);

        if (!json.systemSize || !json.financials) {
            return alert("analysis_json is missing systemSize or financials. Check console for details.");
        }

        setRenderingReportForLead(lead);

        // Wait for React to mount the hidden PDFReportTemplate
        setTimeout(async () => {
            const targetId = 'admin-pdf-capture-' + lead.id;
            console.log('[PDF] Looking for element:', targetId, document.getElementById(targetId));
            try {
                // Step 1: Generate and download the PDF
                await generatePDFReport(targetId, `CRS_Report_${lead.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);

                // Step 2: Wait a moment to let the download start before navigating
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Step 3: Fire mail client (open in same tab using location, or new tab)
                const subject = encodeURIComponent(`Your Power Architecture Report - ${lead.name}`);
                const body = encodeURIComponent(
`Hi ${lead.name.split(' ')[0]},

Thank you for requesting a power architecture report from Climate Resilience Solutions (CRS).

After analyzing your electrical parameters, we have engineered a custom solution designed to secure your energy independence and reduce reliance on grid and diesel power.
Please find your personalized Technical Proposal attached to this email as a PDF.

Let us know when you would like to schedule a consultation to discuss installation timelines and financing pathways!

Best regards,

Climate Resilience Solutions (CRS)
info@crs-worldwide.com
https://crs-worldwide.com
`
                );

                window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_self');

                // Step 4: Update lead status
                await supabase.from('leads').update({ status: 'emailed' }).eq('id', lead.id);
                fetchLeads();

            } catch (err) {
                console.error("Error generating report:", err);
                alert("Failed to generate report: " + err.message);
            } finally {
                setRenderingReportForLead(null);
            }
        }, 1500);
    };

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

            // 2. Run Engine (with Hedge)
            const hedge = localConstants.EXCHANGE_RATE_HEDGE_PERCENT || 0;
            const result = await runCostEngine(hedge); // Returns { exchangeRate, effectiveRate, costs: { COST_UNIT_PV... } }

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

            alert(`Costs recalculated successfully!\n\nBase Rate: ${result.exchangeRate.toFixed(2)} ETB/USD\nHedge Buffer: ${hedge}%\nEffective Rate: ${(result.effectiveRate || result.exchangeRate).toFixed(2)} ETB/USD\n\nNew Unit Costs:\n${details}`);

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

    const handleAddAppliance = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('appliances_catalog').insert([{
                ...newAppliance,
                watts: parseFloat(newAppliance.watts),
                hours: parseFloat(newAppliance.hours),
                duty_cycle: parseFloat(newAppliance.duty_cycle)
            }]);
            if (error) throw error;
            if(fetchApplianceCatalog) fetchApplianceCatalog();
            setNewAppliance({ ...newAppliance, name: '', watts: '', hours: '' });
        } catch (err) {
            console.error("Error adding appliance:", err);
            alert("Failed to add appliance.");
        }
    };

    const deleteAppliance = async (id) => {
        if (!confirm("Are you sure you want to delete this appliance?")) return;
        try {
            const { error } = await supabase.from('appliances_catalog').delete().eq('id', id);
            if (error) throw error;
            if(fetchApplianceCatalog) fetchApplianceCatalog();
        } catch (err) {
            console.error("Error deleting appliance:", err);
        }
    };

    const startEditAppliance = (app) => {
        setEditingAppliance(app.id);
        setEditValues({ watts: app.watts, duty_cycle: app.duty_cycle });
    };

    const saveEditAppliance = async (id) => {
        try {
            const { error } = await supabase.from('appliances_catalog')
                .update({
                    watts: parseFloat(editValues.watts),
                    duty_cycle: parseFloat(editValues.duty_cycle)
                })
                .eq('id', id);
            if(error) throw error;
            setEditingAppliance(null);
            if(fetchApplianceCatalog) fetchApplianceCatalog();
        } catch(err) {
            console.error("Error updating appliance", err);
            alert("Failed to update appliance.");
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
            position: 'fixed',  top: 0, left: 0, right: 0, bottom: 0,
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
                        onClick={() => setActiveTab('field_audits')}
                        style={{
                            padding: '1rem 1.5rem', background: 'transparent',
                            borderBottom: activeTab === 'field_audits' ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === 'field_audits' ? 'white' : '#94a3b8',
                            fontWeight: activeTab === 'field_audits' ? 600 : 400,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        <FileText size={16} /> Field Audits
                    </button>
                    {userRole === 'admin' && (
                        <>
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
                                onClick={() => setActiveTab('appliances')}
                                style={{
                                    padding: '1rem 1.5rem', background: 'transparent',
                                    borderBottom: activeTab === 'appliances' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    color: activeTab === 'appliances' ? 'white' : '#94a3b8',
                                    fontWeight: activeTab === 'appliances' ? 600 : 400,
                                    cursor: 'pointer'
                                }}
                            >
                                Appliance Catalog
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
                        </>
                    )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                
                    {/* FIELD AUDITS TAB */}
                    {activeTab === 'field_audits' && (
                        <FieldAuditModule 
                            role={userRole} 
                            currentUser={currentUser} 
                            onPushToCalculator={onPushToCalculator} 
                        />
                    )}

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
                                                    {lead.status === 'emailed' && <span title="Report Emailed" style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>EMAILED</span>}
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

                                                    {/* Actions Panel */}
                                                    {lead.proposals?.length > 0 && (
                                                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem' }}>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setPreviewReportLead(lead); }}
                                                                className="btn-primary"
                                                                style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
                                                            >
                                                                Preview Report Dashboard
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleSendReport(lead); }}
                                                                className="btn-primary"
                                                                disabled={renderingReportForLead?.id === lead.id || lead.status === 'emailed'}
                                                                style={{ padding: '0.75rem 1.5rem', background: lead.status === 'emailed' ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-primary)', color: lead.status === 'emailed' ? '#10b981' : 'white', border: lead.status === 'emailed' ? '1px solid #10b981' : 'none' }}
                                                            >
                                                                {renderingReportForLead?.id === lead.id ? 'Generating Engine PDF...' : lead.status === 'emailed' ? 'Report Emailed ✓' : 'Review & Send Report'}
                                                            </button>
                                                        </div>
                                                    )}
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
                            {/* Exchange Rate Status & Settings */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                {/* Status Card */}
                                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Activity size={20} color="var(--color-accent-emerald)" /> Live Exchange Rate
                                    </h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Market Rate (USD/ETB)</div>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white' }}>
                                                {exchangeRate ? exchangeRate.rate_sell.toFixed(2) : '---'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Effective Rate (Hedged)</div>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-accent-emerald)' }}>
                                                {exchangeRate ? (exchangeRate.rate_sell * (1 + (localConstants.EXCHANGE_RATE_HEDGE_PERCENT / 100))).toFixed(2) : '---'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 'auto' }}>
                                        Last Updated: {exchangeRate ? new Date(exchangeRate.fetched_at).toLocaleTimeString() : 'Never'}
                                    </div>
                                </div>

                                {/* Risk Settings Card */}
                                <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Settings size={20} /> Risk & Volatility
                                    </h3>
                                    <div>
                                        <label className="label">Exchange Rate Hedge (%)</label>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                className="input-field"
                                                value={localConstants.EXCHANGE_RATE_HEDGE_PERCENT}
                                                onChange={(e) => handleChange('EXCHANGE_RATE_HEDGE_PERCENT', e.target.value)}
                                            />
                                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                                Buffer added to base rate to protect against currency devaluation during procurement. default 15%.
                                            </span>
                                        </div>
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
                                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Live Projections</div>

                                                {(() => {
                                                    const baseRate = exchangeRate ? Number(exchangeRate.rate_sell) : 0;
                                                    const hedge = Number(localConstants.EXCHANGE_RATE_HEDGE_PERCENT) || 0;
                                                    const effectiveRate = baseRate * (1 + (hedge / 100));

                                                    const importUsd = Number(item.import_usd) || 0;
                                                    const shippingUsd = Number(item.shipping_usd) || 0;
                                                    const dutyPercent = Number(item.customs_duty_percent) || 0;
                                                    const inlandEtb = Number(item.inland_transport_etb) || 0;
                                                    const handlingEtb = Number(item.port_handling_etb) || 0;
                                                    const marginPercent = Number(item.margin_percent) || 0;

                                                    // Helper to calc final cost
                                                    const getCost = (rate) => {
                                                        const importEtb = importUsd * rate;
                                                        const shippingEtb = shippingUsd * rate;
                                                        const dutyEtb = importEtb * (dutyPercent / 100);
                                                        const baseLanded = importEtb + shippingEtb + dutyEtb + inlandEtb + handlingEtb;
                                                        return baseLanded * (1 + (marginPercent / 100));
                                                    };

                                                    const bankCost = getCost(baseRate);
                                                    const hedgedCost = getCost(effectiveRate);

                                                    return (
                                                        <>
                                                            <div title={`Based on ${baseRate.toFixed(2)} ETB/USD`} style={{ fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                                <span>Bank Rate:</span>
                                                                <span style={{ fontFamily: 'monospace' }}>{formatCurrency(bankCost)}</span>
                                                            </div>
                                                            <div title={`Based on ${effectiveRate.toFixed(2)} ETB/USD (Hedge: ${hedge}%)`} style={{ fontSize: '1.25rem', color: 'var(--color-accent-emerald)', fontWeight: 600, margin: '0.25rem 0' }}>
                                                                Hedged: {formatCurrency(hedgedCost)}
                                                            </div>
                                                        </>
                                                    );
                                                })()}

                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    Stored: {formatCurrency(
                                                        (() => {
                                                            switch (item.equipment_type) {
                                                                case 'pv_panel': return localConstants.COST_UNIT_PV_PANEL;
                                                                case 'battery_unit': return localConstants.COST_UNIT_BATTERY;
                                                                case 'inverter_1ph_5kw': return localConstants.COST_UNIT_INVERTER;
                                                                case 'inverter_3ph_15kw': return localConstants.COST_UNIT_INVERTER_3PH;
                                                                default: return 0;
                                                            }
                                                        })()
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

                    {/* APPLIANCES CATALOG TAB */}
                    {activeTab === 'appliances' && (
                        <div className="animate-fade-in">
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1rem' }}>Add New Appliance</h3>
                                <form onSubmit={handleAddAppliance} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'end' }}>
                                    <div>
                                        <label className="label">Name</label>
                                        <input type="text" className="input-field" value={newAppliance.name} onChange={e => setNewAppliance({...newAppliance, name: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="label">Watts</label>
                                        <input type="number" className="input-field" value={newAppliance.watts} onChange={e => setNewAppliance({...newAppliance, watts: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="label">Hours</label>
                                        <input type="number" step="0.1" className="input-field" value={newAppliance.hours} onChange={e => setNewAppliance({...newAppliance, hours: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="label">Duty Cycle (1.0 = 100%)</label>
                                        <input type="number" step="0.1" min="0.1" max="1" className="input-field" value={newAppliance.duty_cycle} onChange={e => setNewAppliance({...newAppliance, duty_cycle: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="label">User Type</label>
                                        <select className="input-field" value={newAppliance.user_type} onChange={e => setNewAppliance({...newAppliance, user_type: e.target.value})}>
                                            <option value="residential">Residential</option>
                                            <option value="sme">SME</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Category ID</label>
                                        <input type="text" className="input-field" value={newAppliance.category_id} onChange={e => setNewAppliance({...newAppliance, category_id: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="label">Category Label</label>
                                        <input type="text" className="input-field" value={newAppliance.category_label} onChange={e => setNewAppliance({...newAppliance, category_label: e.target.value})} required />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ padding: '0.8rem 1.5rem' }}>Add Appliance</button>
                                </form>
                            </div>

                            <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '1rem' }}>Active Catalog</h3>
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1' }}>User Type</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1' }}>Category</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1' }}>Name</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1' }}>Watts</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', color: '#cbd5e1' }}>Duty Cycle</th>
                                            <th style={{ padding: '1rem', textAlign: 'right', color: '#cbd5e1' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(applianceCatalog || []).map(app => (
                                            <tr key={app.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem', color: '#94a3b8' }}>{app.user_type}</td>
                                                <td style={{ padding: '1rem', color: '#94a3b8' }}>{app.category_label}</td>
                                                <td style={{ padding: '1rem', color: 'white' }}>{app.name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--color-accent)' }}>
                                                    {editingAppliance === app.id ? (
                                                        <input type="number" className="input-field" style={{ width: '80px', padding: '0.4rem' }} value={editValues.watts} onChange={e => setEditValues({...editValues, watts: e.target.value})} />
                                                    ) : (
                                                        `${app.watts}W`
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem', color: 'white' }}>
                                                    {editingAppliance === app.id ? (
                                                        <input type="number" step="0.1" min="0.1" max="1" className="input-field" style={{ width: '80px', padding: '0.4rem' }} value={editValues.duty_cycle} onChange={e => setEditValues({...editValues, duty_cycle: e.target.value})} />
                                                    ) : (
                                                        `${Math.round(app.duty_cycle * 100)}%`
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    {editingAppliance === app.id ? (
                                                        <>
                                                            <button onClick={() => saveEditAppliance(app.id)} style={{ background: 'transparent', border: 'none', color: '#22c55e', cursor: 'pointer', marginRight: '0.75rem' }}>Save</button>
                                                            <button onClick={() => setEditingAppliance(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEditAppliance(app)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '0.75rem' }}>Edit</button>
                                                            <button onClick={() => deleteAppliance(app.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!applianceCatalog || applianceCatalog.length === 0) && (
                                            <tr>
                                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No appliances found. Add one above.</td>
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

            {/* Preview Report Modal */}
            {previewReportLead && previewReportLead.proposals?.[0]?.analysis_json && (
                <div style={{ position: 'fixed',  top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 10000, overflowY: 'auto' }}>
                    <div style={{ position: 'sticky',  padding: '1rem', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid var(--color-border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10001 }}>
                        <div style={{ color: 'white', fontWeight: 600 }}>Preview: {previewReportLead.name}'s Report</div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => { handleSendReport(previewReportLead); setPreviewReportLead(null); }} className="btn-primary">Send This Report</button>
                            <button onClick={() => setPreviewReportLead(null)} className="btn-icon-only"><X size={24} color="white" /></button>
                        </div>
                    </div>
                    <div style={{ padding: '2rem 0' }}>
                        <PremiumResults
                            systemSize={previewReportLead.proposals[0].analysis_json.systemSize}
                            financials={previewReportLead.proposals[0].analysis_json.financials}
                            comparisonData={previewReportLead.proposals[0].analysis_json.comparisonData}
                            hourlyData={previewReportLead.proposals[0].analysis_json.hourlyData}
                            hourlyNote={previewReportLead.proposals[0].analysis_json.hourlyNote}
                            onOpenAdvisory={() => {}}
                            onFinance={() => {}}
                            userType={previewReportLead.source}
                            outageHours={previewReportLead.proposals[0].analysis_json.config?.outageHours || 4}
                            constants={constants}
                        />
                    </div>
                </div>
            )}

            {/* Hidden Engine Node for PDF Generation — uses visibility:hidden so html2canvas can find it */}
            {renderingReportForLead && renderingReportForLead.proposals?.[0]?.analysis_json && (
                <div style={{
                    position: 'fixed',
                    
                    top: 0, left: 0,
                     
                    pointerEvents: 'none',
                    zIndex: -1,
                    overflow: 'hidden'
                }}>
                    <PDFReportTemplate
                        reportId={`admin-pdf-capture-${renderingReportForLead.id}`}
                        systemSize={renderingReportForLead.proposals[0].analysis_json.systemSize}
                        financials={renderingReportForLead.proposals[0].analysis_json.financials}
                        hourlyData={renderingReportForLead.proposals[0].analysis_json.hourlyData}
                        clientName={renderingReportForLead.name}
                        userType={renderingReportForLead.source}
                        outageHours={renderingReportForLead.proposals[0].analysis_json.config?.outageHours || 4}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
