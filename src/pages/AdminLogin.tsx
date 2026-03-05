import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, Loader2, ShieldPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const AdminLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAdmin } = useAuth();

    // Redirect if already logged in as admin
    React.useEffect(() => {
        if (user && isAdmin) {
            console.log("[AdminLogin] User already authenticated as admin, redirecting...");
            const origin = location.state?.from?.pathname || "/admin";
            navigate(origin, { replace: true });
        }
    }, [user, isAdmin, navigate, location]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user: loggedInUser }, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            console.log("[AdminLogin] Sign-in successful for:", loggedInUser?.id);
            const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', loggedInUser?.id);

            console.log("[AdminLogin] Roles fetched:", roles);
            const hasAdminRole = roles?.some(r => r.role === 'admin');

            if (rolesError || !hasAdminRole) {
                console.warn("[AdminLogin] Unauthorized: User lacks admin role or error occurred.");
                await supabase.auth.signOut();
                throw new Error("Unauthorized: Admin access required.");
            }

            console.log("[AdminLogin] Permission verified, navigating...");
            toast({
                title: "Access Granted",
                description: "Welcome back to the command center.",
            });

            const origin = location.state?.from?.pathname || "/admin";
            navigate(origin);
        } catch (error: any) {
            console.error("[AdminLogin] Login exception:", error.message || error);
            toast({
                variant: "destructive",
                title: "Authentication Failed",
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
                <CardHeader className="space-y-1 text-center pb-8">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-display text-2xl font-bold tracking-tight text-foreground">Admin Portal</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Administrative access only. Secure login required.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Work Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@emeraldhub.com"
                                required
                                className="bg-background/50 border-border/50 focus:border-primary/50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Security Code</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                className="bg-background/50 border-border/50 focus:border-primary/50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex flex-col gap-4">
                        <Button className="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Authorize Access <ArrowRight className="w-4 h-4" /></>}
                        </Button>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                            Don't have an account?
                            <Link to="/admin/signup" className="text-primary hover:underline flex items-center gap-1 font-medium">
                                <ShieldPlus className="w-3.5 h-3.5" /> Register
                            </Link>
                        </div>
                        <p className="text-center text-xs text-muted-foreground px-8 leading-relaxed">
                            By authorizing, you agree to security logging and monitoring protocols.
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default AdminLogin;
