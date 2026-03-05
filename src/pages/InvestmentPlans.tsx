import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, Clock, Info, ChevronRight, Box, ArrowUpRight } from "lucide-react";
import { getInvestmentPlans, investInPlan, getActiveInvestments } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const InvestmentPlans = () => {
    const { profile, refreshProfile } = useAuth();
    const { language } = useLanguage();
    const t = translations[language].dashboard;
    const invT = translations[language].investment;
    const { toast } = useToast();

    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [investAmount, setInvestAmount] = useState("");
    const [isInvestConfirmOpen, setIsInvestConfirmOpen] = useState(false);
    const [isInvesting, setIsInvesting] = useState(false);

    const { data: availablePlans = [] } = useQuery({
        queryKey: ["investmentPlans"],
        queryFn: getInvestmentPlans,
    });

    const handleInvest = async () => {
        if (!profile || !selectedPlan || !investAmount) return;

        const amount = parseFloat(investAmount);
        if (isNaN(amount) || amount < selectedPlan.min_amount || amount > selectedPlan.max_amount) {
            toast({
                title: "Invalid Amount",
                description: `Please enter an amount between ${selectedPlan.min_amount} and ${selectedPlan.max_amount}`,
                variant: "destructive",
            });
            return;
        }

        if (amount > (profile.balance || 0)) {
            toast({
                title: "Insufficient Balance",
                description: "You do not have enough funds to complete this investment.",
                variant: "destructive",
            });
            return;
        }

        setIsInvesting(true);
        try {
            await investInPlan(profile.id, selectedPlan, amount);
            toast({
                title: "Investment Successful",
                description: `You have successfully invested ${profile.currency} ${amount} in ${selectedPlan.name}.`,
            });
            setIsInvestConfirmOpen(false);
            refreshProfile();
        } catch (error) {
            console.error("Investment failed:", error);
            toast({
                title: "Investment Failed",
                description: "An error occurred while processing your investment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsInvesting(false);
        }
    };

    const activePlans = availablePlans.filter(p => !p.end_time || new Date(p.end_time) > new Date());

    return (
        <div className="container px-4 py-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 text-center"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                    <TrendingUp className="w-3 h-3" />
                    {invT.title}
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                    {invT.subtitle}
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Choose from our expertly curated investment strategies designed to maximize your returns while maintaining institutional-grade security.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activePlans.map((plan, i) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="glass group hover:border-primary/50 transition-all duration-300 h-full flex flex-col overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />

                            <CardHeader className="relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    {plan.daily_profit >= 5 && (
                                        <span className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-tighter">
                                            Hot Pick
                                        </span>
                                    )}
                                </div>
                                <CardTitle className="font-display font-bold text-2xl group-hover:text-primary transition-colors">
                                    {plan.name}
                                </CardTitle>
                                <CardDescription className="text-sm font-medium">
                                    {plan.duration} {invT.days} · {plan.daily_profit}% {invT.daily}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6 flex-grow relative">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-2xl bg-muted/20 border border-border/10">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Total ROI</div>
                                        <div className="text-2xl font-bold text-primary">
                                            {((plan.daily_profit * plan.duration)).toFixed(0)}%
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-muted/20 border border-border/10">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Risk Level</div>
                                        <div className="text-sm font-bold text-foreground">
                                            Low to Medium
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">{invT.min}</span>
                                        <span className="font-bold">{profile?.currency} {plan.min_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">{invT.max}</span>
                                        <span className="font-bold">{profile?.currency} {plan.max_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Payout Type</span>
                                        <span className="font-bold">Daily Auto-credit</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-12 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold border border-primary/20 mt-4 glow-emerald transition-all"
                                    onClick={() => {
                                        setSelectedPlan(plan);
                                        setInvestAmount(plan.min_amount.toString());
                                        setIsInvestConfirmOpen(true);
                                    }}
                                >
                                    <ArrowUpRight className="w-4 h-4 mr-2" />
                                    {invT.select}
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Dialog open={isInvestConfirmOpen} onOpenChange={setIsInvestConfirmOpen}>
                <DialogContent className="glass border-border/50">
                    <DialogHeader>
                        <DialogTitle className="font-display">{t.confirmInvestment}</DialogTitle>
                        <DialogDescription>
                            {t.investNow} <b>{selectedPlan?.name}</b> {language === 'ar' ? 'لـ' : 'for'} {selectedPlan?.duration} {t.days}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t.investmentAmount} ({profile?.currency})</Label>
                            <Input
                                type="number"
                                min={selectedPlan?.min_amount}
                                max={selectedPlan?.max_amount}
                                value={investAmount}
                                onChange={(e) => setInvestAmount(e.target.value)}
                                className="bg-background/50 font-mono text-lg h-12"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                                <span>{invT.min}: {selectedPlan?.min_amount}</span>
                                <span>{invT.max}: {selectedPlan?.max_amount}</span>
                            </div>
                        </div>
                        {investAmount && !isNaN(parseFloat(investAmount)) && (
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t.expectedProfit}:</span>
                                    <span className="font-bold text-primary">+{profile?.currency} {(parseFloat(investAmount) * (selectedPlan?.daily_profit || 0) / 100 * (selectedPlan?.duration || 0)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t.totalPayout}:</span>
                                    <span className="font-bold text-primary">{profile?.currency} {(parseFloat(investAmount) + (parseFloat(investAmount) * (selectedPlan?.daily_profit || 0) / 100 * (selectedPlan?.duration || 0))).toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInvestConfirmOpen(false)}>{t.cancel}</Button>
                        <Button
                            onClick={handleInvest}
                            disabled={isInvesting || !investAmount || parseFloat(investAmount) < (selectedPlan?.min_amount || 0)}
                            className="bg-primary hover:bg-primary/90 glow-emerald min-w-[120px]"
                        >
                            {isInvesting ? <Clock className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                            {t.investNow}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default InvestmentPlans;
