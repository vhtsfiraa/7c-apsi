import { handleRoleLogin } from "@/app/api/_lib/login";

export function POST(request: Request) {
  return handleRoleLogin(request, "Kasir");
}
