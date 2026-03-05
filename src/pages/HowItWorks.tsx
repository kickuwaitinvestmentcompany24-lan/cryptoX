import React from "react";
import Navbar from "@/components/Navbar";
import HowItWorksSection from "@/components/HowItWorksSection";

const HowItWorks = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Navbar />
            <div className="pt-16">
                <HowItWorksSection />
            </div>
        </div>
    );
};

export default HowItWorks;
