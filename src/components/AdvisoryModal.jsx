import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, MessageSquare, ShieldCheck, Mail, MapPin, Phone, Building, Calendar, Lock } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const AdvisoryModal = ({ isOpen, onClose, mode = 'report', userType }) => {
    const [step, setStep] = useState('form'); // 'form' | 'success'
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        company: '',
        preferredTime: ''
    });

    useEffect(() => {
        if (isOpen) {
            setStep('form');
            setFormData(prev => ({ ...prev })); // Reset or keep previous? Keep is better UX.
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call / Supabase insert
        try {
            const table = mode === 'report' ? 'leads' : 'site_visits';

            // For now, we just treat everything as a lead capture with different intent notes
            const leadData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone || null,
                company: formData.company || null,
                city: formData.city || null,
                source: userType,
                intent: mode === 'report' ? 'Download Report' : 'Consultation Request',
                preferred_time: formData.preferredTime || null,
                created_at: new Date().toISOString()
            };

            // In a real app, we'd upsert this lead into Supabase
            // For this demo, we'll just simulate a delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            setStep('success');
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const isReport = mode === 'report';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isOpen ? 1 : 0, transition: 'opacity 0.3s ease'
        }}>
            <div className="card animate-fade-in" style={{
                position: 'relative', width: '90%', maxWidth: '550px',
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid var(--color-border-glass)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                padding: '0', overflow: 'hidden'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="btn-icon-only"
                    style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, background: 'rgba(255,255,255,0.05)' }}
                >
                    <X size={20} color="#94a3b8" />
                </button>

                {step === 'form' && (
                    <div style={{ padding: '3rem 2.5rem' }}>
                        {/* Header */}
                        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            <div style={{
                                margin: '0 auto 1.5rem', width: '64px', height: '64px', borderRadius: '50%',
                                background: isReport ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: isReport ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                                {isReport ? <FileText size={32} color="#3b82f6" /> : <MessageSquare size={32} color="#10b981" />}
                            </div>

                            <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'white', marginBottom: '1rem', lineHeight: 1.2 }}>
                                {isReport ? 'Receive Your Engineered Power Architecture Report' : 'Speak With a Power Architect'}
                            </h2>

                            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
                                {isReport
                                    ? "We will send a professionally formatted PDF including system diagram, battery specs, and 5-year investment breakdown."
                                    : "Schedule a discussion with our engineering team to review optimization, financing, or installation pathways."
                                }
                            </p>
                        </div>

                        {/* Premium Position Copy for Report */}
                        {isReport && (
                            <div style={{
                                background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', padding: '1rem',
                                marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', gap: '0.75rem', alignItems: 'start'
                            }}>
                                <ShieldCheck size={18} color="var(--color-accent-emerald)" style={{ marginTop: '2px' }} />
                                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                                    Your system design is ready. Enter your details to receive a formal engineering summary suitable for internal review.
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label">Full Name</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Michael Chen"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label">Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                                    <input
                                        type="email"
                                        className="input-field"
                                        style={{ paddingLeft: '2.5rem' }}
                                        placeholder="michael@company.com"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Conditional Fields based on Mode */}
                            {isReport ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="label">Project City</label>
                                        <div style={{ position: 'relative' }}>
                                            <MapPin size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                                            <input
                                                className="input-field"
                                                style={{ paddingLeft: '2.5rem' }}
                                                placeholder="Addis Ababa"
                                                required
                                                value={formData.city}
                                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="label">Company (Optional)</label>
                                        <input
                                            className="input-field"
                                            placeholder="Acme Corp"
                                            value={formData.company}
                                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="label">Phone Number</label>
                                        <div style={{ position: 'relative' }}>
                                            <Phone size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                                            <input
                                                className="input-field"
                                                style={{ paddingLeft: '2.5rem' }}
                                                placeholder="+251 911..."
                                                required
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="label">Preferred Contact Time</label>
                                        <div style={{ position: 'relative' }}>
                                            <Calendar size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                                            <select
                                                className="input-field"
                                                style={{ paddingLeft: '2.5rem', appearance: 'none' }}
                                                value={formData.preferredTime}
                                                onChange={e => setFormData({ ...formData, preferredTime: e.target.value })}
                                            >
                                                <option value="">Anytime</option>
                                                <option value="Morning">Morning (9am - 12pm)</option>
                                                <option value="Afternoon">Afternoon (2pm - 5pm)</option>
                                                <option value="Evening">Evening (5pm - 7pm)</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary"
                                style={{
                                    marginTop: '1rem', width: '100%', padding: '1rem', fontSize: '1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    background: isReport ? 'var(--color-primary)' : 'var(--color-accent-emerald)'
                                }}
                            >
                                {isLoading ? 'Processing...' : (isReport ? 'Send My Report' : 'Request Consultation')}
                                {!isLoading && <CheckCircle size={18} />}
                            </button>
                        </form>

                        {/* Confidentiality Note */}
                        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                            <Lock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            Your information is confidential and used solely for delivering your {isReport ? 'report' : 'request'}.
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <div className="animate-fade-in" style={{ display: 'inline-flex', padding: '1.5rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', marginBottom: '2rem' }}>
                            <CheckCircle size={48} color="#10b981" />
                        </div>

                        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'white', marginBottom: '1rem' }}>
                            {isReport ? 'Report Generated Recently' : 'Request Received'}
                        </h2>

                        <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                            {isReport
                                ? <span>Your engineered system report is being prepared. It will arrive shortly at <strong>{formData.email}</strong>.</span>
                                : "A power architect will review your project requirements and contact you at your preferred time."
                            }
                        </p>

                        {isReport && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1rem' }}>Need clarification on the design?</p>
                                <button
                                    onClick={() => { // Reset to consultation mode
                                        setFormData({ ...formData, preferredTime: '' }); // Clear specific field
                                        onClose(); // Close this modal logic handled by parent usually, but here we might want to switch modes. 
                                        // For now, simpler to just close. Ideally parent handles mode switch.
                                    }}
                                    style={{
                                        background: 'transparent', border: '1px solid var(--color-border-glass)',
                                        color: 'white', padding: '0.75rem 1.5rem', borderRadius: '2rem', cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Close Window
                                </button>
                            </div>
                        )}
                        {!isReport && (
                            <button
                                onClick={onClose}
                                className="btn-primary"
                                style={{ background: 'var(--color-surface-glass)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                Return to Dashboard
                            </button>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .input-group { margin-bottom: 1rem; }
                .label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.4rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
                .input-field { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.8rem 1rem; border-radius: 0.5rem; transition: all 0.2s; }
                .input-field:focus { outline: none; border-color: #3b82f6; background: rgba(0,0,0,0.4); }
            `}</style>
        </div>
    );
};

export default AdvisoryModal;
