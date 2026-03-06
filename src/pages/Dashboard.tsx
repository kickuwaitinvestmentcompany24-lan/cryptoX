import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Save, Trash2, ArrowUpRight, ArrowDownRight, Clock, Users, Settings, MessageSquare,
  Wallet, CreditCard, Key, FileText, Edit3, Image as ImageIcon,
  CheckCircle2, XCircle, AlertCircle, Eye, Search, DollarSign,
  Sliders, Wrench, ListPlus, LayoutDashboard, TrendingUp, TrendingDown, Box, ShieldCheck,
  Calendar, Target, ArrowRight, PieChart, Menu
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOutletContext, useNavigate } from "react-router-dom";
import { DepositModal } from "@/components/DepositModal";
import { WithdrawalModal } from "@/components/WithdrawalModal";
import { X, Info, Edit2 } from "lucide-react";
import { updateProfile, getTransactions, getInvestmentPlans, getActiveInvestments, investInPlan, ActiveInvestment, InvestmentPlan, Transaction } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { translations } from "@/lib/translations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EditProfileModal } from "@/components/EditProfileModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { language } = useLanguage();
  const t = translations[language].dashboard;
  const kycT = translations[language].kyc;
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setIsMobileSidebarOpen } = useOutletContext<any>() || { setIsMobileSidebarOpen: () => { } };
  const queryClient = useQueryClient();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(() => localStorage.getItem("isDepositModalOpen") === "true");
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(() => localStorage.getItem("isWithdrawalModalOpen") === "true");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  React.useEffect(() => {
    localStorage.setItem("isDepositModalOpen", isDepositModalOpen.toString());
  }, [isDepositModalOpen]);

  React.useEffect(() => {
    localStorage.setItem("isWithdrawalModalOpen", isWithdrawalModalOpen.toString());
  }, [isWithdrawalModalOpen]);
  const [isInvestConfirmOpen, setIsInvestConfirmOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [isInvesting, setIsInvesting] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const parseWithdrawalDetails = (receiptUrl: string | null) => {
    if (!receiptUrl) return null;
    // Clearance payments have regular URLs, actual withdrawals have JSON strings
    if (receiptUrl.startsWith('http')) return null;
    try {
      return JSON.parse(receiptUrl);
    } catch (e) {
      return { details: receiptUrl };
    }
  };

  // Fetch transactions for the chart
  const { data: allTransactions = [] } = useQuery({
    queryKey: ['all-transactions', profile?.id],
    queryFn: () => getTransactions(profile?.id),
    enabled: !!profile?.id
  });

  const { data: activeInvestments = [], refetch: refetchActive } = useQuery({
    queryKey: ['active-investments', profile?.id],
    queryFn: () => getActiveInvestments(profile!.id),
    enabled: !!profile?.id
  });

  const { data: availablePlans = [] } = useQuery({
    queryKey: ['investment-plans'],
    queryFn: getInvestmentPlans
  });

  const pendingDeposit = allTransactions.find(tx => tx.type === 'deposit' && tx.status === 'pending');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const balance = profile?.balance || 0;
  const investment = profile?.investment || 0;
  const profit = profile?.profit || 0;

  // Process chart data
  const processedChartData = React.useMemo(() => {
    const approved = allTransactions
      .filter(tx => tx.status === 'approved')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const accountCreated = profile?.created_at ? new Date(profile.created_at).getTime() : Date.now() - (7 * 24 * 60 * 60 * 1000);
    const currentTotal = balance + investment + profit;

    if (approved.length === 0) {
      // If no transactions but we have a balance/profit, show growth from creation
      return [
        {
          month: new Date(accountCreated).toLocaleDateString(language, { month: 'short', day: 'numeric' }),
          value: 0,
          timestamp: accountCreated
        },
        {
          month: t.today,
          value: currentTotal,
          timestamp: Date.now()
        }
      ];
    }

    let runningTotal = 0;
    const data = approved.map(tx => {
      if (tx.type === 'deposit') runningTotal += tx.amount;
      else runningTotal -= tx.amount;

      const date = new Date(tx.created_at);
      return {
        month: date.toLocaleDateString(language, { month: 'short', day: 'numeric' }),
        value: runningTotal,
        timestamp: date.getTime()
      };
    });

    // Ensure we start from creation if it's before the first transaction
    if (data[0].timestamp > accountCreated + (1000 * 60 * 60)) { // More than 1 hour difference
      data.unshift({
        month: new Date(accountCreated).toLocaleDateString(language, { month: 'short', day: 'numeric' }),
        value: 0,
        timestamp: accountCreated
      });
    }

    // Add today's total if it's different from the last transaction (captures profit growth)
    if (Math.abs(data[data.length - 1].value - currentTotal) > 0.01) {
      data.push({
        month: t.today,
        value: currentTotal,
        timestamp: Date.now()
      });
    }

    return data;
  }, [allTransactions, balance, investment, profit, language, t.today, profile?.created_at]);


  const summaryCards = [
    {
      title: t.totalBalance,
      value: `${profile?.currency || 'USD'} ${balance.toLocaleString()}`,
      change: "+0.0%",
      positive: true,
      icon: Wallet
    },
    {
      title: t.totalInvestment,
      value: `${profile?.currency || 'USD'} ${investment.toLocaleString()} `,
      change: "+0.0%",
      positive: true,
      icon: PieChart
    },
    {
      title: t.totalProfit,
      value: `${profile?.currency || 'USD'} ${profit.toLocaleString()} `,
      change: "+0.0%",
      positive: true,
      icon: TrendingUp
    },
  ];

  // For real data, we might want to fetch real holdings from a table. 
  // If no table exists, we show a 'No active investments' state.
  const handleInvest = async () => {
    if (!selectedPlan || !investAmount || !profile) return;
    const amount = parseFloat(investAmount);
    if (isNaN(amount) || amount < selectedPlan.min_amount || amount > selectedPlan.max_amount) {
      toast({
        title: t.invalidAmountInvest,
        description: t.invalidAmountInvestDesc
          .replace("{min}", selectedPlan.min_amount.toString())
          .replace("{max}", selectedPlan.max_amount.toString()),
        variant: "destructive"
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: t.insufficientBalance,
        description: t.insufficientBalanceDesc,
        variant: "destructive"
      });
      return;
    }

    setIsInvesting(true);
    try {
      await investInPlan(profile.id, selectedPlan, amount);
      toast({
        title: t.investmentSuccessful,
        description: t.investmentSuccessfulDesc.replace("{planName}", selectedPlan.name)
      });
      setIsInvestConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['active-investments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (error: any) {
      toast({
        title: t.investmentFailed,
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsInvesting(false);
    }
  };

  const ActiveInvestmentCounter = ({ investment }: { investment: ActiveInvestment }) => {
    const [stats, setStats] = useState({
      accumulated: 0,
      progress: 0,
      isCompleted: false
    });

    React.useEffect(() => {
      const update = () => {
        const start = new Date(investment.start_time).getTime();
        const end = new Date(investment.end_time).getTime();
        const now = Date.now();
        const totalDuration = end - start;
        const elapsed = Math.max(0, now - start);

        if (now >= end) {
          setStats({
            accumulated: investment.expected_total_profit,
            progress: 100,
            isCompleted: true
          });
          return;
        }

        const progressPercent = (elapsed / totalDuration) * 100;
        const currentProfit = (investment.expected_total_profit * elapsed) / totalDuration;

        setStats({
          accumulated: currentProfit,
          progress: progressPercent,
          isCompleted: false
        });
      };

      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }, [investment]);

    return (
      <div className="p-5 rounded-2xl bg-muted/20 border border-border/30 group hover:border-primary/30 transition-all space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="font-bold text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {investment.plan_name}
              {stats.isCompleted && <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] h-4 uppercase">{t.completed}</Badge>}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 w-fit px-2 py-0.5 rounded-md border border-border/20">
              <Target className="w-3 h-3 text-primary/60" />
              <span>{t.principal}: <span className="text-foreground font-semibold">{profile?.currency} {investment.amount.toLocaleString()}</span></span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono font-bold text-primary text-base leading-none mb-1">
              +{profile?.currency} {stats.accumulated.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </div>
            <div className="text-[10px] uppercase text-muted-foreground tracking-widest font-bold flex items-center justify-end gap-1">
              {t.liveProfit} <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/10">
          <div className="space-y-1">
            <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {t.startDate}
            </div>
            <div className="text-xs font-medium text-foreground">
              {new Date(investment.start_time).toLocaleDateString(language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest flex items-center justify-end gap-1">
              {t.endDate} <Target className="w-3 h-3" />
            </div>
            <div className="text-xs font-medium text-foreground">
              {new Date(investment.end_time).toLocaleDateString(language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">{t.totalExpectedProfit}</div>
              <div className="text-sm font-bold text-primary/80">
                {profile?.currency} {investment.expected_total_profit.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">{t.progress}</div>
              <div className="text-sm font-mono font-bold text-foreground">{stats.progress.toFixed(2)}%</div>
            </div>
          </div>
          <Progress value={stats.progress} className="h-2 bg-primary/10 rounded-full" />
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 w-full max-w-7xl mx-auto">
      <DepositModal
        isOpen={isDepositModalOpen}
        onOpenChange={setIsDepositModalOpen}
      />
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onOpenChange={setIsWithdrawalModalOpen}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
      />
      <SupportModal
        isOpen={isSupportModalOpen}
        onOpenChange={setIsSupportModalOpen}
      />

      {profile?.kyc_status === 'rejected' && profile?.show_kyc_notification && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <Alert variant="destructive" className="glass-strong border-destructive/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                onClick={async () => {
                  try {
                    await updateProfile(profile.user_id, { show_kyc_notification: false });
                    await refreshProfile();
                  } catch (error) {
                    console.error("Failed to dismiss notification:", error);
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-display font-bold text-lg mb-1">
              {kycT.failed}
            </AlertTitle>
            <AlertDescription className="pr-10">
              <p className="mb-4 text-destructive-foreground/90">
                {profile.kyc_rejection_reason || kycT.failedDesc}
              </p>
              <Button
                size="sm"
                variant="destructive"
                className="font-bold glow-emerald"
                onClick={() => navigate("/kyc")}
              >
                {kycT.reSubmission}
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {pendingDeposit && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6"
        >
          <Alert className="glass-strong border-primary/30 relative overflow-hidden bg-primary/5">
            <Info className="h-5 w-5 text-primary" />
            <AlertTitle className="font-display font-bold text-lg mb-1 text-primary">
              {t.pendingDeposit}
            </AlertTitle>
            <AlertDescription>
              <p className="text-foreground/80">
                {t.pendingDepositDesc
                  .replace('{currency}', profile?.currency || 'USD')
                  .replace('{amount}', pendingDeposit.amount.toLocaleString())
                }
              </p>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="md:hidden flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="h-10 w-10 bg-primary/10 text-primary border border-primary/20"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground rtl:text-right">
              {t.title}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditProfileOpen(true)}
              className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
              title={translations[language].editProfile?.title || "Edit Profile"}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            <Button
              onClick={() => setIsDepositModalOpen(true)}
              className="flex-1 sm:flex-none justify-center bg-primary hover:bg-primary/90 glow-emerald font-bold gap-2 px-4 md:px-6 h-11 md:h-12"
            >
              <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
              {t.deposit}
            </Button>
            <Button
              onClick={() => setIsWithdrawalModalOpen(true)}
              variant="outline"
              className="flex-1 sm:flex-none justify-center border-primary/50 hover:bg-primary/10 text-primary font-bold gap-2 px-4 md:px-6 h-11 md:h-12"
            >
              <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5" />
              {t.withdraw}
            </Button>
            <Button
              onClick={() => {
                const plansSection = document.getElementById('explore-plans');
                plansSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto justify-center bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-bold gap-2 px-4 md:px-6 h-11 md:h-12"
            >
              <Box className="w-4 h-4 md:w-5 md:h-5" />
              {t.explorePlans}
            </Button>
            <Button
              onClick={() => setIsSupportModalOpen(true)}
              variant="outline"
              className="w-full sm:w-auto justify-center border-border/50 hover:bg-muted/20 gap-2 px-4 md:px-5 h-11 md:h-12"
            >
              <MessageSquare className="w-4 h-4" />
              {t.support}
            </Button>
          </div>
        </div>
        <p className="text-sm md:text-base text-muted-foreground mb-8 rtl:text-right">
          {t.welcome}
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass relative group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 border-primary/10">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <card.icon className="w-12 h-12 text-primary" />
              </div>
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <card.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border-none ${card.positive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {card.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {card.change}
                  </Badge>
                </div>
                <div className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">{card.value}</div>
                <div className="text-xs md:text-sm font-medium text-muted-foreground mt-1">{card.title}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Explore Investment Plans */}
      <motion.div
        id="explore-plans"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-bold">{t.explorePlans}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availablePlans.filter(p => !p.end_time || new Date(p.end_time) > new Date()).map((plan) => (
            <Card key={plan.id} className="glass group hover:border-primary/50 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="font-display font-bold text-lg">{plan.name}</CardTitle>
                <CardDescription className="text-xs">
                  {plan.duration} {t.days} · {plan.daily_profit}% {translations[language].sidebar.daily}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t.returns}</div>
                    <div className="text-xl font-bold text-primary">
                      {((plan.daily_profit * plan.duration)).toFixed(0)}% {t.roi}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t.minMax}</div>
                    <div className="text-sm font-medium">
                      {profile?.currency} {plan.min_amount} - {plan.max_amount}
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold border border-primary/20"
                  onClick={() => {
                    setSelectedPlan(plan);
                    setInvestAmount(plan.min_amount.toString());
                    setIsInvestConfirmOpen(true);
                  }}
                >
                  {t.investNow}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chart Area */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass h-full border-border/20 shadow-xl">
            <CardHeader>
              <CardTitle className="font-display text-lg font-bold flex items-center gap-2 rtl:text-right">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t.portfolioGrowth}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedChartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(v) => `${profile?.currency || 'USD'} ${(v / 1000).toFixed(0)} k`}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border) / 0.5)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        padding: "12px"
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                      labelStyle={{ opacity: 0.7, marginBottom: "4px" }}
                      formatter={(value: number) => [`${profile?.currency || 'USD'} ${value.toLocaleString()} `, t.chartValue]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      strokeWidth={3}
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Holdings Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass h-full border-border/20 shadow-xl">
            <CardHeader>
              <CardTitle className="font-display text-lg font-bold flex items-center gap-2 rtl:text-right">
                <PieChart className="w-5 h-5 text-primary" />
                {t.activeInvestments}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeInvestments.length > 0 ? (
                  activeInvestments.map((inv) => (
                    <ActiveInvestmentCounter key={inv.id} investment={inv} />
                  ))
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-border/50">
                      <Box className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <h4 className="text-foreground font-bold mb-1">{t.noInvestments}</h4>
                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">{t.noInvestmentsDesc}</p>
                  </div>
                )}

                <Button
                  onClick={() => navigate("/plans")}
                  variant="outline"
                  className="w-full mt-4 h-12 rounded-xl border-primary/20 hover:bg-primary/5 text-primary font-bold">
                  {t.allHistory}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={isInvestConfirmOpen} onOpenChange={setIsInvestConfirmOpen}>
        <DialogContent className="glass border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">{t.confirmInvestment}</DialogTitle>
            <DialogDescription>
              {t.investNow} <b>{selectedPlan?.name}</b> {t.for} {selectedPlan?.duration} {t.days}.
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
                className="bg-background/50 font-mono text-lg"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                <span>Min: {selectedPlan?.min_amount}</span>
                <span>Max: {selectedPlan?.max_amount}</span>
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

      {/* Recent Transactions History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-bold">{t.recentTransactions}</h2>
          </div>
        </div>
        <Card className="glass border-border/20 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border/10 bg-muted/30">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.type}</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.amount}</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.status}</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.date}</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {allTransactions.slice(0, 10).map((tx) => (
                  <tr
                    key={tx.id}
                    className="group hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' :
                          tx.type === 'withdrawal' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-amber-500/10 text-amber-500'
                          }`}>
                          {tx.type === 'deposit' ? <ArrowUpRight className="w-4 h-4" /> :
                            tx.type === 'withdrawal' ? <ArrowDownRight className="w-4 h-4" /> :
                              <TrendingUp className="w-4 h-4" />}
                        </div>
                        <span className="font-bold capitalize text-sm">{tx.type}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-foreground text-sm">
                      {profile?.currency} {tx.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <Badge className={`text-[10px] uppercase px-2 py-0.5 rounded-full border shadow-none ${tx.status === 'approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        tx.status === 'rejected' ? "bg-destructive/10 text-destructive border-destructive/20" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString(language, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {allTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Transaction Details Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent className="glass border-border/50 max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t.transactionDetails}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="px-6 mt-1 text-xs">
            Review the specifics of this financial activity.
          </DialogDescription>
          {selectedTx && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <ShieldCheck className="w-20 h-20 text-primary" />
                </div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t.amount}</div>
                <div className="text-4xl font-display font-bold text-foreground">
                  {profile?.currency} {selectedTx.amount.toLocaleString()}
                </div>
                <Badge className={`mt-4 text-[10px] uppercase px-3 py-1 rounded-full border shadow-none ${selectedTx.status === 'approved' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  selectedTx.status === 'rejected' ? "bg-destructive/10 text-destructive border-destructive/20" :
                    "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  }`}>
                  {selectedTx.status}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-border/10">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t.type}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${selectedTx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' :
                      selectedTx.type === 'withdrawal' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                      {selectedTx.type === 'deposit' ? <ArrowUpRight className="w-3 h-3" /> :
                        selectedTx.type === 'withdrawal' ? <ArrowDownRight className="w-3 h-3" /> :
                          <TrendingUp className="w-3 h-3" />}
                    </div>
                    <span className="text-sm font-bold capitalize">{selectedTx.type}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/10">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t.date}</span>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Calendar className="w-4 h-4 text-primary/60" />
                    {new Date(selectedTx.created_at).toLocaleDateString(language, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                {selectedTx.type === 'withdrawal' && (
                  <>
                    {(() => {
                      const details = parseWithdrawalDetails(selectedTx.receipt_url);
                      if (!details) return null;
                      return (
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t.method}</span>
                            <div className="flex items-center gap-2 text-sm font-bold bg-muted/30 p-3 rounded-xl border border-border/10">
                              <CreditCard className="w-4 h-4 text-primary" />
                              {details.method || 'N/A'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t.accountDetails}</span>
                            <div className="text-sm font-medium bg-muted/30 p-4 rounded-xl border border-border/10 whitespace-pre-wrap break-all font-mono leading-relaxed">
                              {details.details || details}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}

                {selectedTx.rejection_reason && (
                  <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 mt-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-destructive tracking-widest mb-2">
                      <XCircle className="w-3 h-3" /> {t.rejectionReason}
                    </div>
                    <p className="text-sm text-foreground/80 font-medium leading-relaxed">{selectedTx.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="p-6 bg-muted/10 border-t border-border/10">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg shadow-primary/20" onClick={() => setSelectedTx(null)}>
              {t.close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
