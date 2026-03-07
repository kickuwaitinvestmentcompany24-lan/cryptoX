import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus, Save, Trash2, ArrowUpRight, ArrowDownRight, Clock, Users, Settings, MessageSquare,
  Wallet, CreditCard, Key, FileText, Edit3, Image as ImageIcon,
  CheckCircle2, XCircle, AlertCircle, Eye, Search, DollarSign,
  Sliders, Wrench, ListPlus, LayoutDashboard, TrendingUp, TrendingDown, Box, ShieldCheck,
  Coins, Edit, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAboutUs,
  saveAboutUs,
  getInvestmentPlans,
  deleteInvestmentPlan,
  saveInvestmentPlan,
  getProfiles,
  updateProfile,
  getTransactions,
  updateTransactionStatus,
  approveDeposit,
  getPlatformSettings,
  updatePlatformSetting,
  getComplaints,
  getComplaintMessages,
  sendComplaintMessage,
  resolveComplaint,
  approveClearancePayment,
  approveWithdrawal,
  rejectWithdrawal,
  Profile,
  Transaction,
  Complaint,
  InvestmentPlan,
  PlatformSetting,
  AboutUs as AboutUsType,
  DepositMethod,
  Currency,
  getCurrencies,
  saveCurrency,
  deleteCurrency,
} from "@/lib/storage";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import AdminLayout from "@/components/AdminLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeUser, setActiveUser] = useState<Profile | null>(null);
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const navigate = useNavigate();
  const { startImpersonation } = useAuth();
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionUserId, setRejectionUserId] = useState<string | null>(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [selectedKycUser, setSelectedKycUser] = useState<Profile | null>(null);
  const [isDepositConfirmModalOpen, setIsDepositConfirmModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [confirmedAmount, setConfirmedAmount] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState(false);
  const [isAddWithdrawMethodModalOpen, setIsAddWithdrawMethodModalOpen] = useState(false);
  const [newMethod, setNewMethod] = useState({ name: "", details: "", instructions: "" });
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isWithdrawalRejectModalOpen, setIsWithdrawalRejectModalOpen] = useState(false);
  const [withdrawalRejectReason, setWithdrawalRejectReason] = useState("");
  const [selectedWithdrawalTx, setSelectedWithdrawalTx] = useState<Transaction | null>(null);

  // Queries
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getProfiles
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => getTransactions()
  });

  const { data: complaints = [], isLoading: isLoadingComplaints } = useQuery({
    queryKey: ['admin-complaints'],
    queryFn: getComplaints
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['complaint-messages', activeComplaint?.id],
    queryFn: () => getComplaintMessages(activeComplaint!.id),
    enabled: !!activeComplaint?.id
  });

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: getInvestmentPlans
  });

  const { data: settings = [], isLoading: isLoadingSettings } = useQuery({
    queryKey: ['admin-platform-settings'],
    queryFn: getPlatformSettings
  });

  const [aboutUs, setAboutUs] = useState<AboutUsType>({ title: "", content: "" });

  React.useEffect(() => {
    getAboutUs().then(setAboutUs);
  }, []);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Profile> }) => updateProfile(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Profile Updated", description: "User data has been successfully updated." });
      setIsEditModalOpen(false);
    }
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: any }) => updateTransactionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      toast({ title: "Transaction Updated", description: "The transaction status has been updated." });
    }
  });

  const confirmDepositMutation = useMutation({
    mutationFn: ({ txId, userId, amount }: { txId: string, userId: string, amount: number }) => approveDeposit(txId, userId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Deposit Confirmed", description: "User balance has been updated." });
      setIsDepositConfirmModalOpen(false);
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: ({ key, value }: { key: string, value: any }) => updatePlatformSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platform-settings'] });
      toast({ title: "Settings Updated", description: "Platform configuration has been saved." });
    }
  });

  // --- Currency Management ---
  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: getCurrencies,
  });

  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Partial<Currency> | null>(null);

  const saveCurrencyMutation = useMutation({
    mutationFn: (currency: Partial<Currency>) => saveCurrency(currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      setIsCurrencyModalOpen(false);
      setEditingCurrency(null);
      toast({ title: "Currency Saved", description: "The currency has been updated successfully." });
    },
  });

  const deleteCurrencyMutation = useMutation({
    mutationFn: (id: string) => deleteCurrency(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast({ title: "Currency Deleted", description: "The currency has been removed." });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ complaintId, message }: { complaintId: string, message: string }) =>
      sendComplaintMessage(complaintId, '00000000-0000-0000-0000-000000000000', message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint-messages', activeComplaint?.id] });
      setNewMessage("");
    }
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: (complaintId: string) => resolveComplaint(complaintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
      toast({ title: "Ticket Resolved", description: "The support ticket has been marked as resolved." });
      setIsChatModalOpen(false);
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  });

  const handleSaveAboutUs = () => {
    saveAboutUs(aboutUs);
    toast({
      title: "About Us Updated",
      description: "Changes have been saved and are now live.",
    });
  };

  const handleAddPlan = async () => {
    const newPlan: Partial<InvestmentPlan> = {
      name: "New Plan",
      min_amount: 100,
      max_amount: 10000,
      daily_profit: 1.5,
      duration: 30,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    const saved = await saveInvestmentPlan(newPlan);
    queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    setEditingPlanId(saved.id);
    toast({ title: "Plan Added", description: "Created a new investment plan draft. Configure and save it." });
  };

  const handleDeleteInvestmentPlan = async (id: string) => {
    await deleteInvestmentPlan(id);
    queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
    toast({ title: "Plan Deleted", description: "Investment plan has been removed." });
  };

  const handleSavePlan = async (plan: InvestmentPlan) => {
    try {
      await saveInvestmentPlan(plan);
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      setEditingPlanId(null);
      toast({
        title: "Plan Saved",
        description: `${plan.name} has been updated successfully.`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not save investment plan."
      });
    }
  };

  const columnHelper = createColumnHelper<Profile>();

  const columns = [
    columnHelper.accessor("display_name", {
      header: "User",
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground text-sm">{info.getValue() || "No Name"}</span>
          <span className="text-xs text-muted-foreground">{info.row.original.user_id}</span>
        </div>
      ),
    }),
    columnHelper.accessor("balance", {
      header: "Balance",
      cell: (info) => (
        <span className="font-mono text-sm font-semibold text-primary">
          {info.row.original.currency} {info.getValue()?.toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor("investment", {
      header: "Investment",
      cell: (info) => (
        <span className="font-mono text-sm">
          {info.row.original.currency} {info.getValue()?.toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor("kyc_status", {
      header: "KYC",
      cell: (info) => {
        const status = info.getValue() as string;
        return (
          <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0 h-5 ${status === 'approved' ? 'bg-primary/20 text-primary border-primary/30' :
            status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
              status === 'rejected' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                'bg-muted text-muted-foreground border-border/30'
            }`}>
            {status}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 gap-1 hover:bg-primary/10 hover:text-primary"
            onClick={() => {
              setActiveUser(row.original);
              setIsEditModalOpen(true);
            }}
          >
            <Edit3 className="w-3 h-3" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`text-xs h-7 gap-1 ${row.original.is_suspended ? 'text-primary' : 'text-yellow-400'} hover:bg-muted/10`}
            onClick={() => updateProfileMutation.mutate({
              id: row.original.user_id,
              updates: { is_suspended: !row.original.is_suspended }
            })}
          >
            <AlertCircle className="w-3 h-3" /> {row.original.is_suspended ? "Unsuspend" : "Suspend"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 gap-1 text-primary hover:bg-primary/10"
            onClick={() => {
              startImpersonation(row.original as any);
              toast({ title: "Impersonation Started", description: `You are now logged in as ${row.original.display_name}` });
              navigate("/dashboard");
            }}
          >
            <UserCheck className="w-3 h-3" /> Login As
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: {
      globalFilter: searchTerm,
    },
    onGlobalFilterChange: setSearchTerm,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Overview Stats
  const totalUsers = users.length;
  const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalInvestment = users.reduce((sum, u) => sum + (u.investment || 0), 0);
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' && t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const pendingKycs = users.filter(u => u.kyc_status === 'pending').length;
  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length;
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').length;
  const totalPending = pendingKycs + pendingDeposits + pendingWithdrawals;

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and monitor your platform operations.</p>
          </div>
          <div className="relative group w-full sm:max-w-xs md:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search data..."
              className="pl-11 bg-muted/30 border-border/30 focus:border-primary/40 h-12 rounded-2xl shadow-inner text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="overview" className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  <Card className="glass border-primary/20 bg-primary/5 shadow-sm">
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                        Total Users
                        <Users className="w-3.5 h-3.5 text-primary" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-2xl font-bold tracking-tight">{totalUsers}</div>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        Platform growth active
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass border-primary/20 bg-primary/5 shadow-sm">
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                        Total Deposits
                        <ArrowDownRight className="w-3.5 h-3.5 text-primary" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-2xl font-bold tracking-tight">USD {totalDeposits.toLocaleString()}</div>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        Approved transactions
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass border-primary/20 bg-primary/5 shadow-sm">
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                        Active Investment
                        <Box className="w-3.5 h-3.5 text-primary" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-2xl font-bold tracking-tight">USD {totalInvestment.toLocaleString()}</div>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        Capital under mgmt
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass border-destructive/20 bg-destructive/5 shadow-sm">
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-destructive/80 flex items-center justify-between">
                        Pending Actions
                        <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-2xl font-bold text-destructive tracking-tight">{totalPending}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {pendingKycs > 0 && <Badge variant="outline" className="text-[8px] h-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-1.5">{pendingKycs} KYC</Badge>}
                        {pendingDeposits > 0 && <Badge variant="outline" className="text-[8px] h-4 bg-primary/10 text-primary border-primary/20 px-1.5">{pendingDeposits} Dep</Badge>}
                        {pendingWithdrawals > 0 && <Badge variant="outline" className="text-[8px] h-4 bg-destructive/10 text-destructive border-destructive/20 px-1.5">{pendingWithdrawals} Wdr</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="glass lg:col-span-2 border-border/30">
                    <CardHeader className="px-4 md:px-6">
                      <CardTitle className="font-display text-lg md:text-xl">Recent Activity</CardTitle>
                      <CardDescription className="text-sm">Latest platform events and transactions.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 md:px-6">
                      <div className="space-y-3">
                        {transactions.slice(0, 5).map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-border/20 bg-muted/5 group hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3.5 text-left">
                              <div className={`p-2.5 rounded-xl ${tx.type === 'deposit' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                                {tx.type === 'deposit' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="text-sm font-bold truncate pr-2">{tx.profiles?.display_name || "Unknown"}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{tx.type} · {new Date(tx.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={`text-sm font-mono font-bold ${tx.status === 'approved' ? 'text-primary' : tx.status === 'rejected' ? 'text-destructive' : 'text-yellow-500'}`}>
                                {tx.profiles?.currency} {tx.amount.toLocaleString()}
                              </div>
                              <div className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-tighter">{tx.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass border-border/30">
                    <CardHeader className="px-4 md:px-6">
                      <CardTitle className="font-display text-lg md:text-xl">Quick Access</CardTitle>
                      <CardDescription className="text-sm">Shortcut to main actions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 md:px-6 pb-6">
                      <Button variant="outline" className="w-full justify-start gap-4 border-primary/20 hover:bg-primary/10 h-12 px-4 rounded-xl group" onClick={() => setActiveTab('kyc')}>
                        <ShieldCheck className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Review Pending KYC</span>
                        {pendingKycs > 0 && <Badge className="ml-auto bg-primary text-primary-foreground text-[10px]">{pendingKycs}</Badge>}
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-4 border-primary/20 hover:bg-primary/10 h-12 px-4 rounded-xl group" onClick={() => setActiveTab('deposits')}>
                        <ArrowDownRight className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Manage Deposits</span>
                        {pendingDeposits > 0 && <Badge className="ml-auto bg-primary text-primary-foreground text-[10px]">{pendingDeposits}</Badge>}
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-4 border-destructive/20 hover:bg-destructive/10 h-12 px-4 rounded-xl group" onClick={() => setActiveTab('withdrawals')}>
                        <ArrowUpRight className="w-4 h-4 text-destructive group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Manage Withdrawals</span>
                        {pendingWithdrawals > 0 && <Badge className="ml-auto bg-destructive text-destructive-foreground text-[10px]">{pendingWithdrawals}</Badge>}
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-4 border-border/20 hover:bg-muted/10 h-12 px-4 rounded-xl group" onClick={() => setActiveTab('support')}>
                        <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Open Support Inbox</span>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="users">
                <Card className="glass border-border/30">
                  <CardHeader className="px-4 md:px-6">
                    <CardTitle className="font-display text-lg md:text-xl">User Management</CardTitle>
                    <CardDescription className="text-sm">View and manage all registered users.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 md:px-6">
                    {/* Desktop Table View */}
                    <div className="hidden md:block rounded-xl overflow-hidden border border-border/30">
                      <Table>
                        <TableHeader>
                          {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id} className="border-border/30 hover:bg-transparent bg-muted/20">
                              {hg.headers.map((header) => (
                                <TableHead key={header.id} className="text-muted-foreground text-xs font-bold uppercase tracking-wider h-10">
                                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                              ))}
                            </TableRow>
                          ))}
                        </TableHeader>
                        <TableBody>
                          {isLoadingUsers ? (
                            <TableRow><TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground italic">Loading users...</TableCell></TableRow>
                          ) : table.getRowModel().rows.length === 0 ? (
                            <TableRow><TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground italic">No users found.</TableCell></TableRow>
                          ) : table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} className={`border-border/30 hover:bg-muted/10 transition-colors ${row.original.is_suspended ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="py-3">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card Stack View */}
                    <div className="md:hidden space-y-3">
                      {isLoadingUsers ? (
                        <div className="text-center py-10 text-muted-foreground italic">Loading users...</div>
                      ) : users.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground italic">No users found.</div>
                      ) : users.map((user) => (
                        <div key={user.user_id} className={`p-4 rounded-2xl border border-border/30 bg-muted/5 space-y-3 ${user.is_suspended ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{user.display_name || "No Name"}</span>
                              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">{user.user_id}</span>
                            </div>
                            <Badge variant="outline" className={`capitalize text-[10px] px-2 py-0 h-5 ${user.kyc_status === 'approved' ? 'bg-primary/20 text-primary border-primary/30' :
                              user.kyc_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                user.kyc_status === 'rejected' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                                  'bg-muted text-muted-foreground border-border/30'
                              }`}>
                              KYC: {user.kyc_status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-border/10">
                            <div>
                              <div className="text-muted-foreground mb-1 uppercase tracking-widest text-[8px] font-bold">Balance</div>
                              <div className="font-mono font-bold text-primary">{user.currency} {user.balance?.toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-muted-foreground mb-1 uppercase tracking-widest text-[8px] font-bold">Investment</div>
                              <div className="font-mono font-bold text-foreground">{user.currency} {user.investment?.toLocaleString()}</div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs h-9 gap-2 border-primary/20 hover:bg-primary/10"
                              onClick={() => {
                                setActiveUser(user);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className={`flex-1 text-xs h-9 gap-2 ${user.is_suspended ? 'text-primary border-primary/20 bg-primary/5' : 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'}`}
                              onClick={() => updateProfileMutation.mutate({
                                id: user.user_id,
                                updates: { is_suspended: !user.is_suspended }
                              })}
                            >
                              <AlertCircle className="w-3.5 h-3.5" /> {user.is_suspended ? "Unsuspend" : "Suspend"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="kyc">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">KYC Verification Queue</CardTitle>
                    <CardDescription>Review pending identity verification requests.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.filter(u => u.kyc_status === 'pending').length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground italic border border-dashed rounded-xl border-border/50">No pending KYC requests.</div>
                      ) : users.filter(u => u.kyc_status === 'pending').map(user => (
                        <div key={user.id} className="p-4 rounded-xl border border-border/30 bg-muted/10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {user.display_name?.charAt(0) || user.user_id?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{user.display_name}</div>
                              <div className="text-xs text-muted-foreground">{user.user_id}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 h-8 px-3"
                              onClick={() => {
                                setSelectedKycUser(user);
                                setIsKycModalOpen(true);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" /> Review Submission
                            </Button>
                            <Button size="sm" className="bg-primary/90 hover:bg-primary h-8 px-3" onClick={() => updateProfileMutation.mutate({ id: user.user_id, updates: { kyc_status: 'approved' } })}>
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-3"
                              onClick={() => {
                                setRejectionUserId(user.user_id);
                                setRejectionReason("");
                                setIsRejectionModalOpen(true);
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deposits">
                <Card className="glass shadow-xl border-border/50">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="font-display text-lg">Deposit Requests</CardTitle>
                        <CardDescription>Verify and approve manual deposits.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="standard" className="w-full">
                      <TabsList className="bg-muted/20 border border-border/50 p-1 mb-4 grid grid-cols-2">
                        <TabsTrigger value="standard">Standard Deposits</TabsTrigger>
                        <TabsTrigger value="clearance">Clearance Fees</TabsTrigger>
                      </TabsList>

                      <TabsContent value="standard">
                        <div className="space-y-4">
                          {transactions.filter(t => t.type === 'deposit' && t.status === 'pending' && !t.metadata?.clearance_step).length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground italic border border-dashed rounded-xl border-border/50">No pending standard deposits.</div>
                          ) : transactions.filter(t => t.type === 'deposit' && t.status === 'pending' && !t.metadata?.clearance_step).map(tx => (
                            <div key={tx.id} className="p-4 rounded-xl border border-border/30 bg-muted/10 flex items-center justify-between">
                              <div>
                                <div className="font-medium text-foreground">{tx.profiles?.display_name}</div>
                                <div className="text-lg font-mono font-bold text-primary mt-1">{tx.profiles?.currency} {tx.amount.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground mt-1">Requested: {new Date(tx.created_at).toLocaleDateString()}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2 h-8 px-3"
                                  onClick={() => {
                                    setSelectedTransaction(tx);
                                    setConfirmedAmount(tx.amount.toString());
                                    setIsDepositConfirmModalOpen(true);
                                  }}
                                >
                                  <Eye className="w-3.5 h-3.5" /> Review
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8 px-3" onClick={() => updateTransactionMutation.mutate({ id: tx.id, status: 'rejected' })}>
                                  Decline
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="clearance">
                        <div className="space-y-4">
                          {transactions.filter(t => t.type === 'deposit' && t.status === 'pending' && t.metadata?.clearance_step).length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground italic border border-dashed rounded-xl border-border/50">No pending clearance payments.</div>
                          ) : transactions.filter(t => t.type === 'deposit' && t.status === 'pending' && t.metadata?.clearance_step).map(tx => (
                            <div key={tx.id} className="p-4 rounded-xl border border-border/30 bg-muted/10 flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-foreground flex items-center gap-2">
                                    {tx.profiles?.display_name}
                                    <Badge variant="secondary" className="text-[10px]">
                                      Step {tx.metadata.clearance_step}: {
                                        tx.metadata.clearance_step === 1 ? 'Card' :
                                          tx.metadata.clearance_step === 2 ? 'Activation' : 'Code'
                                      }
                                    </Badge>
                                  </div>
                                  <div className="text-lg font-mono font-bold text-primary mt-1">{tx.profiles?.currency} {tx.amount.toLocaleString()}</div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 h-8 font-bold"
                                    onClick={async () => {
                                      try {
                                        await approveClearancePayment(tx.id, tx.profiles!.id, tx.metadata.clearance_step);
                                        toast({ title: "Approved", description: `Clearance Step ${tx.metadata.clearance_step} verified.` });
                                        queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
                                        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                                      } catch (e: any) {
                                        toast({ title: "Error", description: e.message, variant: "destructive" });
                                      }
                                    }}
                                  >
                                    Approve Step
                                  </Button>
                                  <Button size="sm" variant="destructive" className="h-8" onClick={() => updateTransactionMutation.mutate({ id: tx.id, status: 'rejected' })}>
                                    Reject
                                  </Button>
                                </div>
                              </div>
                              <div className="rounded-lg overflow-hidden border border-border/50 aspect-video bg-black/20 flex items-center justify-center">
                                {tx.receipt_url ? (
                                  <img src={tx.receipt_url} alt="Clearance Receipt" className="max-h-full object-contain cursor-pointer" onClick={() => window.open(tx.receipt_url!, '_blank')} />
                                ) : (
                                  <div className="text-muted-foreground text-xs italic">No receipt uploaded</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="withdrawals">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5 text-destructive" />
                      Withdrawal Requests
                    </CardTitle>
                    <CardDescription>Review and process pending user withdrawal requests.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground italic border border-dashed rounded-xl border-border/50">
                          <ArrowUpRight className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          No pending withdrawal requests.
                        </div>
                      ) : transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').map(tx => (
                        <div key={tx.id} className="p-4 rounded-xl border border-border/30 bg-muted/10 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="font-medium text-foreground">{tx.profiles?.display_name}</div>
                              <div className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</div>
                              <div className="text-2xl font-mono font-bold text-destructive">
                                -{tx.profiles?.currency} {tx.amount?.toLocaleString()}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 h-9 px-4 font-bold"
                                onClick={async () => {
                                  try {
                                    await approveWithdrawal(tx.id, tx.profiles!.id);
                                    toast({ title: "Approved", description: `Withdrawal of ${tx.profiles?.currency} ${tx.amount?.toLocaleString()} has been approved.` });
                                    queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
                                    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                                  } catch (e: any) {
                                    toast({ title: "Error", description: e.message, variant: "destructive" });
                                  }
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-9 px-4 font-bold"
                                onClick={() => {
                                  setSelectedWithdrawalTx(tx);
                                  setWithdrawalRejectReason("");
                                  setIsWithdrawalRejectModalOpen(true);
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Decline
                              </Button>
                            </div>
                          </div>
                          {tx.receipt_url && (
                            <div className="p-3 rounded-lg bg-muted/20 border border-border/20 text-sm text-foreground/80 whitespace-pre-wrap font-mono">
                              <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Bank / Wallet Details</div>
                              {tx.receipt_url}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="support">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Support Inbox</CardTitle>
                    <CardDescription>Respond to user complaints and queries.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {complaints.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground italic border border-dashed rounded-xl border-border/50">No support tickets.</div>
                      ) : complaints.map(complaint => (
                        <div key={complaint.id} className="p-4 rounded-xl border border-border/30 bg-muted/10 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${complaint.status === 'open' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-primary/10 text-primary'}`}>
                              {complaint.status === 'open' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="font-medium">{complaint.subject}</div>
                              <div className="text-xs text-muted-foreground">From: {complaint.profiles?.display_name} · {new Date(complaint.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                            onClick={() => {
                              setActiveComplaint(complaint);
                              setIsChatModalOpen(true);
                            }}
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Reply
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="plans">
                <Card className="glass">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-display text-lg">Investment Plans</CardTitle>
                      <CardDescription>Configure the available investment strategies.</CardDescription>
                    </div>
                    <Button onClick={handleAddPlan} variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                      <Plus className="w-4 h-4" /> Add Plan
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={cn(
                            "p-6 rounded-xl border transition-all duration-300 relative group plan-card",
                            editingPlanId === plan.id
                              ? "bg-muted/30 border-primary/50 ring-1 ring-primary/20"
                              : "bg-muted/10 border-border/30 hover:border-primary/20"
                          )}
                          id={`plan-${plan.id}`}
                        >
                          <div className="absolute top-4 right-4 flex gap-2 items-center">
                            {(!plan.end_time || new Date(plan.end_time) > new Date()) && (!plan.start_time || new Date(plan.start_time) <= new Date()) ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">Active</span>
                            ) : plan.start_time && new Date(plan.start_time) > new Date() ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">Scheduled</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider border border-border">Expired</span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive h-8 w-8 hover:bg-destructive/10"
                              onClick={() => handleDeleteInvestmentPlan(plan.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {editingPlanId === plan.id ? (
                            <>
                              <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Plan Name</Label>
                                  <Input
                                    defaultValue={plan.name}
                                    className="bg-background/60 border-border/50 plan-name"
                                    placeholder="e.g. Starter Plan"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Daily Profit (%)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    defaultValue={plan.daily_profit}
                                    className="bg-background/60 border-border/50 plan-profit"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Duration (Days)</Label>
                                  <Input
                                    type="number"
                                    defaultValue={plan.duration}
                                    className="bg-background/60 border-border/50 plan-duration"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Min Amount ($)</Label>
                                  <Input
                                    type="number"
                                    defaultValue={plan.min_amount}
                                    className="bg-background/60 border-border/50 plan-min"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Max Amount ($)</Label>
                                  <Input
                                    type="number"
                                    defaultValue={plan.max_amount}
                                    className="bg-background/60 border-border/50 plan-max"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Start Date</Label>
                                  <Input
                                    type="datetime-local"
                                    defaultValue={plan.start_time ? new Date(plan.start_time).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16) : ""}
                                    className="bg-background/60 border-border/50 plan-start"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">End Date (Package Expiry)</Label>
                                  <Input
                                    type="datetime-local"
                                    defaultValue={plan.end_time ? new Date(plan.end_time).toLocaleString('sv-SE').replace(' ', 'T').slice(0, 16) : ""}
                                    className="bg-background/60 border-border/50 plan-end"
                                  />
                                </div>
                              </div>
                              <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-border/10">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingPlanId(null)}
                                  className="font-semibold"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const card = document.getElementById(`plan-${plan.id}`);
                                    if (card) {
                                      const updatedPlan = {
                                        ...plan,
                                        name: (card.querySelector('.plan-name') as HTMLInputElement).value,
                                        daily_profit: parseFloat((card.querySelector('.plan-profit') as HTMLInputElement).value),
                                        duration: parseInt((card.querySelector('.plan-duration') as HTMLInputElement).value),
                                        min_amount: parseFloat((card.querySelector('.plan-min') as HTMLInputElement).value),
                                        max_amount: parseFloat((card.querySelector('.plan-max') as HTMLInputElement).value),
                                        start_time: (card.querySelector('.plan-start') as HTMLInputElement).value ? new Date((card.querySelector('.plan-start') as HTMLInputElement).value).toISOString() : null,
                                        end_time: (card.querySelector('.plan-end') as HTMLInputElement).value ? new Date((card.querySelector('.plan-end') as HTMLInputElement).value).toISOString() : null,
                                      };
                                      handleSavePlan(updatedPlan);
                                    }
                                  }}
                                  className="font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 shadow-lg shadow-primary/20"
                                >
                                  <Save className="w-4 h-4" /> Save Plan Changes
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                  <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                  <div className="font-bold text-lg text-foreground">{plan.name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> {plan.duration} Days · {plan.daily_profit}% Daily ROI
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-8">
                                <div className="text-right hidden sm:block">
                                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest whitespace-nowrap">Price Range</div>
                                  <div className="text-sm font-mono font-bold text-primary">
                                    ${plan.min_amount.toLocaleString()} - ${plan.max_amount.toLocaleString()}
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingPlanId(plan.id)}
                                  className="gap-2 border-primary/20 text-primary hover:bg-primary/10"
                                >
                                  <Edit3 className="w-4 h-4" /> Edit Plan
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <Button
                        onClick={handleAddPlan}
                        className="w-full py-8 border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all group mt-4"
                        variant="ghost"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6 text-primary" />
                          </div>
                          <span className="font-display font-semibold text-primary">Add New Investment Plan</span>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="glass h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          <ListPlus className="w-5 h-5 text-primary" />
                          Withdrawal Methods
                        </CardTitle>
                        <CardDescription>Configure available withdrawal channels.</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-primary/10 gap-2 border border-primary/20"
                        onClick={() => {
                          setNewMethod({ name: "", details: "", instructions: "", account_number: "" } as any);
                          setIsAddWithdrawMethodModalOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4" /> Add
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        {(settings.find(s => s.key === 'withdrawal_methods')?.value || []).map((method: any, index: number) => {
                          // Handle legacy string array or new object array
                          const m = typeof method === 'string' ? { id: Math.random().toString(), name: method, details: "", is_active: true } : method;
                          return (
                            <div key={m.id || index} className="p-4 rounded-xl border border-border/30 bg-muted/10 space-y-3" id={`withdraw-method-${index}`}>
                              <div className="flex justify-between items-center">
                                <Input
                                  defaultValue={m.name}
                                  className="bg-background/50 font-bold border-none h-8 px-0 focus-visible:ring-0 w-withdraw-name"
                                  placeholder="Method Name (e.g. Bank Transfer)"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    const currentMethods = [...(settings.find(s => s.key === 'withdrawal_methods')?.value || [])];
                                    currentMethods.splice(index, 1);
                                    updateSettingsMutation.mutate({ key: 'withdrawal_methods', value: currentMethods });
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  className="w-full h-8 text-xs font-bold"
                                  onClick={() => {
                                    const container = document.getElementById(`withdraw-method-${index}`);
                                    const name = (container?.querySelector('.w-withdraw-name') as HTMLInputElement).value;
                                    const currentMethods = [...(settings.find(s => s.key === 'withdrawal_methods')?.value || [])];
                                    currentMethods[index] = { ...m, name };
                                    updateSettingsMutation.mutate({ key: 'withdrawal_methods', value: currentMethods });
                                  }}
                                >
                                  Save Name
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass h-full">
                    <CardHeader>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        Deposit Methods
                      </CardTitle>
                      <CardDescription>Manage how users can deposit funds.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        {(settings.find(s => s.key === 'deposit_methods')?.value || []).map((method: DepositMethod, index: number) => (
                          <div key={method.id || index} className="p-4 rounded-xl border border-border/30 bg-muted/10 space-y-3" id={`deposit-method-${index}`}>
                            <div className="flex justify-between items-center">
                              <Input
                                defaultValue={method.name}
                                className="bg-background/50 font-bold border-none h-8 px-0 focus-visible:ring-0 method-name"
                                placeholder="Method Name (e.g. Bank Transfer)"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  const currentMethods = [...(settings.find(s => s.key === 'deposit_methods')?.value || [])];
                                  currentMethods.splice(index, 1);
                                  updateSettingsMutation.mutate({ key: 'deposit_methods', value: currentMethods });
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground uppercase">Account/Wallet Details</Label>
                              <Input
                                defaultValue={method.details}
                                className="bg-background/50 h-8 method-details"
                                placeholder="Bank: Chase, Account: 12345678"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground uppercase">Short Instructions (Optional)</Label>
                              <Input
                                defaultValue={method.instructions}
                                className="bg-background/50 h-8 method-instructions"
                                placeholder="Transfer exactly the amount chosen."
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="w-full h-8 text-xs font-bold"
                                onClick={() => {
                                  const container = document.getElementById(`deposit-method-${index}`);
                                  const name = (container?.querySelector('.method-name') as HTMLInputElement).value;
                                  const details = (container?.querySelector('.method-details') as HTMLInputElement).value;
                                  const instructions = (container?.querySelector('.method-instructions') as HTMLInputElement).value;

                                  const currentMethods = [...(settings.find(s => s.key === 'deposit_methods')?.value || [])];
                                  currentMethods[index] = { ...method, name, details, instructions };
                                  updateSettingsMutation.mutate({ key: 'deposit_methods', value: currentMethods });
                                }}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5"
                          onClick={() => {
                            setNewMethod({ name: "", details: "", instructions: "" });
                            setIsAddMethodModalOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Deposit Method
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Dialog open={isAddMethodModalOpen} onOpenChange={setIsAddMethodModalOpen}>
                    <DialogContent className="glass border-border/50 max-w-md">
                      <DialogHeader>
                        <DialogTitle className="font-display flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-primary" />
                          Add New Deposit Method
                        </DialogTitle>
                        <DialogDescription>
                          Enter the details for the new payment method.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Method Name</Label>
                          <Input
                            placeholder="e.g. Bank Transfer, Bitcoin"
                            value={newMethod.name}
                            onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                            className="bg-background/40"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account / Wallet Name</Label>
                          <Input
                            placeholder="e.g. Bank: Chase"
                            value={newMethod.details}
                            onChange={(e) => setNewMethod({ ...newMethod, details: e.target.value })}
                            className="bg-background/40"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Number / Wallet Address</Label>
                          <Input
                            placeholder="e.g. 1234567890 or BTC Address"
                            value={(newMethod as any).account_number || ""}
                            onChange={(e) => setNewMethod({ ...newMethod, account_number: e.target.value } as any)}
                            className="bg-background/40"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Short Instructions (Optional)</Label>
                          <Input
                            placeholder="e.g. Include your username in the memo."
                            value={newMethod.instructions}
                            onChange={(e) => setNewMethod({ ...newMethod, instructions: e.target.value })}
                            className="bg-background/40"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddMethodModalOpen(false)}>Cancel</Button>
                        <Button
                          onClick={() => {
                            if (!newMethod.name || !newMethod.details) {
                              toast({ title: "Error", description: "Name and details are required.", variant: "destructive" });
                              return;
                            }
                            const currentMethods = [...(settings.find(s => s.key === 'deposit_methods')?.value || [])];
                            currentMethods.push({
                              id: crypto.randomUUID(),
                              ...newMethod,
                              is_active: true
                            });
                            updateSettingsMutation.mutate({ key: 'deposit_methods', value: currentMethods });
                            setIsAddMethodModalOpen(false);
                          }}
                        >
                          Add Method
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isAddWithdrawMethodModalOpen} onOpenChange={setIsAddWithdrawMethodModalOpen}>
                    <DialogContent className="glass border-border/50 max-w-md">
                      <DialogHeader>
                        <DialogTitle className="font-display flex items-center gap-2">
                          <ListPlus className="w-5 h-5 text-primary" />
                          Add Withdrawal Method
                        </DialogTitle>
                        <DialogDescription>
                          Enter the name for the new withdrawal option.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Method Name</Label>
                          <Input
                            placeholder="e.g. Bank, PayPal, Bitcoin"
                            value={newMethod.name}
                            onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                            className="bg-background/40"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddWithdrawMethodModalOpen(false)}>Cancel</Button>
                        <Button
                          onClick={() => {
                            if (!newMethod.name) {
                              toast({ title: "Error", description: "Name is required.", variant: "destructive" });
                              return;
                            }
                            const currentMethods = [...(settings.find(s => s.key === 'withdrawal_methods')?.value || [])];
                            currentMethods.push({
                              id: crypto.randomUUID(),
                              name: newMethod.name,
                              is_active: true
                            });
                            updateSettingsMutation.mutate({ key: 'withdrawal_methods', value: currentMethods });
                            setIsAddWithdrawMethodModalOpen(false);
                          }}
                        >
                          Add Method
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Card className="glass h-full">
                    <CardHeader>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-primary" />
                        Withdrawal Clearance Steps
                      </CardTitle>
                      <CardDescription>Set the fee details for each security clearance step.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {['withdrawal_card_payment', 'withdrawal_activation_payment', 'withdrawal_card_code_payment'].map((key) => {
                        const setting = settings.find(s => s.key === key);
                        const label = key.replace('withdrawal_', '').replace('_payment', '').replace('_', ' ').toUpperCase();
                        return (
                          <div key={key} className="p-4 rounded-xl border border-border/30 bg-muted/10 space-y-4" id={`setting-${key}`}>
                            <Label className="text-xs font-bold text-primary tracking-widest">{label}</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase">Fee Amount</Label>
                                <Input
                                  type="number"
                                  defaultValue={setting?.value?.amount || 0}
                                  className="bg-background/50 amount-input"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase">Payment Details</Label>
                                <Input
                                  defaultValue={setting?.value?.account_details || ''}
                                  className="bg-background/50 details-input"
                                />
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-8 text-[10px] uppercase font-bold"
                              onClick={() => {
                                const container = document.getElementById(`setting-${key}`);
                                const amount = parseFloat((container?.querySelector('.amount-input') as HTMLInputElement).value);
                                const account_details = (container?.querySelector('.details-input') as HTMLInputElement).value;
                                updateSettingsMutation.mutate({ key, value: { amount, account_details } });
                              }}
                            >
                              Update {label}
                            </Button>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="content">
                <Card className="glass">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-display text-lg">About Us Content</CardTitle>
                      <CardDescription>Update the site's brand story.</CardDescription>
                    </div>
                    <Button onClick={handleSaveAboutUs} size="sm" className="gap-2 px-6">
                      <Save className="w-4 h-4" /> Save Changes
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Heading</Label>
                      <Input
                        value={aboutUs.title}
                        onChange={(e) => setAboutUs({ ...aboutUs, title: e.target.value })}
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea
                        value={aboutUs.content}
                        onChange={(e) => setAboutUs({ ...aboutUs, content: e.target.value })}
                        className="min-h-[150px] bg-background/50 leading-relaxed"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="currencies">
                <Card className="glass">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-display text-lg">Platform Currencies</CardTitle>
                      <CardDescription>Manage the currencies and exchange rates used across the application.</CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingCurrency({ name: "", code: "", symbol: "", exchange_rate: 1.0, is_active: true });
                        setIsCurrencyModalOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Plus className="w-4 h-4" /> Add Currency
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {currencies.map((currency) => (
                        <div key={currency.id} className="p-4 rounded-xl border border-border/30 bg-muted/10 flex items-center justify-between group transition-all hover:border-primary/20">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {currency.symbol}
                            </div>
                            <div>
                              <div className="font-bold">{currency.name} ({currency.code})</div>
                              <div className="text-xs text-muted-foreground">Rate: 1 USD = {currency.exchange_rate} {currency.code}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => {
                                setEditingCurrency(currency);
                                setIsCurrencyModalOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${currency.name}?`)) {
                                  deleteCurrencyMutation.mutate(currency.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <div className="grid gap-6">
                  <Card className="glass border-primary/20 bg-primary/5">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="font-display text-lg flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary animate-spin-slow" />
                            Global Maintenance Mode
                          </CardTitle>
                          <CardDescription>When active, the site is inaccessible to regular users.</CardDescription>
                        </div>
                        {(() => {
                          const s = (settings as any[])?.find(s => s.key === "maintenance_mode");
                          const mMode = s?.value === true;
                          return (
                            <Button
                              variant={mMode ? "destructive" : "default"}
                              size="sm"
                              className="gap-2 px-6 shadow-lg shadow-primary/20"
                              onClick={() => updateSettingsMutation.mutate({
                                key: "maintenance_mode",
                                value: !mMode
                              })}
                            >
                              {mMode ? (
                                <><XCircle className="w-4 h-4" /> Disable Maintenance</>
                              ) : (
                                <><ShieldCheck className="w-4 h-4" /> Enable Maintenance</>
                              )}
                            </Button>
                          );
                        })()}
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs >
      </motion.div >

      {/* Rejection Modal */}
      < Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen} >
        <DialogContent className="glass border-border/50">
          <DialogHeader>
            <DialogTitle>Reject KYC Application</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this verification request.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Reason for Rejection</Label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-lg bg-muted/30 border border-border/50 focus:border-primary/50 focus:outline-none transition-colors"
                placeholder="e.g., The document image is too blurry. Please upload a clearer photo."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim()}
              onClick={() => {
                if (rejectionUserId) {
                  updateProfileMutation.mutate({
                    id: rejectionUserId,
                    updates: {
                      kyc_status: 'rejected' as any,
                      kyc_rejection_reason: rejectionReason,
                      show_kyc_notification: true
                    }
                  });
                  setIsRejectionModalOpen(false);
                }
              }}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* User Edit Modal */}
      < Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen} >
        <DialogContent className="glass max-w-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit User: {activeUser?.display_name || "No Name"}</DialogTitle>
            <DialogDescription>Modify user balance, investment, and currency settings.</DialogDescription>
          </DialogHeader>

          {activeUser && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Balance</Label>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 shrink-0 border-border/50"
                      onClick={() => {
                        const input = document.getElementById('edit-balance') as HTMLInputElement;
                        input.value = (parseFloat(input.value) - 100).toString();
                      }}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      defaultValue={activeUser.balance}
                      id="edit-balance"
                      className="bg-background/50 text-center font-mono"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 shrink-0 border-border/50"
                      onClick={() => {
                        const input = document.getElementById('edit-balance') as HTMLInputElement;
                        input.value = (parseFloat(input.value) + 100).toString();
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Active Investment</Label>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 shrink-0 border-border/50"
                      onClick={() => {
                        const input = document.getElementById('edit-investment') as HTMLInputElement;
                        input.value = (parseFloat(input.value) - 100).toString();
                      }}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      defaultValue={activeUser.investment}
                      id="edit-investment"
                      className="bg-background/50 text-center font-mono"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 shrink-0 border-border/50"
                      onClick={() => {
                        const input = document.getElementById('edit-investment') as HTMLInputElement;
                        input.value = (parseFloat(input.value) + 100).toString();
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Accumulated Profit</Label>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 shrink-0 border-border/50"
                    onClick={() => {
                      const input = document.getElementById('edit-profit') as HTMLInputElement;
                      input.value = (parseFloat(input.value) - 10).toString();
                    }}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    defaultValue={activeUser.profit}
                    id="edit-profit"
                    className="bg-background/50 text-center font-mono"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 shrink-0 border-border/50"
                    onClick={() => {
                      const input = document.getElementById('edit-profit') as HTMLInputElement;
                      input.value = (parseFloat(input.value) + 10).toString();
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>User Currency</Label>
                <Select defaultValue={activeUser.currency} onValueChange={(v) => activeUser.currency = v}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="glass border-border/50">
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.code}>
                        {c.code} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>KYC Status</Label>
                <Select defaultValue={activeUser.kyc_status} onValueChange={(v: any) => activeUser.kyc_status = v}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="glass border-border/50">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (activeUser) {
                const balance = parseFloat((document.getElementById('edit-balance') as HTMLInputElement).value);
                const investment = parseFloat((document.getElementById('edit-investment') as HTMLInputElement).value);
                const profit = parseFloat((document.getElementById('edit-profit') as HTMLInputElement).value);
                updateProfileMutation.mutate({
                  id: activeUser.user_id,
                  updates: {
                    balance,
                    investment,
                    profit,
                    currency: activeUser.currency,
                    kyc_status: activeUser.kyc_status
                  }
                });
              }
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* KYC Review Modal */}
      < Dialog open={isKycModalOpen} onOpenChange={setIsKycModalOpen} >
        <DialogContent className="glass max-w-4xl border-border/50 max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Review Identity Document</DialogTitle>
            <DialogDescription>
              User: <span className="text-foreground font-bold">{selectedKycUser?.display_name}</span> ({selectedKycUser?.user_id})
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto py-6 min-h-[400px] flex items-center justify-center bg-muted/20 rounded-xl border border-border/30">
            {selectedKycUser?.kyc_document_url ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                {selectedKycUser.kyc_document_url.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={selectedKycUser.kyc_document_url}
                    className="w-full h-[600px] rounded-lg"
                    title="KYC Document PDF"
                  />
                ) : (
                  <img
                    src={selectedKycUser.kyc_document_url}
                    alt="KYC Identity Document"
                    className="max-w-full max-h-[600px] object-contain rounded-lg shadow-2xl"
                  />
                )}
              </div>
            ) : (
              <div className="text-center space-y-2">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground italic">No document available to preview.</p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex gap-4">
            <Button
              variant="destructive"
              className="gap-2 px-8"
              onClick={() => {
                if (selectedKycUser) {
                  setRejectionUserId(selectedKycUser.user_id);
                  setRejectionReason("");
                  setIsRejectionModalOpen(true);
                  setIsKycModalOpen(false);
                }
              }}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 gap-2 px-8 glow-emerald"
              onClick={() => {
                if (selectedKycUser) {
                  updateProfileMutation.mutate({
                    id: selectedKycUser.user_id,
                    updates: { kyc_status: 'approved' as any }
                  });
                  setIsKycModalOpen(false);
                }
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Rejection Modal */}
      < Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen} >
        <DialogContent className="glass border-border/50">
          <DialogHeader>
            <DialogTitle>Reject KYC Application</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this verification request.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Reason for Rejection</Label>
              <textarea
                className="w-full min-h-[100px] p-3 rounded-lg bg-muted/30 border border-border/50 focus:border-primary/50 focus:outline-none transition-colors text-foreground"
                placeholder="e.g., The document image is too blurry. Please upload a clearer photo."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim()}
              onClick={() => {
                if (rejectionUserId) {
                  updateProfileMutation.mutate({
                    id: rejectionUserId,
                    updates: {
                      kyc_status: 'rejected' as any,
                      kyc_rejection_reason: rejectionReason,
                      show_kyc_notification: true
                    }
                  });
                  setIsRejectionModalOpen(false);
                }
              }}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Confirm Deposit Modal */}
      < Dialog open={isDepositConfirmModalOpen} onOpenChange={setIsDepositConfirmModalOpen} >
        <DialogContent className="glass max-w-2xl border-border/50 max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Confirm Deposit</DialogTitle>
            <DialogDescription>
              Review the payment receipt and credit the user's account.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto py-4 space-y-6">
            <div className="space-y-4">
              <Label>Payment Receipt</Label>
              <div className="min-h-[300px] flex items-center justify-center bg-muted/20 rounded-xl border border-border/30 overflow-hidden">
                {selectedTransaction?.receipt_url ? (
                  selectedTransaction.receipt_url.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={selectedTransaction.receipt_url}
                      className="w-full h-[400px]"
                      title="Deposit Receipt PDF"
                    />
                  ) : (
                    <img
                      src={selectedTransaction.receipt_url}
                      alt="Deposit Receipt"
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  )
                ) : (
                  <p className="text-muted-foreground italic">No receipt available.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>User</Label>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/30 font-medium">
                  {selectedTransaction?.profiles?.display_name}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Required Amount</Label>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/30 font-mono font-bold text-primary">
                  {selectedTransaction?.profiles?.currency} {selectedTransaction?.amount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirmed Amount ({selectedTransaction?.profiles?.currency})</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  className="pl-10 bg-muted/50 border-border/50 focus:border-primary/50 text-xl font-mono font-bold h-12"
                  value={confirmedAmount}
                  onChange={(e) => setConfirmedAmount(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground italic mt-1">
                Enter the exact amount shown on the receipt. This will be added to the user's balance.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/30">
            <Button variant="outline" onClick={() => setIsDepositConfirmModalOpen(false)}>Cancel</Button>
            <Button
              className="bg-primary hover:bg-primary/90 gap-2 px-8 glow-emerald"
              disabled={!confirmedAmount || parseFloat(confirmedAmount) <= 0 || confirmDepositMutation.isPending}
              onClick={() => {
                if (selectedTransaction) {
                  confirmDepositMutation.mutate({
                    txId: selectedTransaction.id,
                    userId: selectedTransaction.profiles?.id,
                    amount: parseFloat(confirmedAmount)
                  });
                }
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {confirmDepositMutation.isPending ? "Confirming..." : "Confirm & Credit Balance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Live Chat Modal */}
      < Dialog open={isChatModalOpen} onOpenChange={setIsChatModalOpen} >
        <DialogContent className="glass max-w-2xl border-border/50 p-0 overflow-hidden flex flex-col h-[80vh]">
          <DialogHeader className="p-6 pb-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-display text-xl">{activeComplaint?.subject}</DialogTitle>
                <DialogDescription>Chat with {activeComplaint?.profiles?.display_name}</DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`px-3 capitalize ${activeComplaint?.status === 'open'
                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    : 'bg-primary/10 text-primary border-primary/20'
                    }`}
                >
                  {activeComplaint?.status}
                </Badge>
                {activeComplaint?.status === 'open' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs"
                    disabled={resolveComplaintMutation.isPending}
                    onClick={() => activeComplaint && resolveComplaintMutation.mutate(activeComplaint.id)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {resolveComplaintMutation.isPending ? "Resolving..." : "Mark Resolved"}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5">
            {isLoadingMessages ? (
              <div className="text-center py-10 text-muted-foreground">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground italic">No messages yet.</div>
            ) : messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === '00000000-0000-0000-0000-000000000000' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender_id === '00000000-0000-0000-0000-000000000000'
                  ? 'bg-primary text-primary-foreground rounded-tr-none'
                  : 'bg-muted border border-border/30 rounded-tl-none text-foreground'
                  }`}>
                  {msg.message}
                  <div className={`text-[10px] mt-1 opacity-70 ${msg.sender_id === '00000000-0000-0000-0000-000000000000' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border/30 bg-background/50 backdrop-blur-sm">
            <div className="flex gap-2">
              <Input
                placeholder="Type your response..."
                className="bg-background/80"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newMessage && sendMessageMutation.mutate({ complaintId: activeComplaint!.id, message: newMessage })}
              />
              <Button
                className="gap-2"
                disabled={!newMessage || sendMessageMutation.isPending}
                onClick={() => sendMessageMutation.mutate({ complaintId: activeComplaint!.id, message: newMessage })}
              >
                Send <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >

      {/* Withdrawal Rejection Reason Dialog */}
      <Dialog open={isWithdrawalRejectModalOpen} onOpenChange={setIsWithdrawalRejectModalOpen}>
        <DialogContent className="glass border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Decline Withdrawal Request
            </DialogTitle>
            <DialogDescription>
              Provide a reason for declining this withdrawal. The user will be notified and may retry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedWithdrawalTx && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border/20 text-sm">
                <div className="font-medium">{selectedWithdrawalTx.profiles?.display_name}</div>
                <div className="text-destructive font-mono font-bold text-lg">
                  -{selectedWithdrawalTx.profiles?.currency} {selectedWithdrawalTx.amount?.toLocaleString()}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g. Account verification required, Insufficient documentation..."
                className="min-h-[100px] bg-muted/30 border-border/50"
                value={withdrawalRejectReason}
                onChange={(e) => setWithdrawalRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawalRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!withdrawalRejectReason.trim()}
              onClick={async () => {
                if (!selectedWithdrawalTx) return;
                try {
                  await rejectWithdrawal(selectedWithdrawalTx.id, selectedWithdrawalTx.profiles!.id, withdrawalRejectReason);
                  toast({ title: "Declined", description: "The withdrawal request has been declined and the user notified." });
                  queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
                  queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                  setIsWithdrawalRejectModalOpen(false);
                } catch (e: any) {
                  toast({ title: "Error", description: e.message, variant: "destructive" });
                }
              }}
            >
              <XCircle className="w-4 h-4 mr-1" /> Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Currency Modal */}
      <Dialog open={isCurrencyModalOpen} onOpenChange={setIsCurrencyModalOpen}>
        <DialogContent className="glass border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              {editingCurrency?.id ? "Edit Currency" : "Add New Currency"}
            </DialogTitle>
            <DialogDescription>
              Configure the currency details and its exchange rate relative to USD.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency Name</Label>
                <Input
                  value={editingCurrency?.name || ""}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, name: e.target.value })}
                  placeholder="e.g. US Dollar"
                />
              </div>
              <div className="space-y-2">
                <Label>Code (ISO)</Label>
                <Input
                  value={editingCurrency?.code || ""}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. USD"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  value={editingCurrency?.symbol || ""}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, symbol: e.target.value })}
                  placeholder="e.g. $"
                />
              </div>
              <div className="space-y-2">
                <Label>Exchange Rate (to USD)</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={editingCurrency?.exchange_rate || 0}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, exchange_rate: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="currency-active"
                checked={editingCurrency?.is_active}
                onChange={(e) => setEditingCurrency({ ...editingCurrency, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="currency-active">Active and selectable by users</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCurrencyModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveCurrencyMutation.mutate(editingCurrency!)}
              disabled={!editingCurrency?.name || !editingCurrency?.code || saveCurrencyMutation.isPending}
            >
              {editingCurrency?.id ? "Save Changes" : "Create Currency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout >
  );
};

export default Admin;
