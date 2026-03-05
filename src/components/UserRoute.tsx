import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface UserRouteProps {
    children: React.ReactNode;
}

const UserRoute: React.FC<UserRouteProps> = ({ children }) => {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        // Redirect to signup as requested for the onboarding flow
        return <Navigate to="/signup" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default UserRoute;
