import React from "react";
import { motion } from "framer-motion";
import {
    Users, ShieldCheck, ArrowDownRight, ArrowUpRight,
    MessageSquare, Box, Settings, LogOut, ChevronLeft, ChevronRight,
    Sliders, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface AdminSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
    activeTab,
    setActiveTab,
    isCollapsed,
    setIsCollapsed
}) => {
    const { signOut, profile } = useAuth();

    const menuItems = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "users", label: "Users", icon: Users },
        { id: "kyc", label: "KYC Verification", icon: ShieldCheck },
        { id: "deposits", label: "Deposits", icon: ArrowDownRight },
        { id: "withdrawals", label: "Withdrawals", icon: ArrowUpRight },
        { id: "support", label: "Support Inbox", icon: MessageSquare },
        { id: "plans", label: "Investment Plans", icon: Box },
        { id: "content", label: "Platform Content", icon: Settings },
        { id: "settings", label: "Platform Settings", icon: Sliders },
    ];

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col border-r border-border/30 glass transition-all duration-300 h-screen sticky top-0 z-40",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-6 flex items-center justify-between border-b border-border/30">
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-display font-bold text-xl text-primary flex items-center gap-2"
                    >
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        Admin Hub
                    </motion.div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-8 w-8 hover:bg-primary/10"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
                            activeTab === item.id
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                        )}
                    >
                        <item.icon className={cn("w-5 h-5 shrink-0", activeTab === item.id ? "" : "group-hover:scale-110 transition-transform")} />
                        {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}

                        {isCollapsed && activeTab !== item.id && (
                            <div className="absolute left-full ml-2 px-2 py-1 rounded bg-popover text-popover-foreground text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-border/30">
                                {item.label}
                            </div>
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-border/30 space-y-4">
                {!isCollapsed && (
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/20 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                            {profile?.display_name?.charAt(0) || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-sm font-bold truncate">{profile?.display_name || 'Admin'}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Master Admin</div>
                        </div>
                    </div>
                )}

                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive p-3 rounded-xl",
                        isCollapsed && "justify-center"
                    )}
                    onClick={signOut}
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span className="font-medium">Logout System</span>}
                </Button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
