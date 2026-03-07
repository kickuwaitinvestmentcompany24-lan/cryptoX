import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, ShieldCheck, ArrowDownRight, ArrowUpRight,
    MessageSquare, Box, Settings, LayoutDashboard, Coins
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminMobileNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const AdminMobileNav: React.FC<AdminMobileNavProps> = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "users", label: "Users", icon: Users },
        { id: "kyc", label: "KYC", icon: ShieldCheck },
        { id: "deposits", label: "Deposits", icon: ArrowDownRight },
        { id: "withdrawals", label: "Withdrawals", icon: ArrowUpRight },
        { id: "support", label: "Support", icon: MessageSquare },
        { id: "currencies", label: "Currencies", icon: Coins },
    ];

    return (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
            <nav className="glass bg-background/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-2 flex items-center justify-around shadow-2xl shadow-primary/20">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "relative flex flex-col items-center p-2 rounded-xl transition-all duration-300",
                            activeTab === item.id ? "text-primary scale-110" : "text-muted-foreground opacity-70 hover:opacity-100"
                        )}
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="text-[10px] font-medium mt-1 uppercase tracking-tighter">{item.label}</span>
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="activeTabMobile"
                                className="absolute -inset-1 bg-primary/10 rounded-xl -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default AdminMobileNav;
