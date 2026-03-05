import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "ar" | "fr" | "es" | "de" | "zh" | "ja";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>(() => {
        try {
            return (localStorage.getItem("app_language") as Language) || "en";
        } catch {
            return "en";
        }
    });

    const isRTL = language === "ar";

    useEffect(() => {
        try {
            localStorage.setItem("app_language", language);
        } catch { }

        // Update document direction
        document.documentElement.dir = isRTL ? "rtl" : "ltr";
        document.documentElement.lang = language;
    }, [language, isRTL]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
            <div dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "font-arabic" : ""}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
