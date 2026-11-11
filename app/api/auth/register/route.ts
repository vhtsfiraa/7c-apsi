import { NextResponse } from "next/server";
import { createRecordId } from "@/app/api/_lib/erd";
import { getPrismaClient } from "@/app/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format pendaftaran tidak valid." }, { status: 400 });
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Format pendaftaran tidak valid." }, { status: 400 });
  }

  const nameValue = body.nama ?? body.Nama_Member;
  const phoneValue = body.nomor_telepon ?? body.No_HP;
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const phoneInput = typeof phoneValue === "string"
    ? phoneValue.trim()
    : "";
  const phone = phoneInput.replace(/\D/g, "");
  if (!name || name.length > 100) {
    return NextResponse.json(
      { error: "Nama lengkap wajib diisi (maksimal 100 karakter)." },
      { status: 400 },
    );
  }
  if (!/^\+?[\d\s().-]{8,24}$/.test(phoneInput) || !/^\d{8,15}$/.test(phone)) {
    return NextResponse.json(
      { error: "Nomor HP harus berisi 8 sampai 15 digit yang valid." },
      { status: 400 },
    );
  }

  try {
    const prisma = getPrismaClient();
    const existing = await prisma.member.findFirst({ where: { No_HP: phone } });
    if (existing) {
      return NextResponse.json({ error: "Nomor HP sudah terdaftar." }, { status: 409 });
    }

    const member = await prisma.member.create({
      data: {
        ID_Member: createRecordId("MBR-", 20),
        Nama_Member: name,
        No_HP: phone,
      },
    });
    const user = {
      ID_Member: member.ID_Member,
      Nama_Member: member.Nama_Member,
      No_HP: member.No_HP,
      id_user: member.ID_Member,
      nama: member.Nama_Member,
      username: member.ID_Member,
      nomor_telepon: member.No_HP,
      role: "Member",
    };
    return NextResponse.json(
      {
        message: "Pendaftaran berhasil.",
        user,
        credentials: { username: member.ID_Member, password: member.No_HP },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Pendaftaran member gagal:", error);
    return NextResponse.json(
      { error: "Pendaftaran gagal disimpan. Periksa konfigurasi database." },
      { status: 500 },
    );
  }
}
