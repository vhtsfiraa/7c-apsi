import { handleLogin } from "@/app/lib/login";

export function POST(request: Request) {
  return handleLogin(request, "Member");
}
