import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (enText: string, zhText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('pet_community_lang');
      return (saved as Language) || 'zh'; // Default to Chinese
    } catch {
      return 'zh';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('pet_community_lang', lang);
      window.dispatchEvent(new CustomEvent('language-changed', { detail: lang }));
    } catch (e) {
      console.error('Error writing language to localStorage:', e);
    }
  };

  useEffect(() => {
    const handleLangChanged = (e: any) => {
      if (e.detail && e.detail !== language) {
        setLanguageState(e.detail);
      }
    };
    window.addEventListener('language-changed', handleLangChanged);
    return () => {
      window.removeEventListener('language-changed', handleLangChanged);
    };
  }, [language]);

  // t function: returns enText if language is 'en', otherwise zhText
  const t = (enText: string, zhText: string): string => {
    return language === 'zh' ? zhText : enText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
