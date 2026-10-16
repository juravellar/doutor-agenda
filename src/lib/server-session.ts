import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "@/lib/auth";

// The session for the current request, read once: the layout and the page of
// the same request share it instead of each querying the database.
export const getServerSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof getServerSession>>
>["user"];
