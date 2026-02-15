import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import NotFound from "./pages/NotFound";

// Admin Imports
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import VerificationPanel from "./pages/admin/VerificationPanel";
import TurfVerificationDetail from "./pages/admin/TurfVerificationDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Default Route -> Admin Login */}
          <Route path="/" element={<Navigate to="/manage/login" replace />} />

          <Route path="/login" element={<Navigate to="/manage/login" replace />} />

          {/* ADMIN ROUTES */}
          <Route path="/manage/login" element={<AdminLogin />} />
          <Route path="/manage" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="verification" element={<VerificationPanel />} />
            <Route path="verification/:id" element={<TurfVerificationDetail />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
