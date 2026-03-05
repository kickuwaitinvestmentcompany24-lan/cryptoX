import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { user, profile, loading, isAdmin, roles } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse">Verifying administrative access...</p>
            </div>
        );
    }

    if (!user || !isAdmin) {
        // Redirect to admin login if not authenticated or not an admin
        console.warn("[AdminRoute] Access denied: User is not an admin.");
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;
