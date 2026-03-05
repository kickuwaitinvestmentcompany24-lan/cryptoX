import React from "react";
import Navbar from "@/components/Navbar";
import TickerMarquee from "@/components/TickerMarquee";
import HeroSection from "@/components/HeroSection";
import OnboardingSection from "@/components/OnboardingSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import BenefitsSection from "@/components/BenefitsSection";
import FAQSection from "@/components/FAQSection";
import AboutUsSection from "@/components/AboutUsSection";
import InvestmentPlanSection from "@/components/InvestmentPlanSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <div className="pt-44">
        <TickerMarquee />
        <HeroSection />
        <AboutUsSection />
        <OnboardingSection />
        <InvestmentPlanSection />
        <HowItWorksSection />
        <BenefitsSection />
        <FAQSection />

        {/* Footer */}
        <footer className="border-t border-border/30 py-8">
          <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
            © 2026 CryptoX. All rights reserved. Trading involves risk.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
