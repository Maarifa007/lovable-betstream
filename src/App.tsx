
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminAuthFlow from "./components/AdminAuthFlow";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import Auth from "./pages/Auth";
import BetChat from "./pages/BetChat";
import Cricket from "./pages/sports/Cricket";
import Football from "./pages/sports/Football";
import Kabaddi from "./pages/sports/Kabaddi";
import Wallet from "./pages/Wallet";
import Promotions from "./pages/Promotions";
import { Helmet } from "react-helmet";
import { LanguageProvider } from "./contexts/LanguageContext";

// Create a new QueryClient instance
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <Helmet defaultTitle="BanglaBet - Betting Assistant" />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<Index />} />
            <Route path="/chat" element={<BetChat />} />
            <Route path="/sports/cricket" element={<Cricket />} />
            <Route path="/sports/football" element={<Football />} />
            <Route path="/sports/kabaddi" element={<Kabaddi />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminAuthFlow />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
