// Display name of each page, shared by the breadcrumb and anything else that
// names a page.
export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/appointments": "Agendamentos",
  "/doctors": "Médicos",
  "/patients": "Pacientes",
  "/subscription": "Assinatura",
  "/clinics": "Minhas clínicas",
  "/clinic-settings": "Configurações da clínica",
  "/clinic-form": "Nova clínica",
  "/account": "Minha conta",
};

export const pageTitle = (pathname: string) => {
  const root = `/${pathname.split("/").filter(Boolean)[0] ?? ""}`;
  return PAGE_TITLES[root] ?? null;
};
