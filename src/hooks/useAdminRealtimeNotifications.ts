import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Admin-side realtime notifications.
 * Call inside AdminLayout.
 */
export const useAdminRealtimeNotifications = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        // New deposit or withdrawal submitted
        const txChannel = supabase
            .channel('admin-transactions')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'transactions' },
                (payload) => {
                    const tx = payload.new as any;
                    if (tx.type === 'deposit' && !tx.metadata?.clearance_step) {
                        toast({
                            title: "🏦 New Deposit Request",
                            description: `A user has submitted a new deposit of ${tx.amount?.toLocaleString()}.`,
                            className: "notification-bubble deposit-bubble",
                        });
                    } else if (tx.type === 'withdrawal') {
                        toast({
                            title: "💸 New Withdrawal Request",
                            description: `A user has requested a withdrawal of ${tx.amount?.toLocaleString()}.`,
                            className: "notification-bubble",
                        });
                    } else if (tx.metadata?.clearance_step) {
                        toast({
                            title: `🔐 Clearance Step ${tx.metadata.clearance_step} Submitted`,
                            description: "A user has paid a clearance fee and awaits your approval.",
                            className: "notification-bubble",
                        });
                    }
                    queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
                }
            )
            .subscribe();

        // New support ticket opened
        const complaintChannel = supabase
            .channel('admin-complaints')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'complaints' },
                (payload) => {
                    const c = payload.new as any;
                    toast({
                        title: "🎫 New Support Ticket",
                        description: `A user opened a ticket: "${c.subject}"`,
                        className: "notification-bubble",
                    });
                    queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
                }
            )
            .subscribe();

        // New user message on a complaint
        const msgChannel = supabase
            .channel('admin-complaint-messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'complaint_messages' },
                (payload) => {
                    const msg = payload.new as any;
                    // Only notify if it's NOT an admin message
                    if (msg.sender_id !== '00000000-0000-0000-0000-000000000000') {
                        toast({
                            title: "💬 New User Message",
                            description: "A user replied in a support ticket.",
                            className: "notification-bubble",
                        });
                        queryClient.invalidateQueries({ queryKey: ['complaint-messages'] });
                    }
                }
            )
            .subscribe();

        // KYC submission
        const kycChannel = supabase
            .channel('admin-kyc')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles' },
                (payload) => {
                    const newRow = payload.new as any;
                    const oldRow = payload.old as any;
                    if (newRow.kyc_status === 'pending' && oldRow.kyc_status !== 'pending') {
                        toast({
                            title: "🪪 New KYC Submission",
                            description: `${newRow.display_name || 'A user'} submitted their identity for verification.`,
                            className: "notification-bubble",
                        });
                        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(txChannel);
            supabase.removeChannel(complaintChannel);
            supabase.removeChannel(msgChannel);
            supabase.removeChannel(kycChannel);
        };
    }, [toast, queryClient]);
};
