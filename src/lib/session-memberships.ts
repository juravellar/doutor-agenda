import { eq } from "drizzle-orm";

import { db } from "@/db";
import { usersToClinicsTable } from "@/db/schema";

// The user's clinics as the session needs them. Runs on every request, so it
// selects only what the session uses: a clinic row also holds its logo, up to
// ~150 KB, of which only "is there one" is read.
export const loadSessionMemberships = (userId: string) =>
  db.query.usersToClinicsTable.findMany({
    where: eq(usersToClinicsTable.userId, userId),
    columns: { clinicId: true, createdAt: true, keptInPlan: true },
    with: {
      clinic: {
        columns: {
          id: true,
          name: true,
          createdAt: true,
          logoUpdatedAt: true,
          brandColor: true,
        },
        extras: (clinic, { sql }) => ({
          hasLogo: sql<boolean>`${clinic.logoDataUrl} is not null`.as(
            "has_logo",
          ),
        }),
      },
    },
  });

type SessionMembership = Awaited<
  ReturnType<typeof loadSessionMemberships>
>[number];

// The active clinic's color and logo version for the layout. The version is
// when the logo last changed, so a new logo gets a new URL and other edits
// to the clinic keep the cached one.
export const sessionBranding = (
  memberships: SessionMembership[],
  activeClinicId: string | undefined,
) => {
  const clinic = memberships.find(
    ({ clinicId }) => clinicId === activeClinicId,
  )?.clinic;
  if (!clinic) {
    return null;
  }
  return {
    brandColor: clinic.brandColor,
    logoVersion: clinic.hasLogo
      ? String(clinic.logoUpdatedAt?.getTime() ?? clinic.createdAt.getTime())
      : null,
  };
};
