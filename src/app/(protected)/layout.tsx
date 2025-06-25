"use client";

import React from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { AppBreadcrumb } from "./_components/app-breadcrumb";
import { AppSidebar } from "./_components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <header className="bg-background flex h-10 items-center gap-4 border-b px-4">
          <SidebarTrigger />
          <AppBreadcrumb />
        </header>
        {children}
      </main>
    </SidebarProvider>
  );
}
