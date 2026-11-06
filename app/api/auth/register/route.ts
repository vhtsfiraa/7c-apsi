import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format pendaftaran tidak valid." },
      { status: 400 },
    );
  }
  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Format pendaftaran tidak valid." },
      { status: 400 },
    );
  }

  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  const phoneInput =
    typeof body.nomor_telepon === "string" ? body.nomor_telepon.trim() : "";
  const nomorTelepon = normalizePhone(phoneInput);

  if (!nama || nama.length > 100) {
    return NextResponse.json(
      { error: "Nama lengkap wajib diisi (maksimal 100 karakter)." },
      { status: 400 },
    );
  }
  if (!/^\+?[\d\s().-]{8,24}$/.test(phoneInput) || !/^\d{8,15}$/.test(nomorTelepon)) {
    return NextResponse.json(
      { error: "Nomor HP harus berisi 8 sampai 15 digit yang valid." },
      { status: 400 },
    );
  }

  const password = createInitialPassword();

  try {
    const user = await getPrismaClient().users.create({
      data: {
        nama,
        username: nomorTelepon,
        nomor_telepon: nomorTelepon,
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
        message:
          "Pendaftaran berhasil. Simpan kredensial ini karena password hanya ditampilkan sekali.",
        user,
        credentials: { username: user.username, password },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Nomor HP sudah terdaftar." },
        { status: 409 },
      );
    }
    console.error("Pendaftaran member gagal:", error);
    return NextResponse.json(
      { error: "Pendaftaran gagal disimpan. Periksa konfigurasi database." },
      { status: 500 },
    );
  }
}
