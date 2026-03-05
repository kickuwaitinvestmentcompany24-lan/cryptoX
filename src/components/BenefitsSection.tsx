import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { ShieldCheck, Globe, Headphones, Scale } from "lucide-react";

const BenefitsSection = () => {
    const { language } = useLanguage();
    const t = translations[language].benefits;

    const icons = [ShieldCheck, Globe, Headphones, Scale];

    return (
        <section id="features" className="py-24 relative overflow-hidden bg-background">
            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-foreground">
                        {t.title} <span className="text-gradient">{t.titleHighlight}</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                        {t.subtitle}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {t.items.map((benefit, index) => {
                        const Icon = icons[index % icons.length];
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card className="glass group hover:border-primary/50 transition-all duration-300 h-full">
                                    <CardContent className="p-8 flex flex-col gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <Icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <h3 className="font-display font-semibold text-foreground text-xl">
                                            {benefit.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {benefit.desc}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default BenefitsSection;
