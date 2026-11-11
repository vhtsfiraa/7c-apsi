import { NextResponse } from "next/server";
import {
  createSessionToken,
  normalizeRole,
  SESSION_COOKIE,
  sessionCookieOptions,
  type UserRole,
  verifyPassword,
} from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function handleLogin(
  request: Request,
  expectedRole: UserRole,
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format login tidak valid." }, { status: 400 });
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Format login tidak valid." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";
  if (!username || !password || username.length > 50 || password.length > 50) {
    return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  }

  try {
    const prisma = getPrismaClient();
    let sessionUser: { userId: string; username: string; name: string; role: UserRole } | null = null;

    if (expectedRole === "Member") {
      const member = await prisma.member.findUnique({
        where: { ID_Member: username },
      });
      if (
        member &&
        member.No_HP &&
        normalizePhone(member.No_HP) === normalizePhone(password)
      ) {
        sessionUser = {
          userId: member.ID_Member,
          username: member.ID_Member,
          name: member.Nama_Member,
          role: "Member",
        };
      }
    } else {
      const user = await prisma.users.findUnique({
        where: { Username: username.toLowerCase() },
        include: { pegawai: true },
      });
      const role = user ? normalizeRole(user.Role) : null;
      if (
        user &&
        role === "Kasir" &&
        user.pegawai.Peran.toLowerCase() === "kasir" &&
        (await verifyPassword(password, user.Password_Hash))
      ) {
        sessionUser = {
          userId: user.pegawai.ID_Pegawai,
          username: user.Username,
          name: user.pegawai.Nama_Pegawai,
          role,
        };
      }
    }

    if (!sessionUser) {
      return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
    }

    const token = createSessionToken(sessionUser);
    const response = NextResponse.json({
      user: {
        username: sessionUser.username,
        name: sessionUser.name,
        role: sessionUser.role,
      },
      redirectTo: sessionUser.role === "Kasir" ? "/kasir" : "/member",
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    console.error("Login gagal diproses:", error);
    return NextResponse.json(
      { error: "Login tidak dapat diproses. Periksa konfigurasi server." },
      { status: 500 },
    );
  }
}
