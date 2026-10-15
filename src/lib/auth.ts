import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { usersTable, usersToClinicsTable } from "@/db/schema";
import { resolveClinicAccess } from "@/lib/clinic-access";
import { isEmailConfigured, sendEmail, verificationEmail } from "@/lib/email";

export const auth = betterAuth({
  // Model names below are the exact schema keys (usersTable, ...), so no
  // pluralization: better-auth 1.7 would turn them into usersTables and fail
  // its schema check on every auth request.
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      // TODO: colocar cache
      const [userData, memberships] = await Promise.all([
        db.query.usersTable.findFirst({
          where: eq(usersTable.id, user.id),
        }),
        db.query.usersToClinicsTable.findMany({
          where: eq(usersToClinicsTable.userId, user.id),
          with: {
            clinic: true,
          },
        }),
      ]);
      const access = resolveClinicAccess(
        memberships.map((membership) => ({
          clinicId: membership.clinicId,
          name: membership.clinic.name,
          clinicCreatedAt: membership.clinic.createdAt,
          memberSince: membership.createdAt,
          keptInPlan: membership.keptInPlan,
        })),
        userData?.activeClinicId,
        userData?.plan,
      );
      return {
        user: {
          ...user,
          plan: userData?.plan,
          subscriptionStatus: userData?.subscriptionStatus,
          subscriptionEndsAt: userData?.subscriptionEndsAt,
          clinic: access.active ?? undefined,
          clinics: access.clinics,
          clinicLimit: access.clinicLimit,
          overClinicLimit: access.overClinicLimit,
          freePeriodStartsAt: access.freePeriodStartsAt,
          clinicChoiceMadeAt: userData?.clinicChoiceMadeAt ?? null,
          clinicChoiceChangedAt: userData?.clinicChoiceChangedAt ?? null,
        },
        session,
      };
    }),
  ],
  user: {
    modelName: "usersTable",
    additionalFields: {
      stripeCustomerId: {
        type: "string",
        fieldName: "stripeCustomerId",
        required: false,
      },
      stripeSubscriptionId: {
        type: "string",
        fieldName: "stripeSubscriptionId",
        required: false,
      },
      plan: {
        type: "string",
        fieldName: "plan",
        required: false,
      },
    },
  },
  session: {
    modelName: "sessionsTable",
  },
  account: {
    modelName: "accountsTable",
  },
  verification: {
    modelName: "verificationsTable",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Without verification anyone could sign up with someone else's email
    // and enter patient data under that identity.
    requireEmailVerification: isEmailConfigured(),
  },
  emailVerification: {
    sendOnSignUp: isEmailConfigured(),
    // Accounts created before verification existed get a link when they
    // next sign in, instead of being locked out.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...verificationEmail(url) });
    },
  },
});
