import { AuthLayout } from "@/app/components/auth-layout";
import { LoginForm } from "@/app/components/login-form";

export default function KasirLoginPage() {
  return (
    <AuthLayout>
      <LoginForm role="Kasir" />
    </AuthLayout>
  );
}
