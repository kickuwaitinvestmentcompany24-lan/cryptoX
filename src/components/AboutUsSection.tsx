import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { getAboutUs, AboutUs as AboutUsType } from "@/lib/storage";

const AboutUsSection = () => {
    const { language } = useLanguage();
    const t = translations[language].about;
    const [aboutContent, setAboutContent] = useState<AboutUsType | null>(null);

    useEffect(() => {
        getAboutUs().then(setAboutContent);
    }, []);

    const title = aboutContent?.title || t.title;
    const content = aboutContent?.content || t.content;

    return (
        <section id="about" className="py-24 relative overflow-hidden bg-background">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6 text-xs text-primary font-mono uppercase tracking-wider">
                            {t.badge}
                        </div>
                        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-foreground leading-tight">
                            {title}
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                            {content}
                        </p>

                        <div className="grid grid-cols-2 gap-8 py-8 border-t border-border/30">
                            <div>
                                <div className="text-3xl font-display font-bold text-foreground">12+</div>
                                <div className="text-sm text-muted-foreground">
                                    {t.yearsExperience}
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-display font-bold text-foreground">100%</div>
                                <div className="text-sm text-muted-foreground">
                                    {t.secureRegulated}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Visualization */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative flex justify-center lg:justify-end"
                    >
                        {/* Glow Background */}
                        <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full" />

                        <div className="glass rounded-3xl p-8 relative z-10 max-w-md w-full border-primary/20 aspect-square flex items-center justify-center">
                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                    rotateY: [0, 360],
                                }}
                                transition={{
                                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                                    rotateY: { duration: 8, repeat: Infinity, ease: "linear" }
                                }}
                                className="perspective-1000"
                            >
                                <img
                                    src="/bitcoin.png"
                                    alt="Bitcoin"
                                    className="w-64 h-64 drop-shadow-[0_0_50_rgba(16,185,129,0.3)]"
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AboutUsSection;
