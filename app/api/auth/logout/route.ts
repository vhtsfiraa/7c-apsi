import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/app/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Anda telah keluar." });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
