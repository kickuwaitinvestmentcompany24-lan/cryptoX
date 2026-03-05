import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import KYC from "./pages/KYC";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import HowItWorks from "./pages/HowItWorks";
import InvestmentPlans from "./pages/InvestmentPlans";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import AdminRoute from "./components/AdminRoute";
import AdminLogin from "./pages/AdminLogin";
import AdminSignUp from "./pages/AdminSignUp";
import UserRoute from "./components/UserRoute";
import UserLayout from "./components/UserLayout";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/admin/signup" element={<AdminSignUp />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />

              <Route
                element={
                  <UserRoute>
                    <UserLayout />
                  </UserRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/plans" element={<InvestmentPlans />} />
                <Route path="/kyc" element={<KYC />} />
              </Route>

              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />

              {/* Fallback for other /admin paths to ensure protection */}
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <LanguageSwitcher />
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
