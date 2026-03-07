import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { startImpersonationLog, endImpersonationLog } from "@/lib/storage";

export interface Profile {
    id: string;
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    balance: number;
    investment: number;
    currency: string;
    kyc_status: string;
    is_suspended: boolean;
    home_address: string | null;
    country: string | null;
    phone_number: string | null;
    onboarding_completed: boolean;
    kyc_document_url: string | null;
    kyc_rejection_reason: string | null;
    show_kyc_notification: boolean;
    profit: number;
    withdrawal_card_status: string | null;
    withdrawal_activation_status: string | null;
    withdrawal_code_status: string | null;
    withdrawal_step: number;
    last_withdrawal_amount: number | null;
    last_withdrawal_method: string | null;
    created_at: string;
}

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    roles: string[];
    isAdmin: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    startImpersonation: (targetUser: Profile) => Promise<void>;
    stopImpersonation: () => Promise<void>;
    impersonatedUser: Profile | null;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    roles: [],
    isAdmin: false,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
    startImpersonation: async () => { },
    stopImpersonation: async () => { },
    impersonatedUser: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [impersonatedUser, setImpersonatedUser] = useState<Profile | null>(null);
    const [impersonationLogId, setImpersonationLogId] = useState<string | null>(null);
    const fetchInProgress = useRef<string | null>(null);
    const initialized = useRef(false);

    const fetchProfileAndRoles = useCallback(async (userId: string, silent = false) => {
        if (fetchInProgress.current === userId) return;

        fetchInProgress.current = userId;
        if (!silent) setLoading(true);

        const timeoutId = setTimeout(() => {
            if (fetchInProgress.current === userId) {
                console.warn("[AuthContext] Fetch timeout reached.");
                setLoading(false);
                fetchInProgress.current = null;
            }
        }, 15000);

        try {
            const [profileRes, rolesRes] = await Promise.all([
                supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
                supabase.from("user_roles").select("role").eq("user_id", userId)
            ]);

            if (profileRes.error) console.error("[AuthContext] Profile error:", profileRes.error.message);
            if (rolesRes.error) console.error("[AuthContext] Roles error:", rolesRes.error.message);

            setProfile(profileRes.data as Profile || null);
            setRoles(rolesRes.data?.map(r => r.role) || []);
        } catch (err) {
            console.error("[AuthContext] Sync error:", err);
        } finally {
            clearTimeout(timeoutId);
            fetchInProgress.current = null;
            setLoading(false);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (session?.user?.id) await fetchProfileAndRoles(session.user.id, true);
    }, [session, fetchProfileAndRoles]);

    useEffect(() => {
        let mounted = true;

        const handleAuthChange = async (currentSession: Session | null) => {
            if (!mounted) return;

            setSession(currentSession);
            if (currentSession?.user) {
                await fetchProfileAndRoles(currentSession.user.id);
            } else {
                setProfile(null);
                setRoles([]);
                setLoading(false);
                fetchInProgress.current = null;
            }
        };

        // 1. Setup subscription first
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            // Only handle subsequent events if we've already initialized
            if (initialized.current) {
                handleAuthChange(currentSession);
            }
        });

        // 2. Perform a single synchronized initialization
        const initialize = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                if (mounted) {
                    await handleAuthChange(initialSession);
                    initialized.current = true;
                }
            } catch (err) {
                console.error("[AuthContext] Initialization failed:", err);
                if (mounted) setLoading(false);
            }
        };

        initialize();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchProfileAndRoles]);

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
    };

    const isAdmin = useMemo(() => roles.includes("admin"), [roles]);

    const startImpersonation = async (targetUser: Profile) => {
        if (!isAdmin) return;
        try {
            const log = await startImpersonationLog(session?.user?.id || "", targetUser.user_id);
            setImpersonatedUser(targetUser);
            setImpersonationLogId(log.id);
            sessionStorage.setItem("impersonated_user", JSON.stringify(targetUser));
            sessionStorage.setItem("impersonation_log_id", log.id);
        } catch (error) {
            console.error("Failed to start impersonation:", error);
        }
    };

    const stopImpersonation = async () => {
        if (impersonationLogId) {
            try {
                await endImpersonationLog(impersonationLogId);
            } catch (error) {
                console.error("Failed to end impersonation log:", error);
            }
        }
        setImpersonatedUser(null);
        setImpersonationLogId(null);
        sessionStorage.removeItem("impersonated_user");
        sessionStorage.removeItem("impersonation_log_id");
    };

    // Rehydrate impersonation session
    useEffect(() => {
        const storedUser = sessionStorage.getItem("impersonated_user");
        const storedLogId = sessionStorage.getItem("impersonation_log_id");
        if (storedUser) setImpersonatedUser(JSON.parse(storedUser));
        if (storedLogId) setImpersonationLogId(storedLogId);
    }, []);

    const value = useMemo(() => ({
        session,
        user: session?.user ?? null,
        profile: impersonatedUser || profile,
        roles,
        isAdmin: isAdmin && !impersonatedUser,
        loading,
        signOut,
        refreshProfile,
        startImpersonation,
        stopImpersonation,
        impersonatedUser
    }), [session, profile, roles, isAdmin, loading, refreshProfile, impersonatedUser, impersonationLogId]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};