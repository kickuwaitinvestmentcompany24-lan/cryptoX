import React from "react";
import { motion } from "framer-motion";
import { Hammer, Settings, Clock, ShieldCheck } from "lucide-react";

const Maintenance = () => {
    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-background">
            {/* Background elements */}
            <div className="absolute inset-0 bg-background overflow-hidden -z-10">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full glass p-8 md:p-12 border border-border/50 rounded-3xl text-center space-y-8 relative overflow-hidden shadow-2xl"
            >
                {/* Visual indicator */}
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 mx-auto border-2 border-dashed border-primary/30 rounded-full flex items-center justify-center"
                    >
                        <Settings className="w-12 h-12 text-primary animate-pulse" />
                    </motion.div>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="absolute -bottom-2 -right-2 md:right-1/3 bg-background border border-border/50 p-2 rounded-xl shadow-xl hover:scale-110 transition-transform"
                    >
                        <Hammer className="w-5 h-5 text-primary" />
                    </motion.div>
                </div>

                <div className="space-y-4">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-5xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent"
                    >
                        System Maintenance
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto"
                    >
                        Our platform is currently undergoing scheduled maintenance to improve your trading experience. We'll be back shortly with enhanced performance and security.
                    </motion.p>
                </div>

                {/* Features working on */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left"
                >
                    <div className="bg-background/40 p-4 rounded-2xl border border-border/30 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-foreground">Security Audit</h3>
                            <p className="text-xs text-muted-foreground">Ensuring your assets are protected with the latest protocols.</p>
                        </div>
                    </div>
                    <div className="bg-background/40 p-4 rounded-2xl border border-border/30 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-foreground">Estimated Time</h3>
                            <p className="text-xs text-muted-foreground">Typically takes 30-60 minutes. Thank you for your patience.</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="pt-4 border-t border-border/30 flex flex-col md:flex-row items-center justify-center gap-6 text-xs text-muted-foreground"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span>Core systems: Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span>Database migration: In progress</span>
                    </div>
                </motion.div>

                {/* Branding footer */}
                <div className="pt-4">
                    <span className="text-sm font-display tracking-widest text-primary font-bold opacity-50 uppercase">
                        CryptoX Trading
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default Maintenance;
