import { authorizeApiRole } from "@/app/lib/api-auth";
import { getPrismaClient } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(value: string) {
  const id = Number(value);
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(id) && id <= 2_147_483_647
    ? id
    : null;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const authorization = await authorizeApiRole("Kasir");
  if (authorization.response) return authorization.response;
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ error: "ID Member tidak valid." }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format request tidak valid." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Data Member harus berupa objek." }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  const nama = typeof data.nama === "string" ? data.nama.trim() : "";
  const phone = typeof data.nomor_telepon === "string" ? data.nomor_telepon.trim() : "";
  const nomorTelepon = phone.replace(/\D/g, "");
  if (!nama || nama.length > 100) {
    return Response.json({ error: "Nama lengkap wajib diisi (maksimal 100 karakter)." }, { status: 400 });
  }
  if (!/^\+?[\d\s().-]{8,24}$/.test(phone) || !/^\d{8,15}$/.test(nomorTelepon)) {
    return Response.json({ error: "Nomor HP harus berisi 8 sampai 15 digit yang valid." }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const member = await prisma.users.findUnique({
      where: { id_user: id },
      select: { role: true },
    });
    if (!member || member.role.toLowerCase() !== "member") {
      return Response.json({ error: "Member tidak ditemukan." }, { status: 404 });
    }
    const updated = await prisma.users.update({
      where: { id_user: id },
      data: {
        nama,
        nomor_telepon: nomorTelepon,
        username: nomorTelepon,
      },
      select: { id_user: true, nama: true, username: true, nomor_telepon: true },
    });
    return Response.json({ member: updated, message: "Data Member berhasil diperbarui." });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return Response.json({ error: "Nomor HP sudah digunakan." }, { status: 409 });
    }
    console.error("Gagal memperbarui Member:", error);
    return Response.json({ error: "Data Member gagal diperbarui." }, { status: 500 });
  }
}
