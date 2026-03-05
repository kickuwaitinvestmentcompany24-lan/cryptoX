import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet, TrendingUp, PieChart, ShieldCheck,
    MessageSquare, Box, LogOut, ChevronLeft,
    ChevronRight, Menu, X, CreditCard, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getInvestmentPlans, InvestmentPlan } from "@/lib/storage";
import { DepositModal } from "./DepositModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

interface UserSidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({
    isCollapsed,
    setIsCollapsed,
    isOpen,
    setIsOpen
}) => {
    const { signOut, profile } = useAuth();
    const { language, isRTL } = useLanguage();
    const t = translations[language].sidebar;
    const navigate = useNavigate();
    const [plans, setPlans] = useState<InvestmentPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await getInvestmentPlans();
                setPlans(data);
            } catch (error) {
                console.error("Error fetching investment plans:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const sidebarContent = (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Logo/Header */}
            <div className="p-6 flex items-center justify-between border-b border-border/30">
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-display font-bold text-xl text-primary flex items-center gap-2"
                    >
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Box className="w-5 h-5" />
                        </div>
                        {t.tradingHub}
                    </motion.div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex h-8 w-8 hover:bg-primary/10"
                >
                    {isCollapsed ? (isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : (isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />)}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="md:hidden h-8 w-8 hover:bg-primary/10"
                >
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                {/* Profile Card */}
                {!isCollapsed && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-lg text-primary overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    profile?.display_name?.charAt(0) || <User className="w-6 h-6" />
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <div className="font-bold truncate text-foreground">{profile?.display_name || t.guestUser}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{t.investorAccount}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Account Actions */}
                <div className="space-y-2">
                    {!isCollapsed && <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">{t.accountActions}</h3>}
                    <div className="space-y-1">
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 p-3 h-auto rounded-xl hover:bg-primary/10",
                                isCollapsed && "justify-center",
                                window.location.pathname === "/dashboard" && "bg-primary/10 text-primary border border-primary/20"
                            )}
                            onClick={() => {
                                navigate("/dashboard");
                                if (window.innerWidth < 768) setIsOpen(false);
                            }}
                        >
                            <Box className="w-5 h-5 text-primary" />
                            {!isCollapsed && <span>{translations[language].dashboard.title}</span>}
                        </Button>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 p-3 h-auto rounded-xl hover:bg-primary/10",
                                isCollapsed && "justify-center",
                                isDepositModalOpen && "text-primary"
                            )}
                            onClick={() => {
                                setIsDepositModalOpen(true);
                                if (window.innerWidth < 768) setIsOpen(false);
                            }}
                        >
                            <CreditCard className="w-5 h-5 text-primary" />
                            {!isCollapsed && <span>{t.makeDeposit}</span>}
                        </Button>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 p-3 h-auto rounded-xl hover:bg-primary/10",
                                isCollapsed && "justify-center",
                                window.location.pathname === "/plans" && "bg-primary/10 text-primary border border-primary/20"
                            )}
                            onClick={() => {
                                navigate("/plans");
                                if (window.innerWidth < 768) setIsOpen(false);
                            }}
                        >
                            <TrendingUp className="w-5 h-5 text-primary" />
                            {!isCollapsed && <span>{t.investmentPlans}</span>}
                        </Button>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 p-3 h-auto rounded-xl hover:bg-primary/10",
                                isCollapsed && "justify-center",
                                window.location.pathname === "/kyc" && "bg-primary/10 text-primary border border-primary/20"
                            )}
                            onClick={() => {
                                navigate("/kyc");
                                if (window.innerWidth < 768) setIsOpen(false);
                            }}
                        >
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            {!isCollapsed && <span>{t.kycVerification}</span>}
                        </Button>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 p-3 h-auto rounded-xl hover:bg-primary/10",
                                isCollapsed && "justify-center"
                            )}
                            onClick={() => {
                                // Support Ticket functionality
                                navigate("/dashboard"); // Redirect to dashboard until support is a separate page
                                if (window.innerWidth < 768) setIsOpen(false);
                            }}
                        >
                            <MessageSquare className="w-5 h-5 text-primary" />
                            {!isCollapsed && <span>{t.supportTickets}</span>}
                        </Button>
                    </div>
                </div>

                {/* Investment Plans */}
                {!isCollapsed && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.investmentPlans}</h3>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/5 hover:border-primary/20 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2 text-primary-content">
                                        <div className="font-bold text-sm text-foreground">{plan.name}</div>
                                        <div className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">{plan.daily_profit}% {t.daily}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                        <span>{translations[language].investment.min}: ${plan.min_amount}</span>
                                        <span className="group-hover:text-primary transition-colors">{t.applyNow} →</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-border/30">
                <Button
                    variant="ghost"
                    onClick={signOut}
                    className={cn(
                        "w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive p-3 rounded-xl",
                        isCollapsed && "justify-center"
                    )}
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span className="font-medium">{t.logout}</span>}
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <DepositModal
                isOpen={isDepositModalOpen}
                onOpenChange={setIsDepositModalOpen}
            />
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col glass transition-all duration-300 h-screen sticky top-0 z-40 overflow-hidden",
                    isRTL ? "border-l border-border/30" : "border-r border-border/30",
                    isCollapsed ? "w-20" : "w-72"
                )}
            >
                {sidebarContent}
            </aside>

            {/* Mobile Bottom Navigation or Floating Button */}
            <div className={cn(
                "md:hidden fixed bottom-6 z-50",
                isRTL ? "left-6" : "right-6"
            )}>
                <Button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full shadow-2xl bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all"
                >
                    <Menu className="w-6 h-6" />
                </Button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: isRTL ? "100%" : "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: isRTL ? "100%" : "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className={cn(
                                "fixed top-0 bottom-0 w-[280px] bg-background z-[60] md:hidden shadow-2xl overflow-hidden",
                                isRTL ? "right-0 border-l border-border/30" : "left-0 border-r border-border/30"
                            )}
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default UserSidebar;
