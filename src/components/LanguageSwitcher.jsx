
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const currentLang = i18n.language || 'en';

    return (
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '0.25rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            <button
                onClick={() => changeLanguage('en')}
                style={{
                    background: currentLang === 'en' ? 'white' : 'transparent',
                    color: currentLang === 'en' ? 'black' : 'rgba(255,255,255,0.7)',
                    border: 'none',
                    borderRadius: '1.5rem',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                EN
            </button>
            <button
                onClick={() => changeLanguage('am')}
                style={{
                    background: currentLang === 'am' ? 'white' : 'transparent',
                    color: currentLang === 'am' ? 'black' : 'rgba(255,255,255,0.7)',
                    border: 'none',
                    borderRadius: '1.5rem',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: '"Noto Sans Ethiopic", sans-serif'
                }}
            >
                አማ
            </button>
        </div>
    );
};

export default LanguageSwitcher;
