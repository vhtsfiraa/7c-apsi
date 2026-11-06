import { NextResponse } from "next/server";
import {
  createSessionToken,
  hashPassword,
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

function normalizeUsername(value: string) {
  const trimmed = value.trim();
  return /^[\d+\s().-]+$/.test(trimmed)
    ? trimmed.replace(/\D/g, "")
    : trimmed.toLowerCase();
}

export async function handleLogin(
  request: Request,
  expectedRole?: UserRole,
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format login tidak valid." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Format login tidak valid." },
      { status: 400 },
    );
  }

  const username =
    typeof body.username === "string" ? normalizeUsername(body.username) : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password || username.length > 50 || password.length > 128) {
    return NextResponse.json(
      { error: "Username atau password salah." },
      { status: 401 },
    );
  }

  try {
    const prisma = getPrismaClient();
    const demoRole =
      username === "member"
        ? "Member"
        : username === "kasir"
          ? "Kasir"
          : null;
    const demoPassword = demoRole ? username : null;

    let user = await prisma.users.findUnique({ where: { username } });
    if (
      !user &&
      demoRole &&
      (!expectedRole || expectedRole === demoRole) &&
      password === demoPassword
    ) {
      try {
        user = await prisma.users.create({
          data: {
            username,
            nama: demoRole === "Member" ? "Member Demo" : "Kasir Demo",
            role: demoRole,
            password_hash: await hashPassword(password),
          },
        });
      } catch (error) {
        if (
          !(error instanceof Error && "code" in error && error.code === "P2002")
        ) {
          throw error;
        }
        user = await prisma.users.findUnique({ where: { username } });
      }
    }

    if (
      user &&
      demoRole &&
      user.role.toLowerCase() === demoRole.toLowerCase() &&
      user.password_hash === null &&
      password === demoPassword
    ) {
      user = await prisma.users.update({
        where: { id_user: user.id_user },
        data: { password_hash: await hashPassword(password) },
      });
    }

    const role = user ? normalizeRole(user.role) : null;
    if (
      !user ||
      !role ||
      (expectedRole !== undefined && role !== expectedRole) ||
      user.password_hash === null ||
      !(await verifyPassword(password, user.password_hash))
    ) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 },
      );
    }

    const token = createSessionToken({
      userId: user.id_user,
      username: user.username,
      name: user.nama,
      role,
    });
    const response = NextResponse.json({
      user: { username: user.username, name: user.nama, role },
      redirectTo: role === "Kasir" ? "/kasir" : "/member",
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
