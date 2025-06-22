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
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
          <SidebarTrigger />
          <AppBreadcrumb />
        </header>
        {children}
      </main>
    </SidebarProvider>
  );
}