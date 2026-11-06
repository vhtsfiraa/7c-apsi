import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "job_laundry_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type UserRole = "Member" | "Kasir";

export type UserSession = {
  userId: number;
  username: string;
  name: string;
  role: UserRole;
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET belum dikonfigurasi dengan aman.");
  }
  return secret;
}

export function normalizeRole(role: string): UserRole | null {
  if (role.toLowerCase() === "member") return "Member";
  if (role.toLowerCase() === "kasir") return "Kasir";
  return null;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

export function createInitialPassword() {
  return randomBytes(9).toString("base64url");
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, savedHash, ...extra] = storedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    !salt ||
    !savedHash ||
    extra.length > 0 ||
    !/^[a-f0-9]{32}$/i.test(salt) ||
    !/^[a-f0-9]{128}$/i.test(savedHash)
  ) {
    return false;
  }

  const actualHash = (await scrypt(password, salt, 64)) as Buffer;
  const expectedHash = Buffer.from(savedHash, "hex");
  return timingSafeEqual(actualHash, expectedHash);
}

export function createSessionToken(
  user: Omit<UserSession, "expiresAt">,
) {
  const payload: UserSession = {
    ...user,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): UserSession | null {
  const [encodedPayload, signature, ...extra] = token.split(".");
  if (!encodedPayload || !signature || extra.length > 0) return null;

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest();
  let actualSignature: Buffer;
  try {
    actualSignature = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (
    actualSignature.length !== expectedSignature.length ||
    !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("userId" in payload) ||
      typeof payload.userId !== "number" ||
      !Number.isSafeInteger(payload.userId) ||
      !("username" in payload) ||
      typeof payload.username !== "string" ||
      !("name" in payload) ||
      typeof payload.name !== "string" ||
      !("role" in payload) ||
      (payload.role !== "Member" && payload.role !== "Kasir") ||
      !("expiresAt" in payload) ||
      typeof payload.expiresAt !== "number" ||
      !Number.isSafeInteger(payload.expiresAt) ||
      payload.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload as UserSession;
  } catch {
    return null;
  }
}

export async function getSession() {
  await connection();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireRole(role: UserRole) {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== role) {
    redirect(session.role === "Kasir" ? "/kasir" : "/member");
  }
  return session;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
