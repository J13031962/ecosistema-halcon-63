import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarByRole } from "./SidebarByRole";
import { useAuthConsolidatedContext } from "@/contexts/AuthContextConsolidated";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuthConsolidatedContext();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarByRole />
        <main className="flex-1 overflow-auto">
          <header className="h-12 flex items-center border-b bg-background px-4">
            <SidebarTrigger className="mr-4" />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold">ECOSISTEMA HALCON</h1>
              <p className="text-xs text-muted-foreground">Sistema integral administrativo de Teleguardia.com</p>
            </div>
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}