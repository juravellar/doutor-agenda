"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useResourceName } from "@/hooks/use-resource-name";
import { isUUID } from "@/lib/utils";

const pathTranslations: Record<string, string> = {
  dashboard: "Dashboard",
  doctors: "Médicos",
  patients: "Pacientes",
  appointments: "Agendamentos",
  new: "Adicionar",
  edit: "Editar",
  subscription: "Assinatura",
};

type ResourceType = "patients" | "doctors" | "appointments";

interface ResourceNameProps {
  id: string;
  resourceType: ResourceType;
}

const ResourceName: React.FC<ResourceNameProps> = ({ id, resourceType }) => {
  const name = useResourceName(id, resourceType);
  return <>{name || "Carregando..."}</>;
};

const outrosRoutes = ["/subscription"];

function getSidebarGroupLabel(pathname: string): string {
  if (outrosRoutes.some((route) => pathname.startsWith(route))) {
    return "Outros";
  }
  return "Menu Principal";
}

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const sidebarGroupLabel = getSidebarGroupLabel(`/${segments[0] || ""}`);

  return (
    <div className="flex min-h-[60px] items-center">
      <Breadcrumb aria-label="breadcrumb">
        <BreadcrumbList className="flex items-center">
          <BreadcrumbItem className="flex items-center">
            <BreadcrumbLink asChild>
              <Link
                className="flex h-10 items-center"
                href={
                  sidebarGroupLabel === "Outros"
                    ? "/subscription"
                    : "/dashboard"
                }
              >
                {sidebarGroupLabel}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join("/")}`;
            const isLast = index === segments.length - 1;
            const previousSegment = segments[index - 1];
            const isId = isUUID(segment);
            const isResource =
              previousSegment &&
              ["patients", "doctors", "appointments"].includes(previousSegment);
            const resourceType = isResource
              ? (previousSegment as ResourceType)
              : undefined;
            const name =
              pathTranslations[segment] ||
              segment.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

            const breadcrumbContent =
              isId && resourceType ? (
                <ResourceName id={segment} resourceType={resourceType} />
              ) : (
                name
              );

            return (
              <React.Fragment key={href}>
                <BreadcrumbSeparator className="text-primary flex items-center" />
                <BreadcrumbItem className="flex items-center">
                  {isLast ? (
                    <BreadcrumbPage className="text-primary flex h-10 items-center font-bold">
                      {breadcrumbContent}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild className="text-primary font-bold">
                      <Link href={href} className="flex h-10 items-center">
                        {breadcrumbContent}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
