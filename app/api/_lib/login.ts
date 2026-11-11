import { NextResponse } from "next/server";
import {
  createSessionToken,
  normalizeRole,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
  type UserRole,
} from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function handleRoleLogin(request: Request, expectedRole: UserRole) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format login tidak valid." }, { status: 400 });
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Format login tidak valid." }, { status: 400 });
  }

  const usernameValue = body.username ?? body.ID_Member ?? body.Username;
  const passwordValue = body.password ?? body.No_HP;
  const username = typeof usernameValue === "string" ? usernameValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue.trim() : "";
  if (!username || !password || username.length > 50 || password.length > 50) {
    return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  }

  try {
    const prisma = getPrismaClient();
    let sessionUser: {
      userId: string;
      username: string;
      name: string;
      role: UserRole;
    } | null = null;

    if (expectedRole === "Member") {
      const member = await prisma.member.findUnique({ where: { ID_Member: username } });
      const storedPhone = (member?.No_HP ?? "").replace(/\D/g, "");
      if (member && storedPhone && storedPhone === password.replace(/\D/g, "")) {
        sessionUser = {
          userId: member.ID_Member,
          username: member.ID_Member,
          name: member.Nama_Member,
          role: "Member",
        };
      }
    } else {
      const user = await prisma.users.findFirst({
        where: { Username: { equals: username, mode: "insensitive" } },
        include: { pegawai: true },
      });
      const role = user ? normalizeRole(user.Role) : null;
      if (
        user &&
        role === "Kasir" &&
        user.pegawai.Peran.toLowerCase() === "kasir" &&
        await verifyPassword(password, user.Password_Hash)
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

    const response = NextResponse.json({
      user: {
        username: sessionUser.username,
        name: sessionUser.name,
        role: sessionUser.role,
      },
      redirectTo: sessionUser.role === "Kasir" ? "/kasir" : "/member",
    });
    response.cookies.set(SESSION_COOKIE, createSessionToken(sessionUser), sessionCookieOptions);
    return response;
  } catch (error) {
    console.error("Login gagal diproses:", error);
    return NextResponse.json(
      { error: "Login tidak dapat diproses. Periksa konfigurasi server." },
      { status: 500 },
    );
  }
}
