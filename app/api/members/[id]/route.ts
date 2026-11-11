import { authorizeApiRole } from "@/app/lib/api-auth";
import { getPrismaClient } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function validMemberId(value: string) {
  return value.length > 0 && value.length <= 20 && !/[\u0000-\u001f]/.test(value)
    ? value
    : null;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const authorization = await authorizeApiRole("Kasir");
  if (authorization.response) return authorization.response;
  const { id: rawId } = await params;
  const id = validMemberId(rawId);
  if (!id) return Response.json({ error: "ID Member tidak valid." }, { status: 400 });

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
  const nameValue = data.nama ?? data.Nama_Member;
  const phoneValue = data.nomor_telepon ?? data.No_HP;
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const phoneInput = typeof phoneValue === "string"
    ? phoneValue.trim()
    : "";
  const phone = phoneInput.replace(/\D/g, "");
  const genderValue = data.gender ?? data.Gender_Member;
  const gender = typeof genderValue === "string" ? genderValue.trim() : undefined;
  if (!name || name.length > 100) {
    return Response.json(
      { error: "Nama lengkap wajib diisi (maksimal 100 karakter)." },
      { status: 400 },
    );
  }
  if (!/^\+?[\d\s().-]{8,24}$/.test(phoneInput) || !/^\d{8,15}$/.test(phone)) {
    return Response.json(
      { error: "Nomor HP harus berisi 8 sampai 15 digit yang valid." },
      { status: 400 },
    );
  }
  if (gender !== undefined && gender.length > 20) {
    return Response.json({ error: "Gender maksimal 20 karakter." }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const current = await prisma.member.findUnique({ where: { ID_Member: id } });
    if (!current) return Response.json({ error: "Member tidak ditemukan." }, { status: 404 });
    const duplicate = await prisma.member.findFirst({
      where: { No_HP: phone, ID_Member: { not: id } },
    });
    if (duplicate) return Response.json({ error: "Nomor HP sudah digunakan." }, { status: 409 });

    const updated = await prisma.member.update({
      where: { ID_Member: id },
      data: {
        Nama_Member: name,
        No_HP: phone,
        ...(gender !== undefined ? { Gender_Member: gender || null } : {}),
      },
    });
    return Response.json({
      member: {
        ID_Member: updated.ID_Member,
        Nama_Member: updated.Nama_Member,
        No_HP: updated.No_HP,
        id_user: updated.ID_Member,
        nama: updated.Nama_Member,
        username: updated.ID_Member,
        nomor_telepon: updated.No_HP,
        gender: updated.Gender_Member,
      },
      message: "Data Member berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Gagal memperbarui Member:", error);
    return Response.json({ error: "Data Member gagal diperbarui." }, { status: 500 });
  }
}
