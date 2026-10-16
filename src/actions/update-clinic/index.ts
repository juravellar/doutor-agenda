"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { isAcceptablePhone, isValidPhone } from "@/helpers/phone";
import { UserFacingError } from "@/lib/action-errors";
import { recordAudit } from "@/lib/audit";
import { clinicWriteActionClient } from "@/lib/clinic-action";

import { INVALID_PHONE_MESSAGE, updateClinicSchema } from "./schema";

// An empty field clears the column; a field left out of the call (undefined,
// which Drizzle skips) keeps what is stored.
const optional = (value: string | undefined) =>
  value === undefined ? undefined : value || null;

export const updateClinic = clinicWriteActionClient
  .schema(updateClinicSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db.transaction(async (tx) => {
      // An incomplete phone passes only if it is the one already saved.
      if (parsedInput.phoneNumber && !isValidPhone(parsedInput.phoneNumber)) {
        const saved = await tx.query.clinicsTable.findFirst({
          columns: { phoneNumber: true },
          where: eq(clinicsTable.id, ctx.clinic.id),
        });
        if (!isAcceptablePhone(parsedInput.phoneNumber, saved?.phoneNumber)) {
          throw new UserFacingError(INVALID_PHONE_MESSAGE);
        }
      }
      await tx
        .update(clinicsTable)
        .set({
          name: parsedInput.name,
          address: optional(parsedInput.address),
          phoneNumber: optional(parsedInput.phoneNumber),
          brandColor: optional(parsedInput.brandColor?.toLowerCase()),
          logoDataUrl: optional(parsedInput.logoDataUrl),
        })
        .where(eq(clinicsTable.id, ctx.clinic.id));
      await recordAudit(
        {
          userId: ctx.user.id,
          clinicId: ctx.clinic.id,
          action: "clinic.updated",
          entityId: ctx.clinic.id,
        },
        tx,
      );
    });
    revalidatePath("/", "layout");
  });
