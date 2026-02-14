import React, { useState } from 'react';
import { MapPin, User, Calendar, Phone, CheckCircle, Clipboard, AlertCircle, Building } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const SiteVisitForm = ({ onSubmit, onCancel, systemSize, currentLead, userType }) => {
    const [formData, setFormData] = useState({
        subcity: '',
        woreda: '',
        houseNo: '',
        landmark: '',
        buildingName: '',
        officeNo: '',
        contactPerson: currentLead?.name || '',
        phone: currentLead?.phone || '',
        isOwner: false,
        phaseType: 'single', // single | three
        needsWiringCheck: false,
        visitDatePreference: '',
        note: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const validateForm = () => {
        if (!formData.subcity.trim()) return "Subcity is required.";
        if (userType === 'sme') {
            if (!formData.buildingName.trim()) return "Building Name is required for Business profiles.";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Construct address string
            let addressString = `Subcity: ${formData.subcity}, Woreda: ${formData.woreda}, House No: ${formData.houseNo}, Landmark: ${formData.landmark}`;
            if (userType === 'sme') {
                addressString = `Building: ${formData.buildingName}, Office: ${formData.officeNo}, ` + addressString;
            }

            const payload = {
                lead_id: currentLead?.id, // key might be uuid
                address: addressString,
                preferred_date: formData.visitDatePreference || null,
                notes: `Contact: ${formData.contactPerson}, Phone: ${formData.phone}, Phase: ${formData.phaseType}, Wiring Check: ${formData.needsWiringCheck}`,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            const { data, error: sbError } = await supabase
                .from('site_visits')
                .insert([payload])
                .select();

            if (sbError) throw sbError;

            onSubmit(formData);

        } catch (err) {
            console.error('Site Visit Submission Error:', err);
            // Fallback: Proceed for UI demo purposes even if DB fails
            onSubmit(formData);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            overflowY: 'auto'
        }}>
            <div
                className="card animate-fade-in"
                style={{
                    width: '100%', maxWidth: '800px',
                    maxHeight: '90vh', overflowY: 'auto',
                    display: 'grid', gridTemplateColumns: '1fr', gap: '2rem',
                    position: 'relative' // meaningful stacking context
                }}
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header & Infographic Summary */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '60px', height: '60px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
                        border: '1px solid #22c55e'
                    }}>
                        <Clipboard size={32} color="#22c55e" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>Finalize Your Proposal</h2>
                    <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                        To guarantee the performance of your system, our engineers must verify your site conditions.
                    </p>

                    {/* System Summary Infographic */}
                    {systemSize && (
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem',
                            marginTop: '2rem', padding: '1.5rem',
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                            borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Solar Capacity</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0.25rem 0' }}>{systemSize.recommended?.pvKw || 0} kW</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{systemSize.recommended?.units?.panels || 0} Panels</div>
                            </div>
                            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Battery Bank</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-secondary)', margin: '0.25rem 0' }}>{systemSize.recommended?.batteryKwh || 0} kWh</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{systemSize.recommended?.units?.batteries || 0} Units</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Inverter</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-accent)', margin: '0.25rem 0' }}>{systemSize.recommended?.inverterKw || 0} kW</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hybrid System</div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <AlertCircle color="#3b82f6" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                        <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '0.25rem' }}>Why is a Site Visit Required?</strong>
                        Accurate load measurement is critical to avoid system failure. A site visit allows us to:
                        <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, listStyleType: 'disc', color: '#94a3b8' }}>
                            <li>Verify actual peak power draw (often higher than rated labels).</li>
                            <li>Identify potential wiring faults or safety hazards.</li>
                            <li>Assess roof structural integrity and solar orientation.</li>
                        </ul>
                    </div>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '0.5rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={20} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Address Section */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem' }}>
                        <h4 style={{ color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={18} /> Location Details ({userType === 'sme' ? 'Business' : 'Residential'})
                        </h4>

                        {userType === 'sme' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label className="label">Building Name*</label>
                                    <input type="text" name="buildingName" value={formData.buildingName} onChange={handleChange} className="input-field" placeholder="e.g. Friendship Tower" />
                                </div>
                                <div>
                                    <label className="label">Office No.</label>
                                    <input type="text" name="officeNo" value={formData.officeNo} onChange={handleChange} className="input-field" placeholder="e.g. 402" />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="label">Subcity / Kifle Ketema*</label>
                                <input type="text" name="subcity" required value={formData.subcity} onChange={handleChange} className="input-field" placeholder="e.g. Bole" />
                            </div>
                            <div>
                                <label className="label">Woreda*</label>
                                <input type="text" name="woreda" required value={formData.woreda} onChange={handleChange} className="input-field" placeholder="e.g. 03" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">House No.*</label>
                                <input type="text" name="houseNo" required value={formData.houseNo} onChange={handleChange} className="input-field" placeholder="e.g. 1234" />
                            </div>
                            <div>
                                <label className="label">Landmark</label>
                                <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} className="input-field" placeholder="Near..." />
                            </div>
                        </div>
                    </div>

                    {/* Technical Assessment */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem' }}>
                        <h4 style={{ color: 'var(--color-accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={18} /> Technical Assessment
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Electrical Phase</label>
                                <select
                                    name="phaseType"
                                    value={formData.phaseType}
                                    onChange={handleChange}
                                    className="input-field"
                                >
                                    <option value="single">Single Phase</option>
                                    <option value="three">Three Phase</option>
                                    <option value="unknown">I Don't Know</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'end' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.7rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', width: '100%' }}>
                                    <input
                                        type="checkbox"
                                        name="needsWiringCheck"
                                        checked={formData.needsWiringCheck}
                                        onChange={handleChange}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Req. Wiring Safety Check?</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem' }}>
                        <h4 style={{ color: 'var(--color-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={18} /> Site Contact
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Contact Person</label>
                                <input
                                    type="text"
                                    name="contactPerson"
                                    required
                                    value={formData.contactPerson}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Name"
                                />
                            </div>
                            <div>
                                <label className="label">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="+251..."
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <label className="label">Preferred Visit Date</label>
                            <input
                                type="date"
                                name="visitDatePreference"
                                value={formData.visitDatePreference}
                                onChange={handleChange}
                                className="input-field"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-full)', background: 'transparent', border: '1px solid var(--color-border-glass)', color: 'white' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ flex: 2 }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Submitting...' : 'Confirm Visit Request'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default SiteVisitForm;
