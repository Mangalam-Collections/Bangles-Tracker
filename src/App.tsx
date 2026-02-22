import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import LockScreen from "@/components/LockScreen";
import AppLayout from "@/components/AppLayout";
import PurchaseEntry from "./pages/PurchaseEntry";
import MonthlySummary from "./pages/MonthlySummary";
import PaymentEntry from "./pages/PaymentEntry";
import Settlement from "./pages/Settlement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LockScreen />;
  return <>{children}</>;
}

const App = () => (
  <AuthProvider>
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthGate>
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<PurchaseEntry />} />
                  <Route path="/summary" element={<MonthlySummary />} />
                  <Route path="/payments" element={<PaymentEntry />} />
                  <Route path="/settlement" element={<Settlement />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthGate>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  </AuthProvider>
);

export default App;
