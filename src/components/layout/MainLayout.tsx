import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative overflow-hidden">
        {/* Background orbs for ambient glow */}
        <div className="orb orb-pink w-96 h-96 -top-48 -right-48 animate-glow" />
        <div className="orb orb-orange w-80 h-80 bottom-20 -left-40 animate-glow" style={{ animationDelay: '2s' }} />
        <div className="orb orb-purple w-64 h-64 top-1/2 right-1/4 animate-glow" style={{ animationDelay: '1s' }} />
        
        <AppSidebar />
        <main className="flex-1 flex flex-col relative z-10">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/30 bg-background/60 backdrop-blur-xl px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <h1 className="font-display text-xl font-semibold tracking-tight text-iridescent">HOTEL MANAGER</h1>
          </header>
          <div className="flex-1 p-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
