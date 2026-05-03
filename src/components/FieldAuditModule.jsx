import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { 
    Activity, ArrowLeft, CheckCircle, ChevronRight, FileText, 
    Plus, Save, Settings, AlertTriangle, Send, Download
} from 'lucide-react';
import { 
    calculatePowerKW, calculateThreePhaseMetrics, 
    calculateEquipmentLoad, runCrossCheck 
} from '../utils/fieldLogic';
import FieldAuditReportTemplate from './FieldAuditReportTemplate';
import { generatePDFReport } from '../utils/pdfExport';

const FieldAuditModule = ({ role, currentUser, onPushToCalculator }) => {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeSite, setActiveSite] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // general, measurements, equipment, analysis
    
    // Form state for active site
    const [formData, setFormData] = useState(null);
    
    useEffect(() => {
        fetchSites();
    }, []);
    
    const fetchSites = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('field_audits')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setSites(data || []);
        } catch (err) {
            console.error('Error fetching sites:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleCreateSite = () => {
        const newSite = {
            id: 'new',
            entered_by_name: currentUser?.name || 'Unknown',
            entered_by_id: currentUser?.id || 'unknown',
            client_name: '',
            branch_name: '',
            location: '',
            voltage: 220,
            power_factor: 0.85,
            phase_type: 'single_phase',
            measurements: {
                phase: { r: '', s: '', t: '', l: '' },
                scenarios: {
                    normal: '',
                    peak: '',
                    full: ''
                }
            },
            equipment: [],
            general_info: {
                contact_person: '',
                phone: '',
                email: '',
                pre_kwh: '',
                post_kwh: '',
                notes: ''
            },
            analysis_results: {},
            status: 'draft'
        };
        setFormData(newSite);
        setActiveSite('new');
        setActiveTab('general');
    };
    
    const handleOpenSite = (site) => {
        setFormData({ ...site });
        setActiveSite(site.id);
        setActiveTab('general');
    };
    
    const handleBack = () => {
        setActiveSite(null);
        setFormData(null);
        fetchSites();
    };
    
    const handleSave = async (submit = false) => {
        try {
            const dataToSave = { ...formData };
            if (submit) dataToSave.status = 'submitted';
            
            if (dataToSave.id === 'new') {
                delete dataToSave.id;
                const { error } = await supabase.from('field_audits').insert([dataToSave]);
                if (error) throw error;
                alert('Site saved successfully!');
            } else {
                const { error } = await supabase.from('field_audits').update(dataToSave).eq('id', dataToSave.id);
                if (error) throw error;
                alert('Site updated successfully!');
            }
            handleBack();
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save site data.');
        }
    };

    // --- Dynamic Sub-Renderers ---

    const renderGeneralInfo = () => (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <div>
                <label className="label">Client Name *</label>
                <input 
                    type="text" className="input-field" value={formData.client_name} 
                    onChange={e => setFormData({...formData, client_name: e.target.value})} 
                />
            </div>
            <div>
                <label className="label">Branch Name</label>
                <input 
                    type="text" className="input-field" value={formData.branch_name} 
                    onChange={e => setFormData({...formData, branch_name: e.target.value})} 
                />
            </div>
            <div>
                <label className="label">Location</label>
                <input 
                    type="text" className="input-field" value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                />
            </div>
            <div>
                <label className="label">Contact Person</label>
                <input 
                    type="text" className="input-field" value={formData.general_info.contact_person} 
                    onChange={e => setFormData({...formData, general_info: {...formData.general_info, contact_person: e.target.value}})} 
                />
            </div>
            <div>
                <label className="label">Voltage (V) *</label>
                <input 
                    type="number" className="input-field" value={formData.voltage} 
                    onChange={e => setFormData({...formData, voltage: parseFloat(e.target.value) || 0})} 
                />
            </div>
            <div>
                <label className="label">Phase Type *</label>
                <select 
                    className="input-field" value={formData.phase_type}
                    onChange={e => setFormData({...formData, phase_type: e.target.value})}
                >
                    <option value="single_phase">Single Phase (1-Ph)</option>
                    <option value="three_phase">Three Phase (3-Ph)</option>
                </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Notes</label>
                <textarea 
                    className="input-field" rows="3" value={formData.general_info.notes}
                    onChange={e => setFormData({...formData, general_info: {...formData.general_info, notes: e.target.value}})}
                ></textarea>
            </div>
        </div>
    );

    const renderMeasurements = () => {
        const isThreePhase = formData.phase_type === 'three_phase';
        const pMeas = formData.measurements.phase || { r: '', s: '', t: '', l: '' };
        const sMeas = formData.measurements.scenarios || { normal: '', peak: '', full: '' };
        
        // Auto Calculate
        let phaseKw = 0;
        let imbalance = null;
        
        if (isThreePhase) {
            const r = parseFloat(pMeas.r) || 0;
            const s = parseFloat(pMeas.s) || 0;
            const t = parseFloat(pMeas.t) || 0;
            imbalance = calculateThreePhaseMetrics(r, s, t);
            phaseKw = calculatePowerKW(formData.voltage, imbalance.average, formData.power_factor, 'three_phase');
        } else {
            const l = parseFloat(pMeas.l) || 0;
            phaseKw = calculatePowerKW(formData.voltage, l, formData.power_factor, 'single_phase');
        }
        
        return (
            <div style={{ display: 'grid', gap: '2rem' }}>
                {/* Measurement 1: Phase Data */}
                <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                        Measurement 1: Phase Data
                    </h3>
                    
                    {isThreePhase ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div>
                                <label className="label" style={{ color: '#ef4444' }}>R Phase (Amps)</label>
                                <input 
                                    type="number" className="input-field" value={pMeas.r} 
                                    onChange={e => setFormData({...formData, measurements: {...formData.measurements, phase: {...pMeas, r: e.target.value}}})} 
                                />
                            </div>
                            <div>
                                <label className="label" style={{ color: '#eab308' }}>S Phase (Amps)</label>
                                <input 
                                    type="number" className="input-field" value={pMeas.s} 
                                    onChange={e => setFormData({...formData, measurements: {...formData.measurements, phase: {...pMeas, s: e.target.value}}})} 
                                />
                            </div>
                            <div>
                                <label className="label" style={{ color: '#3b82f6' }}>T Phase (Amps)</label>
                                <input 
                                    type="number" className="input-field" value={pMeas.t} 
                                    onChange={e => setFormData({...formData, measurements: {...formData.measurements, phase: {...pMeas, t: e.target.value}}})} 
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="label">Phase (Amps)</label>
                            <input 
                                type="number" className="input-field" value={pMeas.l} style={{ maxWidth: '300px' }}
                                onChange={e => setFormData({...formData, measurements: {...formData.measurements, phase: {...pMeas, l: e.target.value}}})} 
                            />
                        </div>
                    )}
                    
                    {/* Realtime Calculated Stats */}
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', display: 'flex', gap: '2rem' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Calculated Power</div>
                            <div style={{ fontSize: '1.25rem', color: 'white', fontWeight: 600 }}>{phaseKw.toFixed(2)} kW</div>
                        </div>
                        {isThreePhase && imbalance && (
                            <>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Average Current</div>
                                    <div style={{ fontSize: '1.25rem', color: 'white' }}>{imbalance.average.toFixed(1)} A</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Phase Imbalance</div>
                                    <div style={{ fontSize: '1.25rem', color: imbalance.isImbalanced ? '#ef4444' : '#22c55e' }}>
                                        {imbalance.maxDeviationPercent.toFixed(1)}%
                                    </div>
                                    {imbalance.isImbalanced && (
                                        <div style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <AlertTriangle size={12}/> Warning: > 20% deviation
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Scenarios */}
                <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                        Measurements 2 & 3: Load Scenarios
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div>
                            <label className="label">Normal Load (Amps)</label>
                            <input 
                                type="number" className="input-field" value={sMeas.normal} 
                                onChange={e => setFormData({...formData, measurements: {...formData.measurements, scenarios: {...sMeas, normal: e.target.value}}})} 
                            />
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                ~ {calculatePowerKW(formData.voltage, parseFloat(sMeas.normal)||0, formData.power_factor, 'single_phase').toFixed(2)} kW
                            </div>
                        </div>
                        <div>
                            <label className="label">Peak Load (Amps)</label>
                            <input 
                                type="number" className="input-field" value={sMeas.peak} 
                                onChange={e => setFormData({...formData, measurements: {...formData.measurements, scenarios: {...sMeas, peak: e.target.value}}})} 
                            />
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                ~ {calculatePowerKW(formData.voltage, parseFloat(sMeas.peak)||0, formData.power_factor, 'single_phase').toFixed(2)} kW
                            </div>
                        </div>
                        <div>
                            <label className="label">Full Load (Amps)</label>
                            <input 
                                type="number" className="input-field" value={sMeas.full} 
                                onChange={e => setFormData({...formData, measurements: {...formData.measurements, scenarios: {...sMeas, full: e.target.value}}})} 
                            />
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                ~ {calculatePowerKW(formData.voltage, parseFloat(sMeas.full)||0, formData.power_factor, 'single_phase').toFixed(2)} kW
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderEquipment = () => {
        const handleAddEquipment = () => {
            setFormData({
                ...formData,
                equipment: [...formData.equipment, { category: '', equipment_type: '', quantity: 1, power_watts: '', operating_hours: 8 }]
            });
        };
        
        const updateEq = (idx, field, val) => {
            const newEq = [...formData.equipment];
            newEq[idx][field] = val;
            setFormData({ ...formData, equipment: newEq });
        };
        
        const removeEq = (idx) => {
            const newEq = formData.equipment.filter((_, i) => i !== idx);
            setFormData({ ...formData, equipment: newEq });
        };
        
        const eqTotals = calculateEquipmentLoad(formData.equipment);

        return (
            <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'white' }}>Site Equipment List</h3>
                    <button onClick={handleAddEquipment} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Plus size={14} /> Add Item
                    </button>
                </div>
                
                {formData.equipment.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No equipment added yet.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                        <thead>
                            <tr style={{ color: '#cbd5e1', fontSize: '0.85rem', textAlign: 'left' }}>
                                <th style={{ paddingBottom: '0.5rem' }}>Category</th>
                                <th>Equipment Type</th>
                                <th>Qty</th>
                                <th>Power (W)</th>
                                <th>Hrs/Day</th>
                                <th>Total (kW)</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.equipment.map((eq, idx) => (
                                <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.5rem 0' }}>
                                        <input type="text" className="input-field" value={eq.category} onChange={e => updateEq(idx, 'category', e.target.value)} style={{ padding: '0.25rem', fontSize: '0.85rem' }} placeholder="e.g. Core"/>
                                    </td>
                                    <td style={{ padding: '0.5rem 0' }}>
                                        <input type="text" className="input-field" value={eq.equipment_type} onChange={e => updateEq(idx, 'equipment_type', e.target.value)} style={{ padding: '0.25rem', fontSize: '0.85rem' }}/>
                                    </td>
                                    <td style={{ padding: '0.5rem 0', width: '60px' }}>
                                        <input type="number" className="input-field" value={eq.quantity} onChange={e => updateEq(idx, 'quantity', e.target.value)} style={{ padding: '0.25rem', fontSize: '0.85rem' }}/>
                                    </td>
                                    <td style={{ padding: '0.5rem 0', width: '80px' }}>
                                        <input type="number" className="input-field" value={eq.power_watts} onChange={e => updateEq(idx, 'power_watts', e.target.value)} style={{ padding: '0.25rem', fontSize: '0.85rem' }}/>
                                    </td>
                                    <td style={{ padding: '0.5rem 0', width: '70px' }}>
                                        <input type="number" className="input-field" value={eq.operating_hours} onChange={e => updateEq(idx, 'operating_hours', e.target.value)} style={{ padding: '0.25rem', fontSize: '0.85rem' }}/>
                                    </td>
                                    <td style={{ padding: '0.5rem 0', color: 'white', fontSize: '0.9rem' }}>
                                        {((Number(eq.quantity||0) * Number(eq.power_watts||0))/1000).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>
                                        <button onClick={() => removeEq(idx)} className="btn-icon-only" style={{ color: '#ef4444' }}><AlertTriangle size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Eq Load (kW)</div>
                        <div style={{ fontSize: '1.25rem', color: 'white', fontWeight: 600 }}>{eqTotals.totalKw.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Energy (kWh/day)</div>
                        <div style={{ fontSize: '1.25rem', color: 'white', fontWeight: 600 }}>{eqTotals.totalKwh.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        );
    };

    const renderAnalysis = () => {
        // Run cross check
        const sMeas = formData.measurements.scenarios || { peak: 0 };
        const measuredPeakKw = calculatePowerKW(formData.voltage, parseFloat(sMeas.peak)||0, formData.power_factor, 'single_phase');
        const eqTotals = calculateEquipmentLoad(formData.equipment);
        
        const crossCheck = runCrossCheck(measuredPeakKw, eqTotals.totalKw);
        
        // Admin Simulator parameters (local state)
        const [simulator, setSimulator] = useState({
            backup_hours: 4,
            diversity_factor: 0.8
        });
        
        // Sizing logic
        const targetKw = measuredPeakKw > 0 ? measuredPeakKw : eqTotals.totalKw;
        const requiredInverterKw = targetKw * 1.2; // 20% margin
        const targetKwh = targetKw * simulator.backup_hours * simulator.diversity_factor;
        
        const handlePush = () => {
            const pushData = {
                peakKw: targetKw,
                batteryKwh: targetKwh
            };
            onPushToCalculator(pushData);
        };
        
        return (
            <div style={{ display: 'grid', gap: '2rem' }}>
                <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={18}/> Cross-Check Intelligence
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Measured Peak (kW)</div>
                            <div style={{ fontSize: '1.5rem', color: 'white' }}>{measuredPeakKw.toFixed(2)}</div>
                        </div>
                        <div style={{ fontSize: '1.5rem', color: '#64748b' }}>vs</div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Equipment Total (kW)</div>
                            <div style={{ fontSize: '1.5rem', color: 'white' }}>{eqTotals.totalKw.toFixed(2)}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Deviation</div>
                            <div style={{ fontSize: '1.5rem', color: crossCheck.isMismatched ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                                {crossCheck.differencePercent.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                    {crossCheck.isMismatched && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={16}/> Warning: Measurement inconsistency detected (>15% deviation). Please review field inputs.
                        </div>
                    )}
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(15, 23, 42, 0.4) 100%)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={18}/> System Sizing Simulator
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label className="label">Target Backup Duration (Hours)</label>
                            <input 
                                type="number" className="input-field" value={simulator.backup_hours} 
                                onChange={e => setSimulator({...simulator, backup_hours: parseFloat(e.target.value)||0})} 
                            />
                        </div>
                        <div>
                            <label className="label">Diversity Factor (0-1)</label>
                            <input 
                                type="number" className="input-field" value={simulator.diversity_factor} 
                                onChange={e => setSimulator({...simulator, diversity_factor: parseFloat(e.target.value)||0})} 
                                step="0.1" max="1" min="0"
                            />
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Recommended Inverter Size</div>
                            <div style={{ fontSize: '1.5rem', color: 'white' }}>{requiredInverterKw.toFixed(2)} kW</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Required Battery Capacity</div>
                            <div style={{ fontSize: '1.5rem', color: 'var(--color-accent-emerald)', fontWeight: 600 }}>{targetKwh.toFixed(2)} kWh</div>
                        </div>
                    </div>
                    
                    <button onClick={handlePush} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                        <Send size={18}/> Push to CRS Calculator
                    </button>
                </div>
            </div>
        );
    };

    // --- Main Render ---
    if (activeSite) {
        return (
            <div className="animate-fade-in">
                {/* Hidden Template for PDF Export */}
                <div style={{ position: 'fixed',  top: 0, left: 0,   pointerEvents: 'none', zIndex: -1, overflow: 'hidden' }}>
                    <FieldAuditReportTemplate reportId="field-audit-report-new" siteData={formData} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button onClick={handleBack} className="btn-icon-only" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={16} /> Back to Sites
                    </button>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => generatePDFReport('field-audit-report-new', `${formData.client_name || 'Site'}_Audit_Report.pdf`)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <Download size={16} /> Export PDF
                        </button>
                        <button onClick={() => handleSave(false)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={16} /> Save Draft
                        </button>
                        <button onClick={() => handleSave(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={16} /> Submit Audit
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
                    <button 
                        onClick={() => setActiveTab('general')}
                        style={{ padding: '0.75rem 1.5rem', background: 'transparent', borderBottom: activeTab === 'general' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'general' ? 'white' : '#94a3b8', cursor: 'pointer' }}
                    >General Info</button>
                    <button 
                        onClick={() => setActiveTab('measurements')}
                        style={{ padding: '0.75rem 1.5rem', background: 'transparent', borderBottom: activeTab === 'measurements' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'measurements' ? 'white' : '#94a3b8', cursor: 'pointer' }}
                    >Measurements</button>
                    <button 
                        onClick={() => setActiveTab('equipment')}
                        style={{ padding: '0.75rem 1.5rem', background: 'transparent', borderBottom: activeTab === 'equipment' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'equipment' ? 'white' : '#94a3b8', cursor: 'pointer' }}
                    >Equipment List</button>
                    {role === 'admin' && (
                        <button 
                            onClick={() => setActiveTab('analysis')}
                            style={{ padding: '0.75rem 1.5rem', background: 'transparent', borderBottom: activeTab === 'analysis' ? '2px solid var(--color-accent-emerald)' : '2px solid transparent', color: activeTab === 'analysis' ? 'var(--color-accent-emerald)' : '#94a3b8', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        ><Activity size={14}/> Intelligence</button>
                    )}
                </div>

                {/* Form Content */}
                {activeTab === 'general' && renderGeneralInfo()}
                {activeTab === 'measurements' && renderMeasurements()}
                {activeTab === 'equipment' && renderEquipment()}
                {activeTab === 'analysis' && role === 'admin' && renderAnalysis()}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Field Audits</h2>
                <button onClick={handleCreateSite} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={16} /> New Site Audit
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading...</div>
            ) : sites.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#64748b' }}>
                    No field audits found.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {sites.map(site => (
                        <div key={site.id} onClick={() => handleOpenSite(site)} className="card" style={{ padding: '1.25rem', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                            <div>
                                <div style={{ fontSize: '1.1rem', color: 'white', fontWeight: 600, marginBottom: '0.25rem' }}>
                                    {site.client_name || 'Unnamed Site'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', gap: '1rem' }}>
                                    <span>{site.location || 'No location'}</span>
                                    <span>•</span>
                                    <span>{site.phase_type === 'three_phase' ? '3-Phase' : '1-Phase'}</span>
                                    <span>•</span>
                                    <span>By: {site.entered_by_name}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <span style={{ 
                                    padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                                    background: site.status === 'draft' ? 'rgba(255,255,255,0.1)' : site.status === 'submitted' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                    color: site.status === 'draft' ? '#cbd5e1' : site.status === 'submitted' ? '#60a5fa' : '#10b981'
                                }}>
                                    {site.status}
                                </span>
                                <ChevronRight size={20} color="#64748b" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FieldAuditModule;
