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
import { Loader2, Save, User as UserIcon, Phone, MapPin, Globe } from "lucide-react";
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

interface EditProfileModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ isOpen, onOpenChange }: EditProfileModalProps) {
    const { profile, user, refreshProfile } = useAuth();
    const { language, isRTL } = useLanguage();
    // Safely access translations
    const langKey = language in translations ? language : 'en';
    const t = (translations[langKey] as any).editProfile || (translations['en'] as any).editProfile;
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form states
    const [fullName, setFullName] = useState("");
    const [address, setAddress] = useState("");
    const [country, setCountry] = useState("");
    const [phone, setPhone] = useState("");

    useEffect(() => {
        if (profile && isOpen) {
            setFullName(profile.display_name || "");
            setAddress(profile.home_address || "");
            setCountry(profile.country || "");
            setPhone(profile.phone_number || "");
        }
    }, [profile, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    display_name: fullName,
                    home_address: address,
                    country: country,
                    phone_number: phone,
                })
                .eq("user_id", profile?.user_id);

            if (error) throw error;

            toast({
                title: t.success,
                description: t.successDesc,
            });

            await refreshProfile();
            onOpenChange(false);
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
        <Dialog open={isOpen} onOpenChange={(val) => !loading && onOpenChange(val)}>
            <DialogContent className="sm:max-w-[500px] glass-strong border-white/10 p-0 overflow-hidden">
                <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center px-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-xl">
                            <UserIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-display font-bold text-foreground">{t.title}</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                {user?.email}
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className={`p-8 ${isRTL ? "text-right" : "text-left"}`}>
                    <form onSubmit={handleSubmit} className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
                        <div className="space-y-2">
                            <Label htmlFor="edit-fullname" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <UserIcon className="w-3 h-3" /> {t.fullName}
                            </Label>
                            <Input
                                id="edit-fullname"
                                placeholder={t.fullNamePlaceholder}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="bg-background/50 border-border/50 h-11 focus:ring-primary/20"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <Phone className="w-3 h-3" /> {t.phone}
                                </Label>
                                <Input
                                    id="edit-phone"
                                    placeholder={t.phonePlaceholder}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="bg-background/50 border-border/50 h-11 focus:ring-primary/20"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-country" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <Globe className="w-3 h-3" /> {t.country}
                                </Label>
                                <Select value={country} onValueChange={setCountry} disabled={loading}>
                                    <SelectTrigger className="bg-background/50 border-border/50 h-11 focus:ring-primary/20">
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
                            <Label htmlFor="edit-address" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <MapPin className="w-3 h-3" /> {t.address}
                            </Label>
                            <Input
                                id="edit-address"
                                placeholder={t.addressPlaceholder}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="bg-background/50 border-border/50 h-11 focus:ring-primary/20"
                                required
                                disabled={loading}
                            />
                        </div>

                        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="w-full sm:flex-1 h-11 border-border/50 hover:bg-background/80"
                                disabled={loading}
                            >
                                {translations[langKey].dashboard.cancel || "Cancel"}
                            </Button>
                            <Button
                                type="submit"
                                className="w-full sm:flex-1 h-11 gap-2 font-bold shadow-lg shadow-primary/20"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        {t.save}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
