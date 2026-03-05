import React, { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, AlertCircle, CheckCircle2, FileText, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { getPlatformSettings, DepositMethod } from "@/lib/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

interface DepositModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onOpenChange }) => {
    const { profile, refreshProfile } = useAuth();
    const { language, isRTL } = useLanguage();
    const t = translations[language].deposit;
    const { toast } = useToast();
    const navigate = useNavigate();
    const [amount, setAmount] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [methods, setMethods] = useState<DepositMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<DepositMethod | null>(null);
    const [copied, setCopied] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            getPlatformSettings().then(settings => {
                const depositMethods = settings.find(s => s.key === 'deposit_methods')?.value || [];
                setMethods(depositMethods.filter((m: DepositMethod) => m.is_active));
            });
        }
    }, [isOpen]);

    const handleCopyInput = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyAddress = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
    };

    const isVerified = profile?.kyc_status === 'approved';

    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast({ title: t.invalidAmount, description: t.invalidAmountDesc, variant: "destructive" });
            return;
        }
        if (!file) {
            toast({ title: t.receiptRequired, description: t.receiptRequiredDesc, variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const fileExt = file.name.split(".").pop();
            const filePath = `${profile?.user_id}/deposit-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("receipts")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("receipts")
                .getPublicUrl(filePath);

            const { error: txError } = await supabase.from("transactions").insert({
                user_id: profile?.id,
                type: "deposit",
                amount: parseFloat(amount),
                status: "pending",
                receipt_url: publicUrl
            });

            if (txError) throw txError;

            toast({
                title: t.success,
                description: t.successDesc
            });

            onOpenChange(false);
            setAmount("");
            setFile(null);
            await refreshProfile();
        } catch (error: any) {
            toast({ title: "Deposit Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="glass max-w-md border-border/50">
                <DialogHeader className={isRTL ? "text-right" : "text-left"}>
                    <DialogTitle className="font-display text-xl flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                        {t.title}
                    </DialogTitle>
                    <DialogDescription>
                        {t.subtitle}
                    </DialogDescription>
                </DialogHeader>

                {!isVerified ? (
                    <div className="py-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg">{t.kycRequired}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t.kycRequiredDesc}
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                onOpenChange(false);
                                navigate("/kyc");
                            }}
                            className="w-full bg-primary hover:bg-primary/90"
                        >
                            {t.verifyNow}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 py-4 overflow-y-auto max-h-[65vh] pr-1 custom-scrollbar">
                        <div className="space-y-2">
                            <Label className={isRTL ? "text-right block" : ""}>
                                {t.amountLabel.replace("{currency}", profile?.currency || "USD")}
                            </Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-muted/30 border-border/50 font-mono text-lg"
                                style={isRTL ? { direction: 'ltr', textAlign: 'right' } : {}}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className={isRTL ? "text-right block" : ""}>{t.methodLabel}</Label>
                            <Select onValueChange={(val) => setSelectedMethod(methods.find(m => m.id === val) || null)}>
                                <SelectTrigger className="bg-muted/30 border-border/50">
                                    <SelectValue placeholder={t.selectMethod} />
                                </SelectTrigger>
                                <SelectContent className="glass">
                                    {methods.map((method) => (
                                        <SelectItem key={method.id} value={method.id}>
                                            {method.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedMethod && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4"
                            >
                                {selectedMethod.instructions && (
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">{t.instructionsLabel}</Label>
                                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                                            {selectedMethod.instructions}
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">{t.detailsLabel}</Label>
                                    <div className="flex items-center gap-2 group">
                                        <div className="flex-1 bg-background/50 p-2 rounded border border-border/50 font-mono text-sm break-all">
                                            {selectedMethod.details}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all"
                                            onClick={() => handleCopyInput(selectedMethod.details)}
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {selectedMethod.account_number && (
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Account / Wallet Address</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-background/80 px-3 py-2.5 rounded-lg border border-primary/30 font-mono text-sm break-all leading-relaxed select-all">
                                                {selectedMethod.account_number}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-9 w-9 shrink-0 transition-all ${copiedAddress
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'hover:bg-primary/10 hover:text-primary'
                                                    }`}
                                                onClick={() => handleCopyAddress(selectedMethod.account_number!)}
                                                title="Copy address"
                                            >
                                                {copiedAddress
                                                    ? <Check className="w-4 h-4" />
                                                    : <Copy className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Click the copy icon or select the text above to copy.
                                        </p>
                                    </div>
                                )}


                            </motion.div>
                        )}

                        <div className="space-y-2">
                            <Label className={isRTL ? "text-right block" : ""}>{t.receiptLabel}</Label>
                            <div
                                className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
                                onClick={() => document.getElementById('receipt-upload')?.click()}
                            >
                                <input
                                    id="receipt-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                                />
                                {file ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                                            <X className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">{t.uploadDesc}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
                            <Button
                                onClick={handleDeposit}
                                className="bg-primary hover:bg-primary/90 glow-emerald"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t.processing : t.submit}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
