"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthLayout } from "@/app/components/auth-layout";

type RegistrationResponse = {
  error?: string;
  message?: string;
  credentials?: {
    username: string;
    password: string;
  };
};

export default function RegisterPage() {
  const [result, setResult] = useState<RegistrationResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: formData.get("nama"),
          nomor_telepon: formData.get("nomor_telepon"),
        }),
      });
      const data = (await response.json()) as RegistrationResponse;
      setResult(response.ok ? data : { error: data.error ?? "Pendaftaran gagal." });
      if (response.ok) form.reset();
    } catch {
      setResult({
        error: "Tidak dapat menghubungi server. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout variant="register">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2 className="login-title register-title">Daftar Member</h2>
        <div className="fields">
          <label className="field" htmlFor="nama">
            <span>Nama lengkap</span>
            <input
              autoComplete="name"
              id="nama"
              maxLength={100}
              name="nama"
              placeholder="Masukkan nama lengkap"
              required
            />
          </label>
          <label className="field" htmlFor="nomor-telepon">
            <span>No. HP</span>
            <input
              autoComplete="tel"
              id="nomor-telepon"
              inputMode="tel"
              maxLength={24}
              name="nomor_telepon"
              pattern="\+?[\d\s().-]{8,24}"
              placeholder="Contoh: 0813-1234-5678"
              required
              type="tel"
            />
          </label>
        </div>
        {result?.error && (
          <p className="login-error" role="alert">
            {result.error}
          </p>
        )}
        {result?.credentials && (
          <section aria-live="polite" className="auth-success" role="status">
            <p>{result.message}</p>
            <p>
              Username: <strong>{result.credentials.username}</strong>
            </p>
            <p>
              Password awal: <strong>{result.credentials.password}</strong>
            </p>
            <p>Simpan password ini. Demi keamanan, password tidak ditampilkan lagi setelah meninggalkan halaman.</p>
          </section>
        )}
        <button
          className="login-action register-submit"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Menyimpan..." : "Daftar"}
        </button>
        <p className="register-prompt">
          <Link className="register-link" href="/login/member">
            Kembali ke Login Member
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
