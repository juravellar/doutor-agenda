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

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb aria-label="breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Menu Principal</Link>
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
              <BreadcrumbSeparator className="text-primary" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-bold text-primary">
                    {breadcrumbContent}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="font-bold text-primary">
                    <Link href={href}>{breadcrumbContent}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
