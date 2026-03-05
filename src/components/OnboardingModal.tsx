import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const COUNTRIES = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "China", "India", "Brazil",
    "Nigeria", "South Africa", "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Bahrain", "Egypt", "Turkey",
    "Singapore", "Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "South Korea", "Spain", "Italy", "Netherlands",
    "Switzerland", "Sweden", "Norway", "Denmark", "Finland", "Ireland", "Portugal", "Greece", "Russia", "Mexico",
    "Argentina", "Chile", "Colombia", "Peru", "Israel", "New Zealand", "Pakistan", "Bangladesh", "Kenya", "Ghana"
].sort();

export function OnboardingModal() {
    const { profile, refreshProfile } = useAuth();
    const { language, isRTL } = useLanguage();
    const t = translations[language].onboardingModal;
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
    const [country, setCountry] = useState("");
    const [phone, setPhone] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        if (profile && !profile.onboarding_completed) {
            setOpen(true);
            setFullName(profile.display_name || "");
            setAvatarUrl(profile.avatar_url || null);
        } else {
            setOpen(false);
        }
    }, [profile]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!e.target.files || e.target.files.length === 0) return;
            const file = e.target.files[0];
            const fileExt = file.name.split(".").pop();
            const filePath = `${profile?.user_id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("profiles")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("profiles")
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t.uploadFailed,
                description: error.message,
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !address || !country || !phone) {
            toast({
                variant: "destructive",
                title: t.incompleteForm,
                description: t.incompleteFormDesc,
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    display_name: fullName,
                    avatar_url: avatarUrl,
                    home_address: address,
                    country: country,
                    phone_number: phone,
                    onboarding_completed: true,
                })
                .eq("user_id", profile?.user_id);

            if (error) throw error;

            toast({
                title: t.profileCompleted,
                description: t.welcomeMessage,
            });

            await refreshProfile();
            setOpen(false);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t.updateFailed,
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !loading && setOpen(val)}>
            <DialogContent className="sm:max-w-[500px] glass-strong border-white/10 p-0 overflow-hidden">
                <div className="relative h-24 bg-gradient-to-r from-primary/30 to-primary/10 flex items-center justify-center">
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-xl">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="w-8 h-8 text-muted-foreground" />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-lg border-2 border-background">
                                <Camera className="w-4 h-4 text-primary-foreground" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading || loading} />
                            </label>
                        </div>
                    </div>
                </div>

                <div className={`pt-14 pb-6 px-8 text-center ${isRTL ? "text-right" : "text-left"}`}>
                    <DialogHeader className={`mb-6 ${isRTL ? "text-right" : "text-left"}`}>
                        <DialogTitle className="text-2xl font-display font-bold text-foreground">{t.title}</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {t.subtitle}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
                        <div className="space-y-2">
                            <Label htmlFor="fullname">{t.fullName}</Label>
                            <Input
                                id="fullname"
                                placeholder={t.fullNamePlaceholder}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="bg-background/50 border-border/50"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">{t.phone}</Label>
                                <Input
                                    id="phone"
                                    placeholder={t.phonePlaceholder}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="bg-background/50 border-border/50"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">{t.country}</Label>
                                <Select value={country} onValueChange={setCountry} disabled={loading}>
                                    <SelectTrigger className="bg-background/50 border-border/50">
                                        <SelectValue placeholder={t.selectCountry} />
                                    </SelectTrigger>
                                    <SelectContent className="glass shadow-2xl border-white/10 max-h-[200px]" dir={isRTL ? "rtl" : "ltr"}>
                                        {COUNTRIES.map((c) => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">{t.address}</Label>
                            <Input
                                id="address"
                                placeholder={t.addressPlaceholder}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="bg-background/50 border-border/50"
                                required
                                disabled={loading}
                            />
                        </div>

                        <Button type="submit" className="w-full mt-6 h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20" disabled={loading || uploading}>
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t.submit} <CheckCircle2 className="w-5 h-5" /></>}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
