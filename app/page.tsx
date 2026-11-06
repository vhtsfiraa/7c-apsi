import Link from "next/link";
import { AuthLayout } from "@/app/components/auth-layout";

export default function Home() {
  return (
    <AuthLayout variant="landing">
      <section aria-labelledby="actor-selection-title" className="actor-options">
        <h2 className="actor-selection-title" id="actor-selection-title">
          Masuk sebagai
        </h2>
        <Link
          className="actor-option actor-option--member"
          href="/login/member"
        >
          Login sebagai Member
        </Link>
        <Link
          className="actor-option actor-option--cashier"
          href="/login/kasir"
        >
          Login sebagai Kasir
        </Link>
      </section>
    </AuthLayout>
  );
}
