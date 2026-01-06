import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";


export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" replace />;
}
