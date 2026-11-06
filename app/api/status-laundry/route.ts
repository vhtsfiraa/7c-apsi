import { authorizeApiRole } from "@/app/lib/api-auth";
import { ensureLaundryStatuses } from "@/app/lib/laundry";
import { getPrismaClient } from "@/app/lib/prisma";

export async function GET() {
  const authorization = await authorizeApiRole("Kasir");
  if (authorization.response) return authorization.response;
  try {
    const statuses = await ensureLaundryStatuses(getPrismaClient());
    return Response.json({ statuses });
  } catch (error) {
    console.error("Gagal membaca master status laundry:", error);
    return Response.json({ error: "Master status laundry tidak dapat dimuat." }, { status: 500 });
  }
}
