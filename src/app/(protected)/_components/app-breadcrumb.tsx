"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { pageTitle } from "@/lib/routes";

import { useSessionUser } from "./session-provider";

// Where the user is: the clinic they're working in, then the page.
export function AppBreadcrumb() {
  const pathname = usePathname();
  const { clinic } = useSessionUser();
  const title = pageTitle(pathname);
  const onDashboard = pathname.startsWith("/dashboard");

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {clinic && (
          <>
            <BreadcrumbItem className="min-w-0">
              {onDashboard ? (
                <span className="truncate">{clinic.name}</span>
              ) : (
                <BreadcrumbLink asChild className="truncate">
                  <Link href="/dashboard" prefetch={false}>
                    {clinic.name}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {title && <BreadcrumbSeparator />}
          </>
        )}
        {title && (
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbPage className="font-medium">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
