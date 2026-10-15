import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  CLINIC_READ_ONLY_MESSAGE,
  writeBlockReason,
} from "@/lib/free-period";
import { actionClient } from "@/lib/next-safe-action";
import { PlanLimitError } from "@/lib/plan-limits";

// Actions on the signed-in user's clinic. ctx.clinic is the only clinic an
// action may touch; resources from other clinics must be treated as missing.
export const clinicActionClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const { clinic } = session.user;
  if (!clinic) {
    throw new Error("Clínica não encontrada");
  }
  return next({ ctx: { user: session.user, clinic } });
});

// Every action that creates, edits or deletes clinic data must use this
// client, so Free clinics past their period stay read-only in one place.
export const clinicWriteActionClient = clinicActionClient.use(
  async ({ next, ctx }) => {
    const reason = writeBlockReason(ctx.user);
    if (reason) {
      throw new PlanLimitError(
        reason === CLINIC_READ_ONLY_MESSAGE
          ? `${reason} Escolha as clínicas ativas em Minhas clínicas ou faça upgrade.`
          : `${reason} Assine um plano para voltar a cadastrar e editar.`,
      );
    }
    return next();
  },
);
