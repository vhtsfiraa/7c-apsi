import { NextResponse } from "next/server";
import { authorizeApiRole } from "@/app/lib/api-auth";
import {
  createInitialPassword,
  hashPassword,
} from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function GET() {
  const authorization = await authorizeApiRole("Kasir");
  if (authorization.response) return authorization.response;
  try {
    const members = await getPrismaClient().users.findMany({
      where: { role: { equals: "Member", mode: "insensitive" } },
      orderBy: { nama: "asc" },
      select: {
        id_user: true,
        nama: true,
        username: true,
        nomor_telepon: true,
        koin_saldo: true,
      },
    });
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Gagal membaca data Member:", error);
    return NextResponse.json({ error: "Data Member tidak dapat dimuat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeApiRole("Kasir");
  if (authorization.response) return authorization.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format request tidak valid." }, { status: 400 });
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Data Member harus berupa objek." }, { status: 400 });
  }
  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  const phone = typeof body.nomor_telepon === "string" ? body.nomor_telepon.trim() : "";
  const normalizedPhone = normalizePhone(phone);
  if (!nama || nama.length > 100) {
    return NextResponse.json({ error: "Nama lengkap wajib diisi (maksimal 100 karakter)." }, { status: 400 });
  }
  if (!/^\+?[\d\s().-]{8,24}$/.test(phone) || !/^\d{8,15}$/.test(normalizedPhone)) {
    return NextResponse.json({ error: "Nomor HP harus berisi 8 sampai 15 digit yang valid." }, { status: 400 });
  }

  const password = createInitialPassword();
  try {
    const member = await getPrismaClient().users.create({
      data: {
        nama,
        username: normalizedPhone,
        nomor_telepon: normalizedPhone,
        role: "Member",
        password_hash: await hashPassword(password),
      },
      select: {
        id_user: true,
        nama: true,
        username: true,
        nomor_telepon: true,
        role: true,
      },
    });
    return NextResponse.json(
      {
        member,
        credentials: { username: member.username, password },
        message: "Member berhasil ditambahkan. Simpan password awal ini.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Nomor HP sudah terdaftar." }, { status: 409 });
    }
    console.error("Gagal menambahkan Member:", error);
    return NextResponse.json({ error: "Data Member gagal disimpan." }, { status: 500 });
  }
}
