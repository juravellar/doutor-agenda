"use server";

import { z } from "zod";

import { db } from "@/db";
import { computeAvailableTimes } from "@/lib/available-times";
import { clinicActionClient } from "@/lib/clinic-action";

export const getAvailableTimes = clinicActionClient
  .schema(
    z.object({
      doctorId: z.string().uuid(),
      date: z.string().date(), // YYYY-MM-DD,
      // The appointment being edited, whose own slot must stay selectable.
      ignoreAppointmentId: z.string().uuid().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) =>
    computeAvailableTimes(db, { ...parsedInput, clinicId: ctx.clinic.id }),
  );
