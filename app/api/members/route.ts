import { NextResponse } from "next/server";
import { authorizeApiRole } from "@/app/lib/api-auth";
import {
  createRecordId,
  getMemberCoinBalance,
} from "@/app/api/_lib/erd";
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
    const prisma = getPrismaClient();
    const records = await prisma.member.findMany({
      orderBy: { Nama_Member: "asc" },
    });
    const members = await Promise.all(records.map(async (member) => ({
      ID_Member: member.ID_Member,
      Nama_Member: member.Nama_Member,
      No_HP: member.No_HP,
      id_user: member.ID_Member,
      nama: member.Nama_Member,
      username: member.ID_Member,
      nomor_telepon: member.No_HP,
      koin_saldo: await getMemberCoinBalance(prisma, member.ID_Member),
      gender: member.Gender_Member,
      tanggal_daftar: member.Tgl_Daftar,
    })));
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

  const nameValue = body.nama ?? body.Nama_Member;
  const phoneValue = body.nomor_telepon ?? body.No_HP;
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const phoneInput = typeof phoneValue === "string"
    ? phoneValue.trim()
    : "";
  const phone = normalizePhone(phoneInput);
  const genderValue = body.gender ?? body.Gender_Member;
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
    if (await prisma.member.findFirst({ where: { No_HP: phone } })) {
      return NextResponse.json({ error: "Nomor HP sudah terdaftar." }, { status: 409 });
    }
    const record = await prisma.member.create({
      data: {
        ID_Member: createRecordId("MBR-", 20),
        Nama_Member: name,
        No_HP: phone,
        Gender_Member: typeof genderValue === "string" ? genderValue.trim().slice(0, 20) || null : null,
      },
    });
    const member = {
      ID_Member: record.ID_Member,
      Nama_Member: record.Nama_Member,
      No_HP: record.No_HP,
      id_user: record.ID_Member,
      nama: record.Nama_Member,
      username: record.ID_Member,
      nomor_telepon: record.No_HP,
      role: "Member",
      koin_saldo: 0,
    };
    return NextResponse.json(
      {
        member,
        credentials: { username: record.ID_Member, password: record.No_HP },
        message: "Member berhasil ditambahkan.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Gagal menambahkan Member:", error);
    return NextResponse.json({ error: "Data Member gagal disimpan." }, { status: 500 });
  }
}
