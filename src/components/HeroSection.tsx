import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const HeroSection = () => {
  const { language } = useLanguage();
  const t = translations[language].hero;

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Radial gradient backgrounds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-card/40 backdrop-blur-sm w-fit text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {t.badge}
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight whitespace-pre-line">
              {t.title}
            </h1>

            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              {t.description}
            </p>

            <div className="flex items-center gap-3 mt-2">
              <Link to="/signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-emerald gap-2 px-6">
                  {translations[language].nav.getStarted} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2 border-border/50 text-foreground hover:bg-card/60">
                <Play className="w-4 h-4" /> {t.secondaryAction}
              </Button>
            </div>

            <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
              <div className="flex flex-col">
                <span className="text-2xl font-display font-bold text-foreground">$2.4B+</span>
                <span>{t.investmentVolumeLabel}</span>
              </div>
              <div className="w-px h-10 bg-border/50" />
              <div className="flex flex-col">
                <span className="text-2xl font-display font-bold text-foreground">150K+</span>
                <span>{t.activeInvestorsLabel}</span>
              </div>
              <div className="w-px h-10 bg-border/50" />
              <div className="flex flex-col">
                <span className="text-2xl font-display font-bold text-foreground">99.9%</span>
                <span>{t.uptimeLabel}</span>
              </div>
            </div>
          </motion.div>

          {/* Right - Floating Bitcoin Coin */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:flex items-center justify-center relative"
          >
            {/* Animated Glow behind the coin */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-64 h-64 rounded-full bg-primary/20 blur-[80px]"
            />

            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <img
                src="/bitcoin.png"
                alt="Glowing Bitcoin"
                className="w-[450px] h-auto drop-shadow-[0_0_50px_rgba(16,185,129,0.4)]"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
