import { Home, CalendarDays, Building2, Users, LogOut, Receipt, Sparkles, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Rooms", url: "/rooms", icon: Building2 },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Expenses", url: "/expenses", icon: Receipt },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { signOut, user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/30 bg-sidebar-background/80 backdrop-blur-xl">
      <SidebarContent className="pt-6">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {open && (
              <span className="font-display text-lg font-semibold tracking-tight text-iridescent">
                HOTEL MANAGER
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3 mt-4">
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border/30 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sidebar-accent/50">
              {open && (
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium text-sm text-sidebar-foreground truncate">{user?.email}</span>
                  <span className="text-xs text-primary">Administrator</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="shrink-0 text-sidebar-foreground/60 hover:text-primary hover:bg-primary/10"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
