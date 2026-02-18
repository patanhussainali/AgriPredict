import { createContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children, initialLang = 'en' }) => {
    const [lang, setLang] = useState(initialLang);
    const [fontSize, setFontSize] = useState(50); // Default 50% (Normal)

    // Get translations for current language, fallback to english if missing
    const t = translations[lang] || translations['en'];

    // Update root font size when fontSize changes
    useEffect(() => {
        const sizePercentage = 75 + (fontSize / 100) * 50; // Range: 75% to 125%
        document.documentElement.style.fontSize = `${sizePercentage}%`;
    }, [fontSize]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, fontSize, setFontSize }}>
            {children}
        </LanguageContext.Provider>
    );
};
