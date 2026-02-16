import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Zap, CheckCircle, AlertTriangle, Info, ArrowLeft, HelpCircle, Home, FileText, X } from 'lucide-react';
import Calculator from './components/Calculator';
import GuidedCalculator from './components/GuidedCalculator';
import Results from './components/Results'; // Keeping fallback just in case
import PremiumResults from './components/PremiumResults';
import AdminPanel from './components/AdminPanel';
import AdvisoryModal from './components/AdvisoryModal';
import SiteVisitForm from './components/SiteVisitForm';
import EnergyFlow from './components/EnergyFlow';
import LoanCalculator from './components/LoanCalculator';
import LanguageSwitcher from './components/LanguageSwitcher';
import { calculateSystemSize, calculateFinancials, calculateHourlyEnergy, checkOptimality, DEFAULT_CONSTANTS } from './utils/logic';
import { supabase } from './utils/supabaseClient';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                    <h2>Something went wrong.</h2>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', color: '#94a3b8' }}>
                        {this.state.error && this.state.error.toString()}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState(0); // 0: Home, 1: Input, 2: Capture, 3: Results, 4: Site Visit
    const [userType, setUserType] = useState('residential'); // 'residential' | 'sme'
    const [constants, setConstants] = useState(() => {
        const saved = localStorage.getItem('crs_constants');
        // Merge saved constants with defaults to ensure new keys are present
        return saved ? { ...DEFAULT_CONSTANTS, ...JSON.parse(saved) } : DEFAULT_CONSTANTS;
    });

    // Persist constants to localStorage
    useEffect(() => {
        localStorage.setItem('crs_constants', JSON.stringify(constants));
    }, [constants]);

    const [appliances, setAppliances] = useState([]);
    const [outageHours, setOutageHours] = useState(4);
    const [phase, setPhase] = useState('unknown'); // '1-phase' | '3-phase' | 'unknown'
    const [results, setResults] = useState(null);
    const [warnings, setWarnings] = useState([]);

    // Auth & Data State
    const [currentLead, setCurrentLead] = useState(null);
    const [banks, setBanks] = useState([]);

    const [isAdminOpen, setIsAdminOpen] = useState(false);
    // const [showLeadCapture, setShowLeadCapture] = useState(false); // Removed legacy lead capture
    const [showSiteVisit, setShowSiteVisit] = useState(false);
    const [showLoanCalculator, setShowLoanCalculator] = useState(false);

    // New Modals
    const [showAdvisory, setShowAdvisory] = useState(false);
    const [advisoryMode, setAdvisoryMode] = useState('report'); // 'report' | 'consultation'
    const [showManual, setShowManual] = useState(false);
    const [showAbout, setShowAbout] = useState(false);

    // Initialize appliances based on type when type changes
    useEffect(() => {
        if (userType === 'residential') {
            setAppliances([
                { id: 1, name: 'LED Bulbs (Pack)', watts: 50, quantity: 1, hours: 4 },
                { id: 2, name: 'Refrigerator', watts: 150, quantity: 1, hours: 24 },
                { id: 3, name: 'WiFi Router', watts: 10, quantity: 1, hours: 24 },
                { id: 4, name: 'TV (LED)', watts: 80, quantity: 1, hours: 4 },
            ]);
        } else {
            setAppliances([
                { id: 1, name: 'Desktop Computer', watts: 200, quantity: 2, hours: 8 },
                { id: 2, name: 'Printer', watts: 300, quantity: 1, hours: 1 },
                { id: 3, name: 'WiFi Router', watts: 15, quantity: 1, hours: 24 },
                { id: 4, name: 'Office Lighting', watts: 100, quantity: 1, hours: 8 },
                { id: 5, name: 'Coffee Machine', watts: 1000, quantity: 1, hours: 0.5 },
            ]);
        }
    }, [userType]);

    // Fetch Banks
    useEffect(() => {
        const fetchBanks = async () => {
            const { data, error } = await supabase.from('banks').select('*').eq('active', true);
            if (data) setBanks(data);
        };
        fetchBanks();
    }, []);

    // Calculation Handler
    const handleCalculate = () => {
        try {
            const size = calculateSystemSize(appliances, outageHours, phase, constants);
            const money = calculateFinancials(size, { outageHoursPerDay: outageHours }, constants);
            // Pass userType and appliances to determine specific load profile (e.g. coffee shop)
            const hourlyResult = calculateHourlyEnergy(size, size.totalDailyEnergyWh, userType, appliances);
            const optim = checkOptimality(size, outageHours);

            if (!size || !money || !hourlyResult || !hourlyResult.data) {
                console.error("Calculation returned incomplete data", { size, money, hourlyResult });
                return;
            }

            setResults({
                systemSize: size,
                financials: money,
                comparisonData: money.comparisonData,
                hourlyData: hourlyResult.data,
                hourlyNote: hourlyResult.note
            });
            setWarnings(optim);
            // setShowLeadCapture(true); // REMOVED: No longer gatekeeping results
            setStep(3); // Go directly to Results
        } catch (err) {
            console.error("Calculation Error:", err);
            alert("An error occurred during calculation. Please check your appliance inputs and try again.");
        }
    };

    const handleOpenAdvisory = (mode) => {
        setAdvisoryMode(mode);
        setShowAdvisory(true);
    };

    const saveProposal = async (leadId, resultData) => {
        if (!leadId || !resultData) return;
        try {
            const { error } = await supabase
                .from('proposals')
                .insert([{
                    lead_id: leadId,
                    system_size_pv_kw: resultData.systemSize.recommended.pvKw,
                    system_size_battery_kwh: resultData.systemSize.recommended.batteryKwh,
                    system_size_inverter_kw: resultData.systemSize.recommended.inverterKw,
                    total_capex: resultData.financials.capexSolar,
                    analysis_json: resultData,
                    created_at: new Date().toISOString()
                }]);

            if (error) console.error("Error saving proposal:", error);
        } catch (err) {
            console.error("Proposal Save Exception:", err);
        }
    };

    const handleUnlock = (leadData) => {
        // Legacy handler kept for compatibility if needed, but primary flow is now AdvisoryModal
        console.log("Lead Captured (Legacy):", leadData);
        setCurrentLead(leadData);
        // setShowLeadCapture(false);
    };

    const handleGetProposal = () => {
        // Legacy handler
        setShowSiteVisit(true);
    };

    const handleSiteVisitSubmit = (formData) => {
        console.log("Site Visit Request:", formData);
        setShowSiteVisit(false);
        setTimeout(() => {
            // success action
        }, 100);
    };

    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPasswordInput, setAdminPasswordInput] = useState('');

    const handleAdminClick = () => {
        setShowAdminLogin(true);
    };

    const handleAdminLoginSubmit = (e) => {
        e.preventDefault();
        if (adminPasswordInput === "admin123") {
            setShowAdminLogin(false);
            setIsAdminOpen(true);
            setAdminPasswordInput('');
        } else {
            alert("Incorrect Password");
        }
    };


    // Font fix for Amharic
    const isAmharic = i18n.language === 'am';
    const contentStyle = isAmharic ? { fontFamily: '"Noto Sans Ethiopic", sans-serif', lineHeight: 1.6 } : {};

    return (
        <div className="app-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', ...contentStyle }}>
            <ErrorBoundary>
                {/* Header */}
                <header style={{
                    position: 'sticky', top: 0, zIndex: 100,
                    background: 'var(--color-surface-glass-heavy)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: '1px solid var(--color-border-glass)'
                }}>
                    <div className="container" style={{ height: '90px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                            onClick={() => setStep(0)}
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                        >
                            <img
                                src="/images/crs_logo.png"
                                alt="CRS Logo"
                                style={{
                                    height: '80px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))'
                                }}
                            />
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', letterSpacing: '1px' }}>CRS</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Language Switcher */}
                            <LanguageSwitcher />

                            <button
                                onClick={() => setStep(0)}
                                className="btn-icon-only"
                                title={t('common.home')}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: 'auto' }}
                            >
                                <Home size={20} /> <span className="hide-mobile">{t('common.home')}</span>
                            </button>
                            <button
                                onClick={() => setShowManual(true)}
                                className="btn-icon-only"
                                title={t('common.help')}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: 'auto' }}
                            >
                                <HelpCircle size={20} /> <span className="hide-mobile">{t('common.help')}</span>
                            </button>
                            <button
                                onClick={() => setShowAbout(true)}
                                className="btn-icon-only"
                                title={t('common.about')}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: 'auto' }}
                            >
                                <Info size={20} /> <span className="hide-mobile">{t('common.about')}</span>
                            </button>

                            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 0.5rem' }}></div>

                            <button
                                onClick={handleAdminClick}
                                className="btn-icon-only"
                                title={t('common.admin')}
                            >
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="container" style={{ flex: 1, paddingBottom: '4rem', paddingTop: '2rem', position: 'relative' }}>

                    {/* STEP 0: LANDING / SELECTION */}
                    {step === 0 && (
                        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center', paddingTop: '2rem' }}>
                            {/* Hero Section */}
                            <div style={{ marginBottom: '4rem' }}>
                                <img
                                    src="/images/crs_logo.png"
                                    alt="CRS Logo"
                                    style={{
                                        height: '120px',
                                        width: 'auto',
                                        marginBottom: '1rem',
                                        filter: 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.2))'
                                    }}
                                />
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '2px', color: '#94a3b8', marginBottom: '1.5rem' }}>{t('home.subtitle')}</div>
                                <h1 style={{
                                    fontSize: '3.5rem',
                                    fontWeight: 800,
                                    marginBottom: '1rem',
                                    background: 'linear-gradient(135deg, white 0%, #cbd5e1 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textShadow: '0 0 30px rgba(255,255,255,0.1)'
                                }}>
                                    {t('home.title')}
                                </h1>
                                <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
                                    {t('home.description')}
                                </p>
                            </div>

                            {/* Infographic Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '2rem',
                                marginBottom: '4rem'
                            }}>
                                {/* Card 1: The Problem */}
                                <div className="card" style={{
                                    background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, rgba(15, 23, 42, 0.4) 100%)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    textAlign: 'left'
                                }}>
                                    <div style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        width: '50px', height: '50px',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1rem',
                                        color: '#ef4444'
                                    }}>
                                        <AlertTriangle size={24} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.5rem' }}>{t('home.feature_1_title')}</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        {t('home.feature_1_desc')}
                                    </p>
                                </div>

                                {/* Card 2: The Solution */}
                                <div className="card" style={{
                                    background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.05) 0%, rgba(15, 23, 42, 0.4) 100%)',
                                    border: '1px solid rgba(34, 197, 94, 0.2)',
                                    textAlign: 'left'
                                }}>
                                    <div style={{
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        width: '50px', height: '50px',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1rem',
                                        color: '#22c55e'
                                    }}>
                                        <Settings size={24} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.5rem' }}>{t('home.feature_2_title')}</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        {t('home.feature_2_desc')}
                                    </p>
                                </div>

                                {/* Card 3: The Benefit */}
                                <div className="card" style={{
                                    background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, rgba(15, 23, 42, 0.4) 100%)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    textAlign: 'left'
                                }}>
                                    <div style={{
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        width: '50px', height: '50px',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1rem',
                                        color: '#3b82f6'
                                    }}>
                                        <Zap size={24} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.5rem' }}>{t('home.feature_3_title')}</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        {t('home.feature_3_desc')}
                                    </p>
                                </div>
                            </div>

                            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '2rem', fontWeight: 500 }}>
                                {t('home.cta')}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '700px', margin: '0 auto' }}>
                                {/* Residential Card */}
                                <button
                                    onClick={() => { setUserType('residential'); setStep(1); }}
                                    className="card"
                                    style={{
                                        textAlign: 'left', cursor: 'pointer', transition: 'all 0.3s',
                                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                >
                                    <div style={{ width: '50px', height: '50px', background: 'var(--color-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'white' }}>{t('user_type.residential_title')}</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                        {t('user_type.residential_desc')}
                                    </p>
                                </button>

                                {/* SME Card */}
                                <button
                                    onClick={() => { setUserType('sme'); setStep(1); }}
                                    className="card"
                                    style={{
                                        textAlign: 'left', cursor: 'pointer', transition: 'all 0.3s',
                                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--color-secondary)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                >
                                    <div style={{ width: '50px', height: '50px', background: 'var(--color-secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'white' }}>{t('user_type.sme_title')}</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                        {t('user_type.sme_desc')}
                                    </p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: CALCULATOR */}
                    {step === 1 && (
                        <div style={{ width: '100%' }}>
                            <GuidedCalculator
                                userType={userType}
                                appliances={appliances}
                                setAppliances={setAppliances}
                                outageHours={outageHours}
                                setOutageHours={setOutageHours}
                                phase={phase}
                                setPhase={setPhase}
                                onCalculate={handleCalculate}
                                onBack={() => setStep(0)}
                            />
                        </div>
                    )}

                    {/* STEP 3: RESULTS DASHBOARD */}
                    {step === 3 && results && (
                        <div className="animate-fade-in">
                            <div>
                                <button
                                    onClick={() => setStep(1)}
                                    style={{
                                        background: 'transparent', border: 'none', color: 'var(--color-text-muted)',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer'
                                    }}>
                                    <ArrowLeft size={16} /> Edit Profile
                                </button>

                                <PremiumResults
                                    systemSize={results.systemSize}
                                    financials={results.financials}
                                    comparisonData={results.comparisonData}
                                    hourlyData={results.hourlyData}
                                    hourlyNote={results.hourlyNote}
                                    onOpenAdvisory={handleOpenAdvisory}
                                    onFinance={() => setShowLoanCalculator(true)}
                                    userType={userType}
                                    outageHours={outageHours}
                                    constants={constants}
                                />
                            </div>
                        </div>
                    )}

                    {/* MODALS */}

                    {/* NEW ADVISORY MODAL (Replaces LeadCapture) */}
                    <AdvisoryModal
                        isOpen={showAdvisory}
                        onClose={() => setShowAdvisory(false)}
                        mode={advisoryMode}
                        userType={userType}
                    />

                    {/* SITE VISIT FORM MODAL */}
                    {showSiteVisit && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2000 }}>
                            <SiteVisitForm
                                onSubmit={handleSiteVisitSubmit}
                                onCancel={() => setShowSiteVisit(false)}
                                systemSize={results ? results.systemSize : null}
                                currentLead={currentLead}
                                userType={userType}
                            />
                        </div>
                    )}

                    {/* LOAN CALCULATOR MODAL */}
                    {showLoanCalculator && results && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2000 }}>
                            <LoanCalculator
                                totalCapex={results.financials.capexSolar}
                                onClose={() => setShowLoanCalculator(false)}
                                currentLead={currentLead}
                                banks={banks}
                            />
                        </div>
                    )}

                    {/* MANUAL MODAL */}
                    {showManual && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3000,
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                        }}>
                            <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
                                <button onClick={() => setShowManual(false)} className="btn-icon-only" style={{ position: 'absolute', top: '1rem', right: '1rem' }}><X size={24} color="white" /></button>
                                <h2 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><HelpCircle /> User Manual</h2>

                                <div className="prose" style={{ color: '#cbd5e1' }}>
                                    <h3>1. Getting Started</h3>
                                    <p>Select your profile type (Residential or SME) to load default appliance configurations.</p>

                                    <h3>2. Configuring Appliances</h3>
                                    <p>Add all electrical appliances you wish to power during an outage. Ensure you specify correct quantities and usage hours.</p>

                                    <h3>3. Understanding Results</h3>
                                    <p>The system will recommend specific inverter, battery, and panel sizes. Review the "System Assessment" for efficiency warnings.</p>

                                    <h3>4. Applying for Finance</h3>
                                    <p>Use the "Finance Options" button in the results page to simulate loan payments and submit an application directly to our partner banks.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABOUT MODAL */}
                    {showAbout && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3000,
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                        }}>
                            <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
                                <button onClick={() => setShowAbout(false)} className="btn-icon-only" style={{ position: 'absolute', top: '1rem', right: '1rem' }}><X size={24} color="white" /></button>
                                <h2 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Info /> About CRS</h2>

                                <div className="prose" style={{ color: '#cbd5e1' }}>
                                    <p><strong>CRS (Complete Renewable Solutions)</strong> is dedicated to providing reliable, sustainable energy for Ethiopia.</p>
                                    <p>We specialize in hybrid solar systems that ensure 24/7 power availability, reducing reliance on the unstable grid and expensive diesel generators.</p>
                                    <p>Our solutions are tailored for both residential homes and small-to-medium enterprises, offering seamless integration with existing electrical infrastructure.</p>
                                    <br />
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                                        <h4>Contact Us</h4>
                                        <p>Phone: +251 911 234 567</p>
                                        <p>Email: info@crs-ethiopia.com</p>
                                        <p>Address: Bole Road, Addis Ababa</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </main>

                {/* ADMIN LOGIN MODAL */}
                {showAdminLogin && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3000,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                        <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Settings size={20} /> Admin Access
                                </h3>
                                <button onClick={() => setShowAdminLogin(false)} className="btn-icon-only"><X size={20} color="#94a3b8" /></button>
                            </div>
                            <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="label">Enter Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        autoFocus
                                        value={adminPasswordInput}
                                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Unlock Dashboard</button>
                            </form>
                        </div>
                    </div>
                )}

                <AdminPanel
                    isOpen={isAdminOpen}
                    onClose={() => setIsAdminOpen(false)}
                    constants={constants}
                    onUpdate={setConstants}
                />
            </ErrorBoundary>
        </div>
    );
}

export default App;
