import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import TurfsPage from "./pages/TurfsPage";
import TurfDetailPage from "./pages/TurfDetailPage";
import TournamentsPage from "./pages/TournamentsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import TermsPage from "./pages/TermsPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import TurfSlotsPage from "./pages/client/TurfSlotsPage";
import AddTurfForm from "./pages/owner/add-turf/AddTurfForm";
import AddTournamentPage from "./pages/client/AddTournamentPage";
import ClientBookings from "./pages/client/ClientBookings";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";

import ScrollToTop from "./components/common/ScrollToTop";






const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Index />} />
          <Route path="/turfs" element={<TurfsPage />} />
          <Route path="/turfs/:id" element={<TurfDetailPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/forgot-password" element={<ComingSoonPage />} />
          <Route path="/partner" element={<ComingSoonPage />} />
          <Route path="/advertising" element={<ComingSoonPage />} />
          <Route path="/api-docs" element={<ComingSoonPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            path="/client/turfs/:turfId/slots"
            element={
              <ProtectedRoute role="client">
                <TurfSlotsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/add-turf"
            element={
              <ProtectedRoute role="client">
                <AddTurfForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/add-tournament"
            element={
              <ProtectedRoute role="client">
                <AddTournamentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/client/bookings"
            element={
              <ProtectedRoute role="client">
                <ClientBookings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* PLAYER DASHBOARD (redirected to unified profile/dashboard) */}
          <Route
            path="/player/dashboard"
            element={
              <ProtectedRoute role="player">
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* CLIENT DASHBOARD (redirected to unified profile/dashboard) */}
          <Route
            path="/client/dashboard"
            element={
              <ProtectedRoute role="client">
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* CATCH ALL */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>

);

export default App;
