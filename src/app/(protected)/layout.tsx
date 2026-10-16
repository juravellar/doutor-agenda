import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { brandStylesheet, clinicLogoUrl } from "@/lib/branding";
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
  const clinicId = session.user.clinic?.id;
  // A hash of the logo, not the logo itself: the sidebar loads the image from
  // its own cacheable URL.
  const [branding] = clinicId
    ? await db
        .select({
          brandColor: clinicsTable.brandColor,
          logoVersion: sql<
            string | null
          >`left(md5(${clinicsTable.logoDataUrl}), 12)`,
        })
        .from(clinicsTable)
        .where(eq(clinicsTable.id, clinicId))
    : [];
  const brandCss = brandStylesheet(branding?.brandColor);
  const logoUrl =
    clinicId && branding?.logoVersion
      ? clinicLogoUrl(clinicId, branding.logoVersion)
      : null;
  return (
    <SessionProvider user={session.user}>
      {brandCss && <style>{brandCss}</style>}
      <SidebarProvider>
        <AppSidebar logoUrl={logoUrl} />
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
