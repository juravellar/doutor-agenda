"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Stripe brings the user back here right after paying, often before its
// webhook has updated the plan. Re-rendering a few seconds later picks the new
// plan up for the sidebar and the banner, then the marker leaves the URL.
const REFRESH_AFTER_MS = [3_000, 8_000];

export function CheckoutReturnRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returned = searchParams.get("assinatura") === "confirmada";

  useEffect(() => {
    if (!returned) {
      return;
    }
    const timers = REFRESH_AFTER_MS.map((delay, index) =>
      setTimeout(() => {
        if (index === REFRESH_AFTER_MS.length - 1) {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("assinatura");
          const query = params.toString();
          router.replace(query ? `${pathname}?${query}` : pathname);
        }
        router.refresh();
      }, delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [returned, router, pathname, searchParams]);

  return null;
}
