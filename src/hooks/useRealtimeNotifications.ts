import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * User-side realtime notifications.
 * Call inside UserLayout, pass the profile's profiles.id (NOT user_id).
 */
export const useRealtimeNotifications = (profileId: string | undefined) => {
    const { toast } = useToast();
    const prevTxStatuses = useRef<Record<string, string>>({});
    const prevKyc = useRef<string | null>(null);

    useEffect(() => {
        if (!profileId) return;

        // Subscribe to profile changes (balance, KYC)
        const profileChannel = supabase
            .channel(`user-profile-${profileId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profileId}` },
                (payload) => {
                    const newRow = payload.new as any;
                    const oldRow = payload.old as any;

                    // Balance increased
                    if ((newRow.balance ?? 0) > (oldRow.balance ?? 0)) {
                        const diff = newRow.balance - oldRow.balance;
                        toast({
                            title: "💰 Balance Updated",
                            description: `+${newRow.currency || 'USD'} ${diff.toLocaleString()} has been added to your account.`,
                            className: "notification-bubble deposit-bubble",
                        });
                    }

                    // KYC change
                    if (newRow.kyc_status !== prevKyc.current && prevKyc.current !== null) {
                        const kycMessages: Record<string, string> = {
                            approved: "✅ KYC Approved — your identity has been verified.",
                            rejected: "❌ KYC Rejected — please re-submit your documents.",
                            pending: "🕐 KYC Submitted — awaiting admin review.",
                        };
                        const msg = kycMessages[newRow.kyc_status];
                        if (msg) toast({ title: "KYC Status Update", description: msg, className: "notification-bubble" });
                    }
                    prevKyc.current = newRow.kyc_status;
                }
            )
            .subscribe();

        // Subscribe to transaction status changes
        const txChannel = supabase
            .channel(`user-transactions-${profileId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `user_id=eq.${profileId}` },
                (payload) => {
                    const tx = payload.new as any;
                    const prev = prevTxStatuses.current[tx.id];
                    if (prev === tx.status) return;
                    prevTxStatuses.current[tx.id] = tx.status;

                    if (tx.status === 'approved' && tx.type === 'deposit') {
                        toast({
                            title: "✅ Deposit Approved",
                            description: `Your deposit of ${tx.amount?.toLocaleString()} has been confirmed!`,
                            className: "notification-bubble deposit-bubble",
                        });
                    } else if (tx.status === 'approved' && tx.type === 'withdrawal') {
                        toast({
                            title: "✅ Withdrawal Approved",
                            description: `Your withdrawal of ${tx.amount?.toLocaleString()} is being processed.`,
                            className: "notification-bubble",
                        });
                    } else if (tx.status === 'rejected') {
                        toast({
                            title: "❌ Transaction Declined",
                            description: `Your ${tx.type} of ${tx.amount?.toLocaleString()} was declined.`,
                            variant: "destructive",
                            className: "notification-bubble",
                        });
                    }
                }
            )
            .subscribe();

        // Subscribe to new complaint_messages (admin reply)
        const msgChannel = supabase
            .channel(`user-support-${profileId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'complaint_messages' },
                (payload) => {
                    const msg = payload.new as any;
                    // Only notify if it's an admin message (not the user's own)
                    if (msg.sender_id === '00000000-0000-0000-0000-000000000000') {
                        toast({
                            title: "💬 Support Reply",
                            description: "An admin has replied to your ticket. Open Support to view.",
                            className: "notification-bubble",
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(profileChannel);
            supabase.removeChannel(txChannel);
            supabase.removeChannel(msgChannel);
        };
    }, [profileId, toast]);
};
