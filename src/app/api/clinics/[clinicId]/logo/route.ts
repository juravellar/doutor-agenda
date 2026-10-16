import { eq } from "drizzle-orm";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { decodeLogo } from "@/lib/branding";
import { getServerSession } from "@/lib/server-session";

// The clinic's logo as an image, for members of that clinic only. The layout
// links to it instead of embedding the data URL, which made every refresh of
// the layout download the logo again.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const session = await getServerSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { clinicId } = await params;
  if (!session.user.clinics.some((clinic) => clinic.id === clinicId)) {
    return new Response("Not found", { status: 404 });
  }
  const clinic = await db.query.clinicsTable.findFirst({
    columns: { logoDataUrl: true },
    where: eq(clinicsTable.id, clinicId),
  });
  const logo = decodeLogo(clinic?.logoDataUrl);
  if (!logo) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(Buffer.from(logo.base64, "base64"), {
    headers: {
      "Content-Type": logo.contentType,
      // The URL carries the logo's version (see clinicLogoUrl).
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
