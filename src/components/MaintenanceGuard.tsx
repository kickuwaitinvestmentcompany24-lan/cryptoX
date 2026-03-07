import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getPlatformSettings } from "@/lib/storage";
import Maintenance from "@/pages/Maintenance";
import { useQuery } from "@tanstack/react-query";

interface MaintenanceGuardProps {
    children: React.ReactNode;
}

const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
    const { isAdmin, loading: authLoading } = useAuth();

    const { data: settings, isLoading: settingsLoading } = useQuery({
        queryKey: ["platform-settings"],
        queryFn: getPlatformSettings,
        // Refresh every minute to check if maintenance is over
        refetchInterval: 60000,
    });

    if (authLoading || settingsLoading) {
        return null;
    }

    const maintenanceMode = settings?.find(s => s.key === "maintenance_mode")?.value === true;

    // If maintenance mode is ON and user is NOT an admin, show maintenance page
    if (maintenanceMode && !isAdmin) {
        return <Maintenance />;
    }

    return <>{children}</>;
};

export default MaintenanceGuard;
