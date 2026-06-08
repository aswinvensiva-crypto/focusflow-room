import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { toast } from "sonner";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";

import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import NewBooking from "@/pages/NewBooking";
import EditBooking from "@/pages/EditBooking";
import Calendar from "@/pages/Calendar";
import Rooms from "@/pages/Rooms";
import Customers from "@/pages/Customers";
import Expenses from "@/pages/Expenses";
import UserManagement from "@/pages/UserManagement";
import RequireAdmin from "@/components/RequireAdmin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function RequireAuth() {
  const { user, loading, signOut } = useAuth();
  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    setChecking(true);
    supabase
      .from("blocked_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          setBlocked(true);
          toast.error("Your access has been restricted by an administrator.");
          await signOut();
        }
        setChecking(false);
      });
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user || blocked) {
    return <Navigate to="/auth" replace />;
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />

              <Route element={<RequireAuth />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/bookings/new" element={<NewBooking />} />
                <Route path="/bookings/:id" element={<EditBooking />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/rooms" element={<Rooms />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/users" element={<RequireAdmin><UserManagement /></RequireAdmin>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
