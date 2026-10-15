"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { clinicActionClient } from "@/lib/clinic-action";

export const switchClinic = clinicActionClient
  .schema(z.object({ clinicId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    // ctx.user.clinics comes from the user's memberships in the database.
    if (!ctx.user.clinics.some(({ id }) => id === parsedInput.clinicId)) {
      throw new Error("Clínica não encontrada");
    }
    await db
      .update(usersTable)
      .set({ activeClinicId: parsedInput.clinicId })
      .where(eq(usersTable.id, ctx.user.id));
    revalidatePath("/", "layout");
  });
