import { eq } from "drizzle-orm";

import { db } from "@/db";
import { usersToClinicsTable } from "@/db/schema";

// The user's clinics as the session needs them. Runs on every request, so it
// selects only what resolveClinicAccess uses: a clinic row also holds its
// logo, up to ~150 KB.
export const loadSessionMemberships = (userId: string) =>
  db.query.usersToClinicsTable.findMany({
    where: eq(usersToClinicsTable.userId, userId),
    columns: { clinicId: true, createdAt: true, keptInPlan: true },
    with: {
      clinic: { columns: { id: true, name: true, createdAt: true } },
    },
  });
