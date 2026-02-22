import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface LanguageContextValue {
  hindiEnabled: boolean;
  toggleHindi: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({ hindiEnabled: false, toggleHindi: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [hindiEnabled, setHindiEnabled] = useState(() => localStorage.getItem('hindiEnabled') === 'true');

  const toggleHindi = useCallback(() => {
    setHindiEnabled(prev => {
      const next = !prev;
      localStorage.setItem('hindiEnabled', String(next));
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ hindiEnabled, toggleHindi }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
