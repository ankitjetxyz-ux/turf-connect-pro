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
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";

import PlayerDashboard from "./pages/player/PlayerDashboard";
import ClientDashboard from "./pages/client/ClientDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import TurfSlotsPage from "./pages/client/TurfSlotsPage";
import AddTurfPage from "./pages/client/AddTurfPage";
import ClientBookings from "./pages/client/ClientBookings";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Index />} />
          <Route path="/turfs" element={<TurfsPage />} />
          <Route path="/turfs/:id" element={<TurfDetailPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
      <AddTurfPage />
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




          {/* PLAYER DASHBOARD */}
          <Route
            path="/player/dashboard"
            element={
              <ProtectedRoute role="player">
                <PlayerDashboard />
              </ProtectedRoute>
            }
          />

          {/* CLIENT DASHBOARD */}
          <Route
            path="/client/dashboard"
            element={
              <ProtectedRoute role="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />

          {/* CATCH ALL */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  
);

export default App;
