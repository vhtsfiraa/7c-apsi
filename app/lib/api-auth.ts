import { getSession, type UserRole, type UserSession } from "@/app/lib/auth";

type Authorization =
  | { session: UserSession; response?: never }
  | { session?: never; response: Response };

export async function authorizeApiRole(
  expectedRole: UserRole,
): Promise<Authorization> {
  const session = await getSession();
  if (!session) {
    return {
      response: Response.json(
        { error: "Silakan masuk terlebih dahulu." },
        { status: 401 },
      ),
    };
  }
  if (session.role !== expectedRole) {
    return {
      response: Response.json(
        { error: "Anda tidak memiliki akses ke fitur ini." },
        { status: 403 },
      ),
    };
  }
  return { session };
}
