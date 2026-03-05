import { supabase } from "./supabase";

export type kyc_status = 'none' | 'pending' | 'approved' | 'rejected';
export type transaction_type = 'deposit' | 'withdrawal' | 'investment';
export type transaction_status = 'pending' | 'approved' | 'rejected';
export type complaint_status = 'open' | 'resolved';

export type Profile = {
    id: string;         // Random UUID from profiles table
    user_id: string;    // Reference to auth.users.id
    display_name: string | null;
    avatar_url: string | null;
    balance: number;
    investment: number;
    currency: string;
    kyc_status: kyc_status;
    is_suspended: boolean;
    home_address: string | null;
    country: string | null;
    phone_number: string | null;
    onboarding_completed: boolean;
    kyc_document_url: string | null;
    kyc_rejection_reason: string | null;
    show_kyc_notification: boolean;
    profit: number;
    withdrawal_step: number;
    withdrawal_card_status: transaction_status;
    withdrawal_activation_status: transaction_status;
    withdrawal_code_status: transaction_status;
    last_withdrawal_amount: number | null;
    last_withdrawal_method: string | null;
    created_at: string;
};

export type Transaction = {
    id: string;
    user_id: string;
    type: transaction_type;
    amount: number;
    status: transaction_status;
    receipt_url: string | null;
    metadata: any; // Using any for flexible step tracking
    rejection_reason: string | null;
    created_at: string;
    profiles?: Profile; // Joined data
};

export type Complaint = {
    id: string;
    user_id: string;
    subject: string;
    status: complaint_status;
    created_at: string;
    profiles?: Profile; // Joined data
};

export type ComplaintMessage = {
    id: string;
    complaint_id: string;
    sender_id: string;
    message: string;
    created_at: string;
};

export type InvestmentPlan = {
    id: string;
    name: string;
    min_amount: number;
    max_amount: number;
    daily_profit: number;
    duration: number; // in days
    start_time?: string;
    end_time?: string;
};

export type ActiveInvestment = {
    id: string;
    user_id: string;
    plan_id: string | null;
    plan_name: string;
    amount: number;
    daily_profit: number;
    duration_days: number;
    start_time: string;
    end_time: string;
    expected_total_profit: number;
    status: 'active' | 'completed';
    created_at: string;
};

export type DepositMethod = {
    id: string;
    name: string;
    details: string;
    account_number?: string;
    instructions?: string;
    is_active: boolean;
};

export type AboutUs = {
    title: string;
    content: string;
};

// Site-wide content (About Us) - could be moved to a 'settings' table later
const DEFAULT_ABOUT_US: AboutUs = {
    title: "Empowering Your Financial Future",
    content: "At CRYPTOX, we believe in the transformative power of blockchain technology. Our platform is designed to provide institutional-grade tools and security to everyday investors, ensuring that everyone has the opportunity to participate in the future of finance with confidence and clarity."
};

export const getAboutUs = async (): Promise<AboutUs> => {
    // For now, keep in localStorage or simple return
    const stored = localStorage.getItem("about_us");
    return stored ? JSON.parse(stored) : DEFAULT_ABOUT_US;
};

export const saveAboutUs = (data: AboutUs) => {
    localStorage.setItem("about_us", JSON.stringify(data));
};

// Supabase helper functions

export const getProfiles = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Profile[];
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);
    if (error) throw error;
    return data;
};

export const getTransactions = async (userId?: string, type?: transaction_type) => {
    let query = supabase.from('transactions').select('*, profiles(*)').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (error) throw error;
    return data as Transaction[];
};

export const approveDeposit = async (txId: string, userId: string, amount: number) => {
    // Start by updating transaction status
    const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'approved', amount })
        .eq('id', txId);

    if (txError) throw txError;

    // Fetch current balance
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

    if (profileError) throw profileError;

    // Update balance
    const newBalance = (profile.balance || 0) + amount;
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);

    if (updateError) throw updateError;

    return true;
};

export const updateTransactionStatus = async (id: string, status: transaction_status) => {
    const { data, error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', id);
    if (error) throw error;
    return data;
};

export const getComplaints = async () => {
    const { data, error } = await supabase
        .from('complaints')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Complaint[];
};

export const getUserComplaints = async (profileId: string) => {
    const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Complaint[];
};

export const createComplaint = async (profileId: string, subject: string) => {
    const { data, error } = await supabase
        .from('complaints')
        .insert([{ user_id: profileId, subject, status: 'open' }])
        .select()
        .single();
    if (error) throw error;
    return data as Complaint;
};

export const resolveComplaint = async (complaintId: string) => {
    const { error } = await supabase
        .from('complaints')
        .update({ status: 'resolved' })
        .eq('id', complaintId);
    if (error) throw error;
};

export const getComplaintMessages = async (complaintId: string) => {
    const { data, error } = await supabase
        .from('complaint_messages')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data as ComplaintMessage[];
};

export type PlatformSetting = {
    id: string;
    key: string;
    value: any;
    updated_at: string;
};

export const getPlatformSettings = async () => {
    const { data, error } = await supabase
        .from('platform_settings')
        .select('*');
    if (error) throw error;
    return data as PlatformSetting[];
};

export const updatePlatformSetting = async (key: string, value: any) => {
    const { data, error } = await supabase
        .from('platform_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
    return data;
};

export const sendComplaintMessage = async (complaintId: string, senderId: string, message: string) => {
    const { data, error } = await supabase
        .from('complaint_messages')
        .insert([{ complaint_id: complaintId, sender_id: senderId, message }]);
    if (error) throw error;
    return data;
};

// User-side: gets sender_id from the live auth session to avoid FK mismatches
export const sendUserComplaintMessage = async (complaintId: string, message: string) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');
    const { data, error } = await supabase
        .from('complaint_messages')
        .insert([{ complaint_id: complaintId, sender_id: user.id, message }]);
    if (error) throw error;
    return data;
};
export const getInvestmentPlans = async () => {
    const { data, error } = await supabase
        .from('investment_plans')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data as InvestmentPlan[];
};

export const saveInvestmentPlan = async (plan: Partial<InvestmentPlan>) => {
    const { data, error } = await supabase
        .from('investment_plans')
        .upsert(plan)
        .select()
        .single();
    if (error) throw error;
    return data as InvestmentPlan;
};

export const deleteInvestmentPlan = async (id: string) => {
    const { error } = await supabase
        .from('investment_plans')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

export const investInPlan = async (profileId: string, plan: InvestmentPlan, amount: number) => {
    // 1. Get current profile to check balance
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance, investment')
        .eq('id', profileId)
        .single();
    if (profileError) throw profileError;

    if (profile.balance < amount) {
        throw new Error('Insufficient balance');
    }

    const startTime = new Date();
    const endTime = new Date();
    endTime.setDate(startTime.getDate() + plan.duration);

    const expectedTotalProfit = (amount * plan.daily_profit / 100) * plan.duration;

    // 2. Deduct balance and update total investment
    const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
            balance: profile.balance - amount,
            investment: (profile.investment || 0) + amount
        })
        .eq('id', profileId);
    if (updateProfileError) throw updateProfileError;

    // 3. Create active investment record
    const { error: investError } = await supabase
        .from('active_investments')
        .insert([{
            user_id: profileId,
            plan_id: plan.id,
            plan_name: plan.name,
            amount: amount,
            daily_profit: plan.daily_profit,
            duration_days: plan.duration,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            expected_total_profit: expectedTotalProfit,
            status: 'active'
        }]);
    if (investError) throw investError;

    // 4. Record as an investment transaction
    const { error: txError } = await supabase
        .from('transactions')
        .insert([{
            user_id: profileId,
            type: 'investment',
            amount: amount,
            status: 'approved',
            metadata: { plan_name: plan.name }
        }]);
    if (txError) throw txError;

    return true;
};

export const getActiveInvestments = async (profileId: string) => {
    const { data, error } = await supabase
        .from('active_investments')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as ActiveInvestment[];
};

export const submitClearancePayment = async (profileId: string, step: number, amount: number, receiptUrl: string) => {
    const statusField = step === 1 ? 'withdrawal_card_status' :
        step === 2 ? 'withdrawal_activation_status' :
            'withdrawal_code_status';

    // 1. Create a metadata-tagged transaction
    const { error: txError } = await supabase
        .from('transactions')
        .insert([{
            user_id: profileId,
            type: 'deposit', // Clearance payments are treated as deposits of fees
            amount,
            status: 'pending',
            receipt_url: receiptUrl,
            metadata: { clearance_step: step }
        }]);

    if (txError) throw txError;

    // 2. Update user profile step status
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ [statusField]: 'pending' })
        .eq('id', profileId);

    if (profileError) throw profileError;

    return true;
};

export const approveWithdrawal = async (txId: string, profileId: string) => {
    const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'approved' })
        .eq('id', txId);
    if (txError) throw txError;

    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            withdrawal_step: 1,
            withdrawal_card_status: 'none',
            withdrawal_activation_status: 'none',
            withdrawal_code_status: 'none',
            last_withdrawal_amount: null,
            last_withdrawal_method: null
        })
        .eq('id', profileId);
    if (profileError) throw profileError;

    return true;
};

export const rejectWithdrawal = async (txId: string, profileId: string, reason: string) => {
    const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', txId);
    if (txError) throw txError;

    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            withdrawal_step: 1,
            withdrawal_card_status: 'none',
            withdrawal_activation_status: 'none',
            withdrawal_code_status: 'none',
            last_withdrawal_amount: null,
            last_withdrawal_method: null
        })
        .eq('id', profileId);
    if (profileError) throw profileError;

    return true;
};
export const approveClearancePayment = async (txId: string, profileId: string, step: number) => {
    const statusField = step === 1 ? 'withdrawal_card_status' :
        step === 2 ? 'withdrawal_activation_status' :
            'withdrawal_code_status';

    const nextStep = step + 1;

    // 1. Approve the transaction
    const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'approved' })
        .eq('id', txId);

    if (txError) throw txError;

    // 2. Update profile: mark step as approved and increment current step
    const updates: any = { [statusField]: 'approved' };
    if (step < 3) updates.withdrawal_step = nextStep;

    const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId);

    if (profileError) throw profileError;

    return true;
};
