import React from "react";
import { motion } from "framer-motion";
import { UserPlus, ShieldCheck, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const OnboardingSection = () => {
  const { language } = useLanguage();
  const t = translations[language].onboarding;

  const steps = [
    {
      icon: UserPlus,
      title: t.steps[0].title,
      description: t.steps[0].desc,
      step: "01",
    },
    {
      icon: ShieldCheck,
      title: t.steps[1].title,
      description: t.steps[1].desc,
      step: "02",
    },
    {
      icon: TrendingUp,
      title: t.steps[2].title,
      description: t.steps[2].desc,
      step: "03",
    },
  ];
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t.title} <span className="text-gradient">{t.titleHighlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t.description}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <Card className="glass group hover:border-primary/50 transition-all duration-300 h-full cursor-default">
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="text-xs font-mono text-primary/60">{step.step}</div>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OnboardingSection;
