import React from "react";
import { motion } from "framer-motion";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const FAQSection = () => {
    const { language } = useLanguage();
    const t = translations[language].faq;

    return (
        <section id="faq" className="py-24 relative overflow-hidden bg-background">
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

                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {t.questions.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <AccordionItem
                                    value={`item-${index}`}
                                    className="glass border-border/30 px-6 rounded-xl overflow-hidden data-[state=open]:border-primary/50 transition-all duration-300"
                                >
                                    <AccordionTrigger className="text-left font-display font-medium text-foreground hover:no-underline hover:text-primary py-6 rtl:text-right">
                                        {faq.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-6 rtl:text-right">
                                        {faq.a}
                                    </AccordionContent>
                                </AccordionItem>
                            </motion.div>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
