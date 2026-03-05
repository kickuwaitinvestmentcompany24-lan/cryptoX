import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldPlus, ArrowRight, Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Sign up the user in Supabase Auth
            const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (signUpError) throw signUpError;
            if (!user) throw new Error("Sign up failed");

            // 2. Update the profile and assign admin role
            // We wait a brief moment for the auto-profile trigger to run
            await new Promise(resolve => setTimeout(resolve, 800));

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    display_name: fullName
                })
                .eq('user_id', user.id);

            if (profileError) console.error("Error updating profile display name:", profileError);

            const { error: roleError } = await supabase
                .from('user_roles')
                .upsert({
                    user_id: user.id,
                    role: 'admin'
                });

            if (roleError) {
                console.error("Error assigned admin role:", roleError);
                throw new Error("Account created but admin permissions failed. Please contact support.");
            }

            toast({
                title: "Sign Up Successful",
                description: "Your admin account has been created. Please check your email for verification.",
            });

            navigate("/admin/login");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Registration Failed",
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
                        <ShieldPlus className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-display text-2xl font-bold tracking-tight text-foreground">Admin Registration</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Create a new administrative account.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="John Doe"
                                required
                                className="bg-background/50 border-border/50 focus:border-primary/50"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={loading}
                            />
                        </div>
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
                            <Label htmlFor="password">Security Code</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                placeholder="Choose a strong password"
                                className="bg-background/50 border-border/50 focus:border-primary/50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex flex-col gap-4">
                        <Button className="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Register Admin <ArrowRight className="w-4 h-4" /></>}
                        </Button>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                            Already have an account?
                            <Link to="/admin/login" className="text-primary hover:underline flex items-center gap-1 font-medium">
                                <LogIn className="w-3.5 h-3.5" /> Login
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default AdminSignUp;
