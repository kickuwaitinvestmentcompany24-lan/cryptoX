import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getInvestmentPlans, InvestmentPlan } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const InvestmentPlanSection = () => {
    const [plans, setPlans] = useState<InvestmentPlan[]>([]);
    const { language } = useLanguage();
    const t = translations[language].investment;

    useEffect(() => {
        const fetchPlans = async () => {
            const data = await getInvestmentPlans();
            setPlans(data);
        };
        fetchPlans();

        const handleStorageChange = async () => setPlans(await getInvestmentPlans());
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    return (
        <section id="pricing" className="py-24 relative overflow-hidden bg-background border-t border-border/30">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-foreground">
                        {t.title}
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                        {t.subtitle}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                        >
                            <Card className={`glass h-full flex flex-col group hover:border-primary/50 transition-all duration-500 ${index === 1 ? 'border-primary/40 shadow-lg shadow-primary/10 scale-105 z-10' : 'border-border/30'}`}>
                                <CardHeader className="text-center p-8 pb-0">
                                    <CardTitle className="font-display text-2xl font-bold text-foreground mb-2">{plan.name}</CardTitle>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-4xl font-display font-bold text-primary">{plan.daily_profit}%</span>
                                        <span className="text-xs text-muted-foreground uppercase tracking-widest">{t.daily}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 pt-6 flex flex-col flex-grow">
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-center py-2 border-b border-border/20">
                                            <span className="text-sm text-muted-foreground">{t.min} {t.investmentLabel}</span>
                                            <span className="text-sm font-semibold text-foreground">${plan.min_amount}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-border/20">
                                            <span className="text-sm text-muted-foreground">{t.max} {t.investmentLabel}</span>
                                            <span className="text-sm font-semibold text-foreground">${plan.max_amount}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-border/20">
                                            <span className="text-sm text-muted-foreground">{t.period}</span>
                                            <span className="text-sm font-semibold text-foreground">{plan.duration} {t.days}</span>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                                <Check className="w-3 h-3 text-primary" />
                                            </div>
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {t.autoSettlement}
                                            </span>
                                        </div>
                                    </div>

                                    <Button className={`w-full mt-auto font-bold py-6 ${index === 1 ? 'bg-primary text-primary-foreground hover:bg-primary/90 glow-emerald' : 'bg-muted/50 text-foreground hover:bg-muted'}`}>
                                        {t.select}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default InvestmentPlanSection;
