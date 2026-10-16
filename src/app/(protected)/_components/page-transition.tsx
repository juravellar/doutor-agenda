"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// A short entrance for each page: 4px of travel and a fade, 200ms on a strong
// ease-out. Keyed by path, so changing only the query (dashboard dates) keeps
// the page still.
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div
      key={pathname}
      className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
    >
      {children}
    </div>
  );
}
