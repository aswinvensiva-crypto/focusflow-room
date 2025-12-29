import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";

import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import NewBooking from "@/pages/NewBooking";
import EditBooking from "@/pages/EditBooking";
import Calendar from "@/pages/Calendar";
import Rooms from "@/pages/Rooms";
import Customers from "@/pages/Customers";
import Expenses from "@/pages/Expenses";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

/* ---------------- Auth Guard ---------------- */

function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // ✅ THIS IS THE KEY FIX
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

/* ---------------- App ---------------- */

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/auth" element={<Auth />} />

              {/* Protected */}
              <Route element={<RequireAuth />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/bookings/new" element={<NewBooking />} />
                <Route path="/bookings/:id" element={<EditBooking />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/rooms" element={<Rooms />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/expenses" element={<Expenses />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
