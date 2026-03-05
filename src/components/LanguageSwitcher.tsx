import React from "react";
import { Globe } from "lucide-react";
import { motion } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const languages: { code: Language; label: string; flag: string }[] = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "zh", label: "中文", flag: "🇨🇳" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
];

const LanguageSwitcher = () => {
    const { language, setLanguage, isRTL } = useLanguage();

    const handleLanguageChange = (langCode: Language) => {
        setLanguage(langCode);
    };

    const currentLang = languages.find(l => l.code === language) || languages[0];

    return (
        <div className={cn(
            "fixed bottom-6 z-[100] pointer-events-auto",
            isRTL ? "right-6" : "left-6"
        )}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full glass-strong shadow-2xl flex items-center justify-center border border-white/20 hover:border-primary/50 transition-colors group relative"
                    >
                        <Globe className="w-5 h-5 md:w-6 md:h-6 text-foreground group-hover:text-primary transition-colors" />
                        <span className={cn(
                            "absolute -top-1 bg-primary text-black text-[9px] md:text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border-2 border-background",
                            isRTL ? "-left-1" : "-right-1"
                        )}>
                            {currentLang.code.toUpperCase()}
                        </span>
                    </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side="top"
                    align={isRTL ? "end" : "start"}
                    className="glass-strong border-white/10 w-48 mb-4 overflow-hidden z-[101]"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-h-[300px] overflow-y-auto custom-scrollbar"
                    >
                        {languages.map((lang) => (
                            <DropdownMenuItem
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={cn(
                                    "flex items-center gap-3 cursor-pointer py-3 transition-colors focus:bg-primary/20",
                                    language === lang.code && "bg-primary/10 text-primary",
                                    isRTL && "flex-row-reverse text-right"
                                )}
                            >
                                <span className="text-xl">{lang.flag}</span>
                                <span className="text-sm font-medium">{lang.label}</span>
                                {language === lang.code && (
                                    <div className={cn("w-1.5 h-1.5 rounded-full bg-primary", isRTL ? "mr-auto" : "ml-auto")} />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </motion.div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default LanguageSwitcher;
