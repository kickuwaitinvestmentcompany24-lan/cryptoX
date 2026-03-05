import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ClipboardList, Wallet, Rocket } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const HowItWorksSection = () => {
    const { language } = useLanguage();
    const t = translations[language].howItWorks;
    const [isVisible, setIsVisible] = useState(false);

    const steps = [
        {
            icon: User,
            title: t.steps[0].title,
            desc: t.steps[0].desc,
            number: "1",
        },
        {
            icon: ClipboardList,
            title: t.steps[1].title,
            desc: t.steps[1].desc,
            number: "2",
        },
        {
            icon: Wallet,
            title: t.steps[2].title,
            desc: t.steps[2].desc,
            number: "3",
        },
    ];

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    return (
        <section id="how-it-works" className="py-24 relative overflow-hidden bg-background">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-foreground">
                        {t.title.split('CRYPTOX')[0]} <span className="text-gradient">CRYPTOX</span> {t.title.split('CRYPTOX')[1]}
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                        {t.subtitle}
                    </p>
                </motion.div>

                <div className="relative flex flex-col md:flex-row justify-between items-center max-w-5xl mx-auto gap-16 md:gap-0">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] border-t-2 border-dashed border-primary/20 -translate-y-1/2 hidden md:block z-0" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            className="relative z-10 flex flex-col items-center group"
                        >
                            <div className="relative mb-6">
                                <div className="glass w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-primary/30 flex items-center justify-center shadow-lg group-hover:border-primary/60 group-hover:shadow-primary/20 transition-all duration-500">
                                    <step.icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-7 h-7 md:w-8 md:h-8 rounded-full bg-background border border-primary/40 flex items-center justify-center text-xs font-mono font-bold text-primary">
                                    {step.number}
                                </div>
                                <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/15 transition-all duration-500 -z-10" />
                            </div>

                            <h3 className="font-display text-lg md:text-xl font-bold text-foreground tracking-wide text-center group-hover:text-primary transition-colors mb-2">
                                {step.title}
                            </h3>
                            <p className="text-xs text-muted-foreground text-center max-w-[150px]">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.5 }}
                        transition={{ duration: 0.3 }}
                        onClick={scrollToTop}
                        className="fixed bottom-10 right-10 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg glow-emerald cursor-pointer hover:scale-110 transition-transform z-50 group"
                        title={translations[language].nav.backToTop}
                    >
                        <Rocket className="w-6 h-6 text-primary-foreground fill-current transform -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default HowItWorksSection;
