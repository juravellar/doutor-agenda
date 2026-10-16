"use client";

import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Gem,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { switchClinic } from "@/actions/switch-clinic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { authClient } from "../../../lib/auth-client";
import { BlockedCreateDialog } from "./blocked-create-dialog";
import { NewClinicDialog } from "./new-clinic-dialog";
import { useSessionUser } from "./session-provider";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: CalendarDays,
  },
  {
    title: "Médicos",
    url: "/doctors",
    icon: Stethoscope,
  },
  {
    title: "Pacientes",
    url: "/patients",
    icon: UsersRound,
  },
];

const otherItems = [
  {
    title: "Assinatura",
    url: "/subscription",
    icon: Gem,
  },
];

export function AppSidebar() {
  const router = useRouter();
  const user = useSessionUser();
  const clinics = user.clinics;
  const activeClinicId = user.clinic?.id;
  const clinicLimit = user.clinicLimit;
  const canAddClinic =
    clinicLimit === null ||
    (clinicLimit !== undefined && clinics.length < clinicLimit);
  const switchClinicAction = useAction(switchClinic, {
    onSuccess: () => {
      router.refresh();
    },
    onError: () => {
      toast.error("Não foi possível trocar de clínica.");
    },
  });
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [clinicLimitOpen, setClinicLimitOpen] = useState(false);

  // On a phone the menu is a sheet over the page; once a page is chosen it
  // must get out of the way. Covers links and the footer menu alike.
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);
  const [isOthersExpanded, setIsOthersExpanded] = useState(false);
  const [newClinicOpen, setNewClinicOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
        },
      },
    });
  };

  const isActive = (itemUrl: string) => pathname === itemUrl;

  const toggleOthersSection = () => {
    setIsOthersExpanded(!isOthersExpanded);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link
          href="/dashboard"
          prefetch={false}
          aria-label="Avelliq, ir para o dashboard"
          className="inline-block"
        >
          <span className="flex items-center gap-2">
            <Image src="/logo-symbol.svg" alt="" width={28} height={28} />
            <span className="text-xl font-semibold tracking-tight text-[#0E0A2F]">
              Avelliq
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className={
                      isActive(item.url)
                        ? "!bg-primary/5 !text-primary hover:!bg-primary/10 focus:!bg-primary/10 [&>svg]:!text-primary [&>span]:!text-primary"
                        : "hover:!bg-primary/5 hover:[&>svg]:!text-primary hover:[&>span]:!text-primary"
                    }
                  >
                    <Link href={item.url} prefetch={false}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator />
        <SidebarGroup>
          <SidebarGroupLabel
            className="hover:bg-primary/5 hover:text-primary -mx-2 -my-1 flex cursor-pointer items-center justify-between rounded-md px-2 py-1 mb-0.5"
            onClick={toggleOthersSection}
          >
            <span>Outros</span>
            {isOthersExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </SidebarGroupLabel>
          {isOthersExpanded && (
            <SidebarGroupContent>
              <SidebarMenu>
                {otherItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      className={
                        isActive(item.url)
                          ? "!bg-primary/5 !text-primary hover:!bg-primary/10 focus:!bg-primary/10 [&>svg]:!text-primary [&>span]:!text-primary"
                          : "hover:!bg-primary/5 hover:[&>svg]:!text-primary hover:[&>span]:!text-primary"
                      }
                    >
                      <Link href={item.url} prefetch={false}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar>
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.email} />
                    ) : (
                      <AvatarFallback>
                        {user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {user.clinic?.name}
                    </p>
                    <p className="text-muted-foreground truncate text-sm">
                      {user.email}
                    </p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Clínicas</DropdownMenuLabel>
                {clinics.map((clinic) => (
                  <DropdownMenuItem
                    key={clinic.id}
                    disabled={switchClinicAction.isPending}
                    onClick={() =>
                      clinic.id !== activeClinicId &&
                      switchClinicAction.execute({ clinicId: clinic.id })
                    }
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        clinic.id === activeClinicId ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex-1 truncate">{clinic.name}</span>
                    {!clinic.writable && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        Só leitura
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onClick={() =>
                    canAddClinic
                      ? setNewClinicOpen(true)
                      : setClinicLimitOpen(true)
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova clínica
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/clinics")}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Minhas clínicas
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/clinic-settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações da clínica
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  <UserRound className="mr-2 h-4 w-4" />
                  Minha conta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="focus:text-destructive mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <NewClinicDialog
              open={newClinicOpen}
              onOpenChange={setNewClinicOpen}
            />
            <BlockedCreateDialog
              open={clinicLimitOpen}
              onOpenChange={setClinicLimitOpen}
              kind="limit"
              usageText={
                clinicLimit ? `${clinics.length} de ${clinicLimit} clínicas` : null
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
