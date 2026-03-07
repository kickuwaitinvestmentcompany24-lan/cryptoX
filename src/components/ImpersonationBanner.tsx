import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const ImpersonationBanner = () => {
    const { impersonatedUser, stopImpersonation } = useAuth();
    const navigate = useNavigate();

    if (!impersonatedUser) return null;

    const handleExit = async () => {
        await stopImpersonation();
        toast({
            title: "Impersonation Ended",
            description: "You have returned to your admin session.",
        });
        navigate("/admin");
    };

    return (
        <div className="bg-primary/10 border-b border-primary/20 p-2 relative z-[100] animate-in slide-in-from-top duration-500">
            <div className="container max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span>
                        Currently viewing as <span className="font-bold text-primary">{impersonatedUser.display_name || impersonatedUser.email}</span>
                    </span>
                </div>
                <Button
                    variant="default"
                    size="sm"
                    onClick={handleExit}
                    className="gap-2 h-8 px-4 shadow-lg shadow-primary/20"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Exit Session
                </Button>
            </div>
        </div>
    );
};

export default ImpersonationBanner;
