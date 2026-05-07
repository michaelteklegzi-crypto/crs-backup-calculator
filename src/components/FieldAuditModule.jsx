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
            backup_hours: 4,
            phase_type: 'single_phase',
            measurements: {
                normal: { r: '', s: '', t: '', l: '' },
                peak: { r: '', s: '', t: '', l: '' },
                full: { r: '', s: '', t: '', l: '' }
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

    const handleReopen = async () => {
        if (!confirm('Reopen this audit for editing? Status will be changed back to Draft.')) return;
        try {
            const { error } = await supabase.from('field_audits').update({ status: 'draft' }).eq('id', formData.id);
            if (error) throw error;
            setFormData({ ...formData, status: 'draft' });
            alert('Audit reopened for editing.');
        } catch (err) {
            console.error('Reopen error:', err);
            alert('Failed to reopen audit.');
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
                    <option value="single_phase" style={{ background: '#0f172a', color: 'white' }}>Single Phase (1-Ph)</option>
                    <option value="three_phase" style={{ background: '#0f172a', color: 'white' }}>Three Phase (3-Ph)</option>
                </select>
            </div>
            <div>
                <label className="label">Required Backup Hours</label>
                <input 
                    type="number" className="input-field" value={formData.backup_hours || 4} 
                    onChange={e => setFormData({...formData, backup_hours: parseFloat(e.target.value) || 0})} 
                />
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
        
        const scenarios = [
            { key: 'normal', label: 'Measurement 1: Normal Load' },
            { key: 'peak', label: 'Measurement 2: Peak Load' },
            { key: 'full', label: 'Measurement 3: Full Load' }
        ];

        return (
            <div style={{ display: 'grid', gap: '2rem' }}>
                {scenarios.map(scenario => {
                    const sMeas = formData.measurements[scenario.key] || { r: '', s: '', t: '', l: '' };
                    
                    let phaseKw = 0;
                    let imbalance = null;
                    
                    if (isThreePhase) {
                        const r = parseFloat(sMeas.r) || 0;
                        const s = parseFloat(sMeas.s) || 0;
                        const t = parseFloat(sMeas.t) || 0;
                        imbalance = calculateThreePhaseMetrics(r, s, t);
                        phaseKw = calculatePowerKW(formData.voltage, imbalance.average, formData.power_factor, 'three_phase');
                    } else {
                        const l = parseFloat(sMeas.l) || 0;
                        phaseKw = calculatePowerKW(formData.voltage, l, formData.power_factor, 'single_phase');
                    }

                    return (
                        <div key={scenario.key} className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                {scenario.label}
                            </h3>
                            
                            {isThreePhase ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    <div>
                                        <label className="label" style={{ color: '#ef4444' }}>R Phase (Amps)</label>
                                        <input 
                                            type="number" className="input-field" value={sMeas.r} 
                                            onChange={e => setFormData({...formData, measurements: {...formData.measurements, [scenario.key]: {...sMeas, r: e.target.value}}})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="label" style={{ color: '#eab308' }}>S Phase (Amps)</label>
                                        <input 
                                            type="number" className="input-field" value={sMeas.s} 
                                            onChange={e => setFormData({...formData, measurements: {...formData.measurements, [scenario.key]: {...sMeas, s: e.target.value}}})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="label" style={{ color: '#3b82f6' }}>T Phase (Amps)</label>
                                        <input 
                                            type="number" className="input-field" value={sMeas.t} 
                                            onChange={e => setFormData({...formData, measurements: {...formData.measurements, [scenario.key]: {...sMeas, t: e.target.value}}})} 
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="label">Phase (Amps)</label>
                                    <input 
                                        type="number" className="input-field" value={sMeas.l} style={{ maxWidth: '300px' }}
                                        onChange={e => setFormData({...formData, measurements: {...formData.measurements, [scenario.key]: {...sMeas, l: e.target.value}}})} 
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
                                                    <AlertTriangle size={12}/> Warning: {'>'} 20% deviation
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
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
        const isThreePhase = formData.phase_type === 'three_phase';
        const peakMeas = formData.measurements.peak || { r: '', s: '', t: '', l: '' };
        
        let measuredPeakKw = 0;
        if (isThreePhase) {
            const r = parseFloat(peakMeas.r) || 0;
            const s = parseFloat(peakMeas.s) || 0;
            const t = parseFloat(peakMeas.t) || 0;
            const avg = (r + s + t) / 3;
            measuredPeakKw = calculatePowerKW(formData.voltage, avg, formData.power_factor, 'three_phase');
        } else {
            measuredPeakKw = calculatePowerKW(formData.voltage, parseFloat(peakMeas.l)||0, formData.power_factor, 'single_phase');
        }
        const eqTotals = calculateEquipmentLoad(formData.equipment);
        
        const crossCheck = runCrossCheck(measuredPeakKw, eqTotals.totalKw);
        
        // Admin Simulator parameters (local state)
        const [simulator, setSimulator] = useState({
            diversity_factor: 0.8
        });
        
        // Sizing logic
        const targetKw = measuredPeakKw > 0 ? measuredPeakKw : eqTotals.totalKw;
        const requiredInverterKw = targetKw * 1.2; // 20% margin
        const targetKwh = targetKw * (formData.backup_hours || 4) * simulator.diversity_factor;
        
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
                            <AlertTriangle size={16}/> Warning: Measurement inconsistency detected ({'>'}15% deviation). Please review field inputs.
                        </div>
                    )}
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(15, 23, 42, 0.4) 100%)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={18}/> System Sizing Simulator
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Backup Hours (Set in Site Info)</div>
                            <input 
                                type="number" className="input-field" value={formData.backup_hours || 4} disabled
                                style={{ opacity: 0.7 }}
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

    const renderReview = () => (
        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '3rem 2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <CheckCircle size={48} color="var(--color-accent-emerald)" style={{ margin: '0 auto 1.5rem', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '1rem' }}>Review & Finalize</h3>
                <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>
                    You have completed all data entry steps. Please choose your next action below depending on whether you are still collecting data or ready to generate the final proposal.
                </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
                
                {/* Save Draft */}
                <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '1rem' }}><Save size={24} color="#94a3b8" /></div>
                    <h4 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Save Progress</h4>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', flex: 1 }}>
                        Saves your current inputs to the database. Use this if you are not finished with the audit and need to return later.
                    </p>
                    <button onClick={() => handleSave(false)} className="btn-secondary" style={{ width: '100%', padding: '0.75rem' }}>
                        Save as Draft
                    </button>
                </div>

                {/* Submit to Admin / Finalize */}
                <div style={{ border: '1px solid var(--color-primary)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(56, 189, 248, 0.05)' }}>
                    <div style={{ marginBottom: '1rem' }}><CheckCircle size={24} color="var(--color-primary)" /></div>
                    <h4 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Submit & Analyze</h4>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', flex: 1 }}>
                        Submits the audit for analysis. {role === 'admin' ? 'You can reopen it later from the header if corrections are needed.' : 'Once submitted, only an admin can reopen it for editing.'}
                    </p>
                    <button onClick={() => handleSave(true)} className="btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                        Submit Final Audit
                    </button>
                </div>

                {/* PDF Export */}
                <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '1rem' }}><FileText size={24} color="#f59e0b" /></div>
                    <h4 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Produce Report</h4>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', flex: 1 }}>
                        Downloads a PDF report of the raw field data. You do NOT need to submit the audit to generate this.
                    </p>
                    <button onClick={() => generatePDFReport('field-audit-report-new', `${formData.client_name || 'Site'}_Audit_Report.pdf`)} className="btn-secondary" style={{ width: '100%', padding: '0.75rem' }}>
                        Export PDF Report
                    </button>
                </div>

            </div>
        </div>
    );

    // --- Main Render ---
    if (activeSite) {
        const steps = [
            { id: 'general', title: '1. Site Info' },
            { id: 'measurements', title: '2. Measurements' },
            { id: 'equipment', title: '3. Equipment' },
            ...(role === 'admin' ? [{ id: 'analysis', title: '4. Intelligence' }] : []),
            { id: 'review', title: role === 'admin' ? '5. Finalize' : '4. Finalize' }
        ];

        const currentIndex = steps.findIndex(s => s.id === activeTab) || 0;
        const currentStepId = steps[currentIndex]?.id || 'general';

        const goToNext = () => {
            if (currentIndex < steps.length - 1) setActiveTab(steps[currentIndex + 1].id);
        };

        const goToPrev = () => {
            if (currentIndex > 0) setActiveTab(steps[currentIndex - 1].id);
        };

        return (
            <div className="animate-fade-in">
                {/* Hidden Template for PDF Export */}
                <div style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: -1, overflow: 'hidden' }}>
                    <FieldAuditReportTemplate reportId="field-audit-report-new" siteData={formData} />
                </div>
                
                {/* Clean Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={handleBack} className="btn-icon-only" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ArrowLeft size={16} /> Back
                        </button>
                        <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>
                            {formData.client_name ? `Audit: ${formData.client_name}` : 'New Site Audit'}
                        </h2>
                        {formData.status === 'submitted' && (
                            <span style={{ padding: '2px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                                Submitted
                            </span>
                        )}
                    </div>
                    {formData.status === 'submitted' && role === 'admin' && (
                        <button onClick={handleReopen} style={{ padding: '0.5rem 1rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.5rem', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings size={14} /> Reopen for Editing
                        </button>
                    )}
                </div>

                {/* Step Wizard Header */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                    {steps.map((step, index) => (
                        <button 
                            key={step.id}
                            onClick={() => setActiveTab(step.id)}
                            style={{ 
                                padding: '0.75rem 1rem', 
                                background: currentStepId === step.id ? 'rgba(255,255,255,0.05)' : 'transparent', 
                                border: '1px solid',
                                borderColor: currentStepId === step.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderRadius: '0.5rem',
                                color: currentStepId === step.id ? 'white' : '#94a3b8', 
                                cursor: 'pointer',
                                fontWeight: currentStepId === step.id ? 600 : 400,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                        >
                            {step.title}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <div style={{ minHeight: '400px' }}>
                    {currentStepId === 'general' && renderGeneralInfo()}
                    {currentStepId === 'measurements' && renderMeasurements()}
                    {currentStepId === 'equipment' && renderEquipment()}
                    {currentStepId === 'analysis' && role === 'admin' && renderAnalysis()}
                    {currentStepId === 'review' && renderReview()}
                </div>

                {/* Wizard Footer Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button 
                        onClick={goToPrev} 
                        disabled={currentIndex === 0}
                        className="btn-secondary" 
                        style={{ opacity: currentIndex === 0 ? 0 : 1, pointerEvents: currentIndex === 0 ? 'none' : 'auto' }}
                    >
                        Previous Step
                    </button>
                    
                    {currentIndex < steps.length - 1 && (
                        <button onClick={goToNext} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Next Step <ChevronRight size={16} />
                        </button>
                    )}
                </div>
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
                        <div key={site.id} onClick={() => handleOpenSite(site)} className="card" style={{ padding: '0', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                            <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr auto', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontWeight: 600, color: 'white' }}>{site.client_name || 'Unnamed Site'}</div>
                                <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{site.location || 'No location'}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(site.created_at).toLocaleDateString()}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{site.phase_type === 'three_phase' ? '3-Phase' : '1-Phase'}</div>
                                <div style={{ display: 'flex' }}>
                                    <span style={{ 
                                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                                        background: site.status === 'draft' ? 'rgba(255,255,255,0.1)' : site.status === 'submitted' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                        color: site.status === 'draft' ? '#cbd5e1' : site.status === 'submitted' ? '#60a5fa' : '#10b981'
                                    }}>
                                        {site.status}
                                    </span>
                                </div>
                                <div>
                                    <ChevronRight size={20} color="#64748b" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FieldAuditModule;
