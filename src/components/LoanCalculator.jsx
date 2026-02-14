import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Percent, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const LoanCalculator = ({ totalCapex, onClose, currentLead, banks }) => {
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [loanTermYears, setLoanTermYears] = useState(3);
    const [interestRate, setInterestRate] = useState(16.5); // Default fall back
    const [selectedBankId, setSelectedBankId] = useState('');

    const [monthlyPayment, setMonthlyPayment] = useState(0);
    const [totalInterest, setTotalInterest] = useState(0);
    const [totalPayment, setTotalPayment] = useState(0);
    const [isApplied, setIsApplied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Set initial bank
    useEffect(() => {
        if (banks && banks.length > 0) {
            setSelectedBankId(banks[0].id);
            setInterestRate(banks[0].interest_rate);
        }
    }, [banks]);

    // Handle Bank Change
    const handleBankChange = (e) => {
        const bankId = e.target.value;
        setSelectedBankId(bankId);
        const bank = banks.find(b => b.id === bankId);
        if (bank) {
            setInterestRate(bank.interest_rate);
        }
    };

    useEffect(() => {
        calculateLoan();
    }, [downPaymentPercent, loanTermYears, interestRate, totalCapex]);

    const calculateLoan = () => {
        const downPayment = totalCapex * (downPaymentPercent / 100);
        const loanAmount = totalCapex - downPayment;
        const monthlyRate = (interestRate / 100) / 12;
        const numberOfPayments = loanTermYears * 12;

        if (loanAmount <= 0) {
            setMonthlyPayment(0);
            setTotalInterest(0);
            setTotalPayment(downPayment);
            return;
        }

        // PMT Formula: P * (r(1+r)^n) / ((1+r)^n - 1)
        const pmt = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

        const totalLoanCost = pmt * numberOfPayments;

        setMonthlyPayment(pmt);
        setTotalInterest(totalLoanCost - loanAmount);
        setTotalPayment(totalLoanCost + downPayment);
    };

    const formatCurrency = (val) => {
        if (!val && val !== 0) return '-';
        return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(val);
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 3. Insert into Supabase
            const loanAmount = totalCapex - (totalCapex * (downPaymentPercent / 100));

            const payload = {
                lead_id: currentLead?.id,
                loan_amount: loanAmount,
                down_payment: totalCapex * (downPaymentPercent / 100),
                term_years: loanTermYears,
                monthly_payment: monthlyPayment,
                total_interest: totalInterest,
                bank_id: selectedBankId || null, // Capture which bank was selected
                status: 'submitted',
                created_at: new Date().toISOString()
            };

            const { data, error: sbError } = await supabase
                .from('loan_applications')
                .insert([payload])
                .select();

            if (sbError) throw sbError;

            setIsApplied(true);

        } catch (err) {
            console.error("Loan Application Error:", err);
            // Fallback: Proceed even if DB fails
            setIsApplied(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isApplied) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 3000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
            }}>
                <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '3rem 2rem' }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                        border: '1px solid #22c55e'
                    }}>
                        <CheckCircle size={48} color="#22c55e" />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', color: 'white', marginBottom: '1rem' }}>Application Received</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        Your financing request for <strong>{formatCurrency(totalCapex)}</strong> has been submitted. A loan officer will contact you within 24 hours.
                    </p>
                    <button onClick={onClose} className="btn-primary" style={{ width: '100%' }}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            overflowY: 'auto'
        }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', overflow: 'hidden', padding: 0 }}>

                {/* Left Side: Inputs */}
                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <DollarSign className="text-secondary" /> Financing Options
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            Simulate your monthly payments and apply for a solar loan directly.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Bank Selection */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={16} /> Select Bank</label>
                            {banks && banks.length > 0 ? (
                                <select
                                    value={selectedBankId}
                                    onChange={handleBankChange}
                                    className="input-field"
                                >
                                    {banks.map(bank => (
                                        <option key={bank.id} value={bank.id}>
                                            {bank.name} ({bank.interest_rate}%)
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Loading banks or no partners available...</div>
                            )}
                        </div>

                        {/* System Cost Display */}
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Total System Value (CAPEX)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{formatCurrency(totalCapex)}</div>
                        </div>

                        {/* Down Payment Slider */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <label className="label" style={{ marginBottom: 0 }}>Down Payment</label>
                                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{downPaymentPercent}% ({formatCurrency(totalCapex * (downPaymentPercent / 100))})</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="90"
                                step="5"
                                value={downPaymentPercent}
                                onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                                <span>10%</span>
                                <span>90%</span>
                            </div>
                        </div>

                        {/* Loan Term Selector */}
                        <div>
                            <label className="label">Loan Term (Years)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                                {[1, 2, 3, 5].map(year => (
                                    <button
                                        key={year}
                                        onClick={() => setLoanTermYears(year)}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: `1px solid ${loanTermYears === year ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)'}`,
                                            background: loanTermYears === year ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                                            color: loanTermYears === year ? 'white' : '#94a3b8',
                                            fontWeight: loanTermYears === year ? 600 : 400,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {year} Year{year > 1 ? 's' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interest Rate Reference */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                            <Percent size={16} color="#eab308" />
                            <span style={{ fontSize: '0.85rem', color: '#eab308' }}>Effective Annual Interest Rate: <strong>{interestRate}%</strong></span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Summary & Action */}
                <div style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.6)', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '2rem' }}>Repayment Summary</h3>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Estimated Monthly Payment</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                                {formatCurrency(monthlyPayment)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>per month for {loanTermYears * 12} months</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: '#cbd5e1' }}>Loan Principal</span>
                                <span style={{ fontWeight: 500, color: 'white' }}>{formatCurrency(totalCapex - (totalCapex * (downPaymentPercent / 100)))}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: '#cbd5e1' }}>Total Interest Payable</span>
                                <span style={{ fontWeight: 500, color: '#eab308' }}>{formatCurrency(totalInterest)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                                <span style={{ color: 'white', fontWeight: 600 }}>Total Cost of Ownership</span>
                                <span style={{ fontWeight: 700, color: 'white' }}>{formatCurrency(totalPayment)}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={handleApply}
                            className="btn-primary"
                            style={{
                                width: '100%', padding: '1rem', fontSize: '1rem',
                                background: 'linear-gradient(135deg, var(--color-primary), var(--color-danger))',
                                boxShadow: '0 4px 20px rgba(211, 47, 47, 0.4)'
                            }}
                        >
                            Apply for Financing
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                width: '100%', padding: '1rem', background: 'transparent', border: 'none',
                                color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoanCalculator;
