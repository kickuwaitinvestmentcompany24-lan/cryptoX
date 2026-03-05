import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ArrowRight, Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { language } = useLanguage();
    const isAr = language === 'ar';

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: fullName,
                    }
                }
            });

            if (signUpError) throw signUpError;
            if (!user) throw new Error(isAr ? "فشل إنشاء الحساب" : "Sign up failed");

            toast({
                title: isAr ? "تم إنشاء الحساب بنجاح" : "Account Created",
                description: isAr ? "الرجاء التحقق من بريدك الإلكتروني" : "Please check your email for verification.",
            });

            navigate("/login");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: isAr ? "فشل التسجيل" : "Registration Failed",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
            </div>

            <Card className="glass w-full max-w-md border-border/50 relative z-10 shadow-2xl">
                <CardHeader className="space-y-1 text-center pb-8 rtl:text-right">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                        <UserPlus className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
                        {isAr ? "إنشاء حساب جديد" : "Create Account"}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {isAr ? "ابدأ رحلة التداول الخاصة بك اليوم" : "Start your trading journey today."}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignUp} dir={isAr ? "rtl" : "ltr"}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">{isAr ? "الاسم الكامل" : "Full Name"}</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder={isAr ? "زيدان زيدان" : "John Doe"}
                                required
                                className="bg-background/50 border-border/50 focus:border-primary/50"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{isAr ? "البريد الإلكتروني" : "Email Address"}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                className="bg-background/50 border-border/50 focus:border-primary/50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{isAr ? "كلمة المرور" : "Password"}</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="bg-background/50 border-border/50 focus:border-primary/50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex flex-col gap-4">
                        <Button className="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                <>{isAr ? "إنشاء حساب" : "Get Started"} <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} /></>}
                        </Button>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                            {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}
                            <Link to="/login" className="text-primary hover:underline flex items-center gap-1 font-medium">
                                <LogIn className="w-3.5 h-3.5" /> {isAr ? "تسجيل دخول" : "Login"}
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default SignUp;
