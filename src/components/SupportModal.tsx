import React, { useState, useRef, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getUserComplaints, createComplaint,
    getComplaintMessages, sendUserComplaintMessage,
    Complaint, ComplaintMessage
} from "@/lib/storage";
import {
    MessageSquare, Plus, ChevronLeft, Send,
    CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SupportModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onOpenChange }) => {
    const { profile } = useAuth();
    const { language } = useLanguage();
    const t = translations[language];
    const supportT = t.support;
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [view, setView] = useState<'list' | 'chat' | 'new'>('list');
    const [activeTicket, setActiveTicket] = useState<Complaint | null>(null);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['user-complaints', profile?.id],
        queryFn: () => getUserComplaints(profile!.id),
        enabled: !!profile?.id && isOpen
    });

    const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
        queryKey: ['complaint-messages', activeTicket?.id],
        queryFn: () => getComplaintMessages(activeTicket!.id),
        enabled: !!activeTicket?.id,
        refetchInterval: 5000 // Poll every 5s for new admin replies
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const createTicketMutation = useMutation({
        mutationFn: () => createComplaint(profile!.id, subject),
        onSuccess: (ticket) => {
            queryClient.invalidateQueries({ queryKey: ['user-complaints'] });
            toast({ title: supportT.ticketOpened, description: supportT.ticketOpenedDesc });
            setActiveTicket(ticket);
            setSubject('');
            setView('chat');
        },
        onError: (e: any) => {
            toast({ title: supportT.error, description: e.message, variant: "destructive" });
        }
    });

    const sendMessageMutation = useMutation({
        mutationFn: () => sendUserComplaintMessage(activeTicket!.id, message),
        onSuccess: () => {
            setMessage('');
            queryClient.invalidateQueries({ queryKey: ['complaint-messages', activeTicket?.id] });
        },
        onError: (e: any) => {
            toast({ title: supportT.error, description: e.message, variant: "destructive" });
        }
    });

    const resetAndClose = () => {
        setView('list');
        setActiveTicket(null);
        setSubject('');
        setMessage('');
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="glass border-border/50 max-w-lg flex flex-col max-h-[85vh]">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="font-display text-xl flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        {supportT.title}
                    </DialogTitle>
                    <DialogDescription>
                        {view === 'list' && supportT.listSubtitle}
                        {view === 'new' && supportT.newSubtitle}
                        {view === 'chat' && `${supportT.ticketLabel}: ${activeTicket?.subject}`}
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {/* TICKET LIST VIEW */}
                    {view === 'list' && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col gap-4 flex-1 overflow-hidden"
                        >
                            <Button
                                onClick={() => setView('new')}
                                className="w-full gap-2 shrink-0"
                            >
                                <Plus className="w-4 h-4" /> {supportT.openNewTicket}
                            </Button>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                {isLoading ? (
                                    <div className="text-center py-10 text-muted-foreground flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> {supportT.loadingTickets}
                                    </div>
                                ) : tickets.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-border/50">
                                            <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                        <p className="text-muted-foreground italic text-sm">{supportT.noTickets}</p>
                                        <p className="text-muted-foreground/60 text-xs mt-1">{supportT.noTicketsDesc}</p>
                                    </div>
                                ) : tickets.map(ticket => (
                                    <motion.button
                                        key={ticket.id}
                                        onClick={() => { setActiveTicket(ticket); setView('chat'); }}
                                        className="w-full text-left p-4 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all group flex items-center justify-between"
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${ticket.status === 'open' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-primary/10 text-primary'}`}>
                                                {ticket.status === 'open'
                                                    ? <AlertCircle className="w-4 h-4" />
                                                    : <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-foreground">{ticket.subject}</div>
                                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                                    {new Date(ticket.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] font-bold capitalize ${ticket.status === 'open'
                                                ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'
                                                : 'border-primary/30 text-primary bg-primary/10'}`}
                                        >
                                            {ticket.status}
                                        </Badge>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* NEW TICKET VIEW */}
                    {view === 'new' && (
                        <motion.div
                            key="new"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col gap-5"
                        >
                            <div className="space-y-2">
                                <Label>{supportT.subjectLabel}</Label>
                                <Input
                                    placeholder={supportT.subjectPlaceholder}
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="bg-background/40"
                                    onKeyDown={e => e.key === 'Enter' && subject.trim() && createTicketMutation.mutate()}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    {supportT.subjectDesc}
                                </p>
                            </div>

                            <div className="flex gap-3 mt-2">
                                <Button variant="ghost" onClick={() => setView('list')} className="gap-2">
                                    <ChevronLeft className="w-4 h-4" /> {supportT.back}
                                </Button>
                                <Button
                                    className="flex-1 gap-2"
                                    disabled={!subject.trim() || createTicketMutation.isPending}
                                    onClick={() => createTicketMutation.mutate()}
                                >
                                    {createTicketMutation.isPending
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> {supportT.opening}</>
                                        : <><Plus className="w-4 h-4" /> {supportT.openTicket}</>}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* CHAT VIEW */}
                    {view === 'chat' && activeTicket && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col flex-1 min-h-0"
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setView('list'); setActiveTicket(null); }}
                                className="gap-2 self-start mb-3 -ml-2 text-muted-foreground"
                            >
                                <ChevronLeft className="w-4 h-4" /> {supportT.allTickets}
                            </Button>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-muted/5 rounded-xl border border-border/20 min-h-[250px] max-h-[350px]">
                                {isLoadingMessages ? (
                                    <div className="text-center py-10 text-muted-foreground flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> {supportT.loading}
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground/60 text-sm italic">
                                        {supportT.noMessages}
                                    </div>
                                ) : messages.map(msg => {
                                    const isAdmin = msg.sender_id === '00000000-0000-0000-0000-000000000000';
                                    return (
                                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isAdmin
                                                ? 'bg-muted border border-border/30 rounded-tl-none text-foreground'
                                                : 'bg-primary text-primary-foreground rounded-tr-none'}`}>
                                                {isAdmin && (
                                                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">{supportT.supportAgent}</div>
                                                )}
                                                <p>{msg.message}</p>
                                                <div className={`text-[10px] mt-1 opacity-60 ${isAdmin ? 'text-left' : 'text-right'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            {activeTicket.status === 'open' ? (
                                <div className="flex gap-2 mt-3">
                                    <Input
                                        placeholder={supportT.typeMessage}
                                        className="bg-background/80"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && message.trim() && sendMessageMutation.mutate()}
                                    />
                                    <Button
                                        size="icon"
                                        disabled={!message.trim() || sendMessageMutation.isPending}
                                        onClick={() => sendMessageMutation.mutate()}
                                        className="shrink-0"
                                    >
                                        {sendMessageMutation.isPending
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Send className="w-4 h-4" />}
                                    </Button>
                                </div>
                            ) : (
                                <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/20 text-center text-sm text-muted-foreground">
                                    <CheckCircle2 className="w-4 h-4 text-primary inline-block mr-1.5" />
                                    {supportT.ticketResolved}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
};
