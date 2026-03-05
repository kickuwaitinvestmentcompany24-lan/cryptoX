import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminMobileNav from "./AdminMobileNav";
import { cn } from "@/lib/utils";
import { useAdminRealtimeNotifications } from "@/hooks/useAdminRealtimeNotifications";

interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, setActiveTab }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useAdminRealtimeNotifications();

    return (
        <div className="min-h-screen bg-background flex text-foreground selection:bg-primary/30">
            {/* Glow Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
            </div>

            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
            />

            <main className={cn(
                "flex-1 relative z-10 p-4 md:p-8 transition-all duration-300",
                isSidebarCollapsed ? "md:max-w-[calc(100vw-5rem)]" : "md:max-w-[calc(100vw-16rem)]"
            )}>
                <div className="max-w-7xl mx-auto pb-24 md:pb-0">
                    {children}
                </div>
            </main>

            <AdminMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
};

export default AdminLayout;
