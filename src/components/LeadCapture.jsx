import React, { useState } from 'react';
import { Unlock, Mail, Phone, Building, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const LeadCapture = ({ onUnlock, userType }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '+251',
        company: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null);
    };

    const validateForm = () => {
        // Name Validation
        if (formData.name.trim().length < 3) return "Name is too short.";
        if (/([a-zA-Z])\1{3,}/.test(formData.name)) return "Please enter a valid name (no repeated characters).";

        // Phone Validation
        // +251 9 11 23 45 67 -> 13 chars
        const phoneRegex = /^\+251[0-9]{9}$/;
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) return "Phone must be in format +251 9XXXXXXXX";

        // Company Validation
        if (userType === 'sme' && formData.company.trim().length < 2) return "Business Name is required for SME profiles.";

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
            // 1. Insert into Supabase
            const { data, error: sbError } = await supabase
                .from('leads')
                .insert([
                    {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        company: formData.company,
                        source: userType,
                        created_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (sbError) {
                console.error('Supabase Error:', sbError);
                // If duplicates (likely phone), try to fetch existing or show error
                if (sbError.code === '23505') { // Unique constraint violation
                    setError("A user with this phone number already exists.");
                } else {
                    onUnlock({ ...formData, id: 'offline-' + Date.now() });
                }
            } else {
                onUnlock(data); // Pass the full lead object with ID
            }

        } catch (err) {
            console.error('Submission Error:', err);
            onUnlock({ ...formData, id: 'error-' + Date.now() });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            // Use a glass effect to blur the background results
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            background: 'var(--color-surface-glass)', // Improved visibility
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        background: 'var(--color-primary)', width: '60px', height: '60px',
                        borderRadius: '50%', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(220, 38, 38, 0.4)'
                    }}>
                        <Lock color="white" size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'white' }}>Unlock Your Analysis</h3>
                    <p style={{ color: '#94a3b8' }}>
                        Enter your details to view the full technical and financial report.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>

                    <div className="form-group">
                        <label className="label">Full Name</label>
                        <input
                            required
                            className="input-field"
                            placeholder="e.g. Abebe Bikila"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">Phone Number</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                required
                                className="input-field"
                                placeholder="0911..."
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type="email"
                                required
                                className="input-field"
                                placeholder="email@example.com"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Company (Optional)</label>
                        <div style={{ position: 'relative' }}>
                            <Building size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                className="input-field"
                                placeholder="Acme PLC"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.company}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isLoading}
                        style={{ marginTop: '0.5rem', width: '100%', fontSize: '1.1rem', padding: '1rem' }}
                    >
                        {isLoading ? 'Processing...' : 'View Report'}
                    </button>
                    {error && <p style={{ color: 'red', textAlign: 'center', fontSize: '0.85rem' }}>{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default LeadCapture;
