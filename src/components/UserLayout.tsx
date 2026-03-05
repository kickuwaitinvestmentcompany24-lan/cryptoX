import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import UserSidebar from "@/components/UserSidebar";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const UserLayout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { profile } = useAuth();

    useRealtimeNotifications(profile?.id);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <OnboardingModal />
            <UserSidebar
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                isOpen={isMobileSidebarOpen}
                setIsOpen={setIsMobileSidebarOpen}
            />
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar">
                <Outlet context={{ isSidebarCollapsed, isMobileSidebarOpen, setIsMobileSidebarOpen }} />
            </main>
        </div>
    );
};

export default UserLayout;
