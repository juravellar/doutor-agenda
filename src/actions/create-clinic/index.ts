"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { isUniqueViolation } from "@/db/clinic-lock";
import { clinicsTable, usersToClinicsTable } from "@/db/schema";

import { auth } from "../../lib/auth";

export const createClinic = async (name: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  if (session.user.clinic) {
    redirect("/dashboard");
  }

  // One clinic per user is enforced by a unique index: a concurrent submit
  // that lost the race rolls back, including its clinic row.
  try {
    await db.transaction(async (tx) => {
      const [clinic] = await tx
        .insert(clinicsTable)
        .values({
          name,
        })
        .returning();
      await tx.insert(usersToClinicsTable).values({
        userId: session.user.id,
        clinicId: clinic.id,
      });
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  redirect("/dashboard");
};
