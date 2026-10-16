import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getServerSession } from "@/lib/server-session";

import { AccountStatusBanner } from "./_components/account-status-banner";
import { AppBreadcrumb } from "./_components/app-breadcrumb";
import { AppSidebar } from "./_components/app-sidebar";
import { PageTransition } from "./_components/page-transition";
import { SessionProvider } from "./_components/session-provider";
import { TermsGate } from "./_components/terms-gate";

// Reads the session once on the server for everything inside the app; the
// sidebar, banner and dialogs get it from SessionProvider.
export default async function Layout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/entrar");
  }
  return (
    <SessionProvider user={session.user}>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full min-w-0">
          <header className="bg-background flex h-10 items-center gap-4 border-b px-4">
            <SidebarTrigger />
            <AppBreadcrumb />
          </header>
          <AccountStatusBanner />
          <PageTransition>{children}</PageTransition>
          <TermsGate />
        </main>
      </SidebarProvider>
    </SessionProvider>
  );
}
