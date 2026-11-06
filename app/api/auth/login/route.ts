import { handleLogin } from "@/app/lib/login";

export async function POST(request: Request) {
  return handleLogin(request);
}
