import React, { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
    Wallet, CreditCard, Key, ShieldCheck,
    ChevronRight, ChevronLeft, AlertCircle, CheckCircle2,
    DollarSign, Info, Clock
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { useQuery } from "@tanstack/react-query";
import { getPlatformSettings, submitClearancePayment } from "@/lib/storage";
import { motion } from "framer-motion";

interface WithdrawalModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

type Step = 'details' | 'card' | 'activation' | 'code' | 'account' | 'success';

// IndexedDB logic for withdrawal file persistence
const DB_NAME = "withdrawal_file_db";
const STORE_NAME = "files";
const FILE_KEY = "current_withdrawal_receipt";

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                request.result.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onOpenChange }) => {
    const { profile, refreshProfile } = useAuth();
    const { language, isRTL } = useLanguage();
    const t = translations[language].withdrawal;
    const { toast } = useToast();

    // Persistent state keys
    const STORAGE_KEY_ACCOUNT = "withdrawal_draft_account";

    const [step, setStep] = useState<Step>('details');
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("");
    const [accountDetails, setAccountDetails] = useState(() => localStorage.getItem(STORAGE_KEY_ACCOUNT) || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receipt, setReceipt] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [jumpedOnOpen, setJumpedOnOpen] = useState(false);

    // Save/Restore File from IndexedDB
    useEffect(() => {
        const restoreFile = async () => {
            try {
                const db = await openDB();
                const tx = db.transaction(STORE_NAME, "readonly");
                const request = tx.objectStore(STORE_NAME).get(FILE_KEY);
                request.onsuccess = () => {
                    if (request.result instanceof File) {
                        setReceipt(request.result);
                    }
                };
            } catch (err) {
                console.error("Failed to restore withdrawal file:", err);
            }
        };

        if (isOpen) {
            restoreFile();
        }
    }, [isOpen]);

    const handleFileChange = async (newFile: File | null) => {
        setReceipt(newFile);
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, "readwrite");
            if (newFile) {
                tx.objectStore(STORE_NAME).put(newFile, FILE_KEY);
            } else {
                tx.objectStore(STORE_NAME).delete(FILE_KEY);
            }
        } catch (err) {
            console.error("Failed to sync withdrawal file:", err);
        }
    };

    const clearWithdrawalPersistence = async () => {
        localStorage.removeItem(STORAGE_KEY_ACCOUNT);
        localStorage.removeItem("isWithdrawalModalOpen");
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).delete(FILE_KEY);
        } catch (err) {
            console.error("Failed to clear withdrawal file:", err);
        }
    };

    // Save account details to localStorage
    useEffect(() => {
        if (isOpen) {
            localStorage.setItem(STORAGE_KEY_ACCOUNT, accountDetails);
        }
    }, [accountDetails, isOpen]);

    // Explicitly refresh profile when modal opens to get latest persistence data
    useEffect(() => {
        if (isOpen) {
            refreshProfile();
        }
    }, [isOpen]);

    // Auto-resume logic
    useEffect(() => {
        if (isOpen && profile && !jumpedOnOpen) {
            const currentStep = profile.withdrawal_step || 1;
            const cardStatus = profile.withdrawal_card_status;
            const activationStatus = profile.withdrawal_activation_status;
            const codeStatus = profile.withdrawal_code_status;

            if (cardStatus === 'pending') setStep('card');
            else if (activationStatus === 'pending') setStep('activation');
            else if (codeStatus === 'pending') setStep('code');
            else if (currentStep === 2) setStep('activation');
            else if (currentStep === 3) setStep('code');
            else if (currentStep > 3) setStep('account');

            if (profile.last_withdrawal_amount) {
                setAmount(profile.last_withdrawal_amount.toString());
            }
            if (profile.last_withdrawal_method) setMethod(profile.last_withdrawal_method);

            setJumpedOnOpen(true);
        }
        if (!isOpen) {
            setJumpedOnOpen(false);
        }
    }, [isOpen, profile, jumpedOnOpen]);

    const { data: settings = [] } = useQuery({
        queryKey: ['platform-settings'],
        queryFn: getPlatformSettings,
        enabled: isOpen
    });

    const getSetting = (key: string) => settings.find(s => s.key === key)?.value;

    const methods = getSetting('withdrawal_methods') || [];
    const cardStep = getSetting('withdrawal_card_payment');
    const activationStep = getSetting('withdrawal_activation_payment');
    const codeStep = getSetting('withdrawal_card_code_payment');

    const profit = profile?.profit || 0;

    const handleNext = async () => {
        if (step === 'details') {
            if (!method) {
                toast({ title: t.methodRequired, description: t.methodRequiredDesc, variant: "destructive" });
                return;
            }
            if (!amount || parseFloat(amount) <= 0) {
                toast({ title: t.invalidAmount || "Invalid Amount", description: t.invalidAmountDesc || "Please enter a valid amount.", variant: "destructive" });
                return;
            }
            if (parseFloat(amount) > profit) {
                toast({ title: t.insufficientProfit, description: t.insufficientProfitDesc, variant: "destructive" });
                return;
            }

            // Save choices to database for persistence
            await supabase.from('profiles').update({
                last_withdrawal_amount: parseFloat(amount),
                last_withdrawal_method: method
            }).eq('id', profile?.id);

            // Jump to current target step
            const currentStep = profile?.withdrawal_step || 1;
            if (currentStep === 1) setStep('card');
            else if (currentStep === 2) setStep('activation');
            else if (currentStep === 3) setStep('code');
            else setStep('account');
        } else if (step === 'card') setStep('activation');
        else if (step === 'activation') setStep('code');
        else if (step === 'code') setStep('account');
    };

    const handleBack = () => {
        if (step === 'card') setStep('details');
        else if (step === 'activation') setStep('card');
        else if (step === 'code') setStep('activation');
        else if (step === 'account') setStep('code');
    };

    const handleClearanceSubmit = async (stepNum: number, amount: number) => {
        if (!receipt) {
            toast({ title: t.receiptRequired || "Receipt Required", description: t.receiptRequiredDesc || "Please upload your payment receipt.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = receipt.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${profile?.user_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, receipt);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            await submitClearancePayment(profile!.id, stepNum, amount, publicUrl);

            toast({ title: t.verified || "Submitted", description: t.pendingVerification || "Your payment is now pending admin verification." });
            await handleFileChange(null);
            await refreshProfile();
        } catch (error: any) {
            toast({ title: t.submissionFailed, description: error.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!accountDetails.trim()) {
            toast({ title: t.detailsRequired, description: t.detailsRequiredDesc, variant: "destructive" });
            return;
        }

        let withdrawalAmount = parseFloat(amount);

        // Final fallback: if state is empty, try to get from profile
        if ((isNaN(withdrawalAmount) || withdrawalAmount <= 0) && profile?.last_withdrawal_amount) {
            withdrawalAmount = parseFloat(profile.last_withdrawal_amount.toString());
        }

        if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
            toast({ title: "Invalid Amount", description: "Your withdrawal amount could not be found. Please restart the request.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            // Deduct profit and clear persisted choices
            const newProfit = profit - withdrawalAmount;
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    profit: newProfit,
                    last_withdrawal_amount: null,
                    last_withdrawal_method: null
                })
                .eq('id', profile?.id);

            if (profileError) throw profileError;

            // Create transaction
            const { error: txError } = await supabase.from('transactions').insert({
                user_id: profile?.id,
                type: 'withdrawal',
                amount: withdrawalAmount,
                status: 'pending',
                receipt_url: `Method: ${method}\nDetails: ${accountDetails}`
            });

            if (txError) throw txError;

            await clearWithdrawalPersistence();
            setStep('success');
            await refreshProfile();
        } catch (error: any) {
            toast({ title: t.withdrawalFailed, description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetModal = async () => {
        // Clear database persistence when starting over or finishing
        await supabase.from('profiles').update({
            last_withdrawal_amount: null,
            last_withdrawal_method: null
        }).eq('id', profile?.id);

        await clearWithdrawalPersistence();
        setStep('details');
        setAmount("");
        setMethod("");
        setAccountDetails("");
        onOpenChange(false);
        await refreshProfile();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                clearWithdrawalPersistence();
            }
            onOpenChange(open);
        }}>
            <DialogContent className="glass max-w-md border-border/50">
                <DialogHeader className={isRTL ? "text-right" : "text-left"}>
                    <DialogTitle className="font-display text-xl flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-primary" />
                        {t.title}
                    </DialogTitle>
                    <DialogDescription>
                        {t.subtitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-4">
                    {(accountDetails || receipt || (profile?.last_withdrawal_amount && step === 'details')) && step !== 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 w-fit flex items-center gap-2 mx-auto mb-2"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Session recovered</span>
                        </motion.div>
                    )}

                    {step === 'details' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-1">
                                <Label className={`text-xs text-muted-foreground uppercase tracking-wider ${isRTL ? "text-right block" : "text-left"}`}>
                                    {t.availableProfit}
                                </Label>
                                <div className={`text-2xl font-mono font-bold text-primary ${isRTL ? "text-right" : "text-left"}`} style={isRTL ? { direction: 'ltr' } : {}}>
                                    {profile?.currency || 'USD'} {profit.toLocaleString()}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className={isRTL ? "text-right block" : ""}>{t.method}</Label>
                                    <Select value={method} onValueChange={setMethod}>
                                        <SelectTrigger className="bg-muted/30 border-border/50" dir={isRTL ? "rtl" : "ltr"}>
                                            <SelectValue placeholder={t.selectMethod} />
                                        </SelectTrigger>
                                        <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                                            {methods.map((m: any, idx: number) => {
                                                const methodName = typeof m === 'string' ? m : m.name;
                                                const methodId = typeof m === 'string' ? m : (m.id || idx.toString());
                                                return (
                                                    <SelectItem key={methodId} value={methodName}>{methodName}</SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className={isRTL ? "text-right block" : ""}>
                                        {t.amount.replace("{currency}", profile?.currency || "USD")}
                                    </Label>
                                    <div className="relative">
                                        <DollarSign className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className={`${isRTL ? "pr-10 text-right" : "pl-10"} bg-muted/30 border-border/50 font-mono text-lg`}
                                            style={isRTL ? { direction: 'ltr' } : {}}
                                        />
                                    </div>
                                    <p className={`text-[10px] text-muted-foreground italic ${isRTL ? "text-right" : ""}`}>
                                        {t.minWithdrawal.replace("{currency}", profile?.currency || "USD")}
                                    </p>
                                </div>
                            </div>

                            {profit <= 0 && (
                                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 flex gap-2">
                                    <AlertCircle className={`w-4 h-4 text-destructive shrink-0 mt-0.5 ${isRTL ? "ml-1" : ""}`} />
                                    <p className={`text-xs text-destructive ${isRTL ? "text-right" : ""}`}>
                                        {t.noProfitError}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'card' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <CreditCard className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="font-bold text-lg">{t.step1Title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t.step1Desc}
                                </p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-border/30">
                                    <span className={`text-sm font-medium ${isRTL ? "order-2" : ""}`}>{t.cardFee}</span>
                                    <span className={`font-mono font-bold text-primary ${isRTL ? "order-1" : ""}`} style={isRTL ? { direction: 'ltr' } : {}}>
                                        {profile?.currency} {cardStep?.amount || 0}
                                    </span>
                                </div>
                                <div className="space-y-2 text-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest block">{t.paymentDetails}</span>
                                    <p className="text-sm font-medium">{cardStep?.account_details}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className={`text-xs ${isRTL ? "text-right block" : ""}`}>{t.uploadReceipt}</Label>
                                <Input type="file" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} className="bg-muted/10 border-dashed" />

                                {profile?.withdrawal_card_status === 'pending' ? (
                                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-center gap-2 text-primary font-bold">
                                        <Clock className="w-4 h-4" /> {t.pendingVerification}
                                    </div>
                                ) : profile?.withdrawal_card_status === 'approved' ? (
                                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center justify-center gap-2 text-green-500 font-bold">
                                        <CheckCircle2 className="w-4 h-4" /> {t.verified}
                                    </div>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={() => handleClearanceSubmit(1, cardStep?.amount || 0)}
                                        disabled={isUploading || !receipt}
                                        className="w-full"
                                    >
                                        {isUploading ? t.processing || "Uploading..." : t.submit}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'activation' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <Key className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="font-bold text-lg">{t.step2Title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t.step2Desc}
                                </p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-border/30">
                                    <span className={`text-sm font-medium ${isRTL ? "order-2" : ""}`}>{t.keyFee}</span>
                                    <span className={`font-mono font-bold text-primary ${isRTL ? "order-1" : ""}`} style={isRTL ? { direction: 'ltr' } : {}}>
                                        {profile?.currency} {activationStep?.amount || 0}
                                    </span>
                                </div>
                                <div className="space-y-2 text-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest block">{t.paymentDetails}</span>
                                    <p className="text-sm font-medium">{activationStep?.account_details}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className={`text-xs ${isRTL ? "text-right block" : ""}`}>{t.uploadReceipt}</Label>
                                <Input type="file" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} className="bg-muted/10 border-dashed" />

                                {profile?.withdrawal_activation_status === 'pending' ? (
                                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-center gap-2 text-primary font-bold">
                                        <Clock className="w-4 h-4" /> {t.pendingVerification}
                                    </div>
                                ) : profile?.withdrawal_activation_status === 'approved' ? (
                                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center justify-center gap-2 text-green-500 font-bold">
                                        <CheckCircle2 className="w-4 h-4" /> {t.verified}
                                    </div>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={() => handleClearanceSubmit(2, activationStep?.amount || 0)}
                                        disabled={isUploading || !receipt}
                                        className="w-full"
                                    >
                                        {isUploading ? t.processing || "Uploading..." : t.submit}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'code' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="font-bold text-lg">{t.step3Title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t.step3Desc}
                                </p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-border/30">
                                    <span className={`text-sm font-medium ${isRTL ? "order-2" : ""}`}>{t.clearanceFee}</span>
                                    <span className={`font-mono font-bold text-primary ${isRTL ? "order-1" : ""}`} style={isRTL ? { direction: 'ltr' } : {}}>
                                        {profile?.currency} {codeStep?.amount || 0}
                                    </span>
                                </div>
                                <div className="space-y-2 text-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest block">{t.paymentDetails}</span>
                                    <p className="text-sm font-medium">{codeStep?.account_details}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className={`text-xs ${isRTL ? "text-right block" : ""}`}>{t.uploadReceipt}</Label>
                                <Input type="file" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} className="bg-muted/10 border-dashed" />

                                {profile?.withdrawal_code_status === 'pending' ? (
                                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-center gap-2 text-primary font-bold">
                                        <Clock className="w-4 h-4" /> {t.pendingVerification}
                                    </div>
                                ) : profile?.withdrawal_code_status === 'approved' ? (
                                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center justify-center gap-2 text-green-500 font-bold">
                                        <CheckCircle2 className="w-4 h-4" /> {t.verified}
                                    </div>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={() => handleClearanceSubmit(3, codeStep?.amount || 0)}
                                        disabled={isUploading || !receipt}
                                        className="w-full"
                                    >
                                        {isUploading ? t.processing || "Uploading..." : t.submit}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'account' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="space-y-2">
                                <Label className={isRTL ? "text-right block" : ""}>{t.accountDetailsTitle}</Label>
                                <Textarea
                                    placeholder={t.accountDetailsPlaceholder}
                                    className={`min-h-[120px] bg-muted/30 border-border/50 ${isRTL ? "text-right" : ""}`}
                                    value={accountDetails}
                                    onChange={(e) => setAccountDetails(e.target.value)}
                                    dir={isRTL ? "rtl" : "ltr"}
                                />
                                <p className={`text-[10px] text-muted-foreground ${isRTL ? "text-right" : ""}`}>
                                    {t.accountDetailsNote}
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-12 h-12 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">{t.successTitle}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t.successDesc
                                        .replace("{currency}", profile?.currency || "USD")
                                        .replace("{amount}", parseFloat(amount).toLocaleString())}
                                </p>
                            </div>
                            <Button type="button" onClick={resetModal} className="w-full mt-6">
                                {t.backToDashboard}
                            </Button>
                        </div>
                    )}
                </div>

                {step !== 'success' && (
                    <DialogFooter className="gap-2 sm:gap-0">
                        <div className={`flex justify-between w-full mt-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                            <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 'details'}>
                                {isRTL ? (
                                    <><ChevronRight className="w-4 h-4 ml-1" /> {t.back}</>
                                ) : (
                                    <><ChevronLeft className="w-4 h-4 mr-1" /> {t.back}</>
                                )}
                            </Button>
                            {step === 'account' ? (
                                <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="glow-emerald">
                                    {isSubmitting ? t.processing || "Submitting..." : t.submitWithdrawal}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={
                                        (step === 'card' && profile?.withdrawal_card_status !== 'approved') ||
                                        (step === 'activation' && profile?.withdrawal_activation_status !== 'approved') ||
                                        (step === 'code' && profile?.withdrawal_code_status !== 'approved')
                                    }
                                >
                                    {isRTL ? (
                                        <>{t.next} <ChevronLeft className="w-4 h-4 mr-1" /></>
                                    ) : (
                                        <>{t.next} <ChevronRight className="w-4 h-4 ml-1" /></>
                                    )}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};
