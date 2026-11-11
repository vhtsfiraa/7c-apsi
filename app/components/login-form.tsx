"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { type UserRole } from "@/app/lib/auth";

type LoginFormProps = {
  role: UserRole;
};

export function LoginForm({ role }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginPath = role === "Member" ? "/api/auth/login/member" : "/api/auth/login/kasir";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Username atau Password salah!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(loginPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };
      if (!response.ok || !result.redirectTo) {
        setError(result.error ?? "Username atau Password salah!");
        return;
      }
      router.replace(result.redirectTo);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-labelledby="login-title"
      className="login-form"
      onSubmit={handleSubmit}
    >
      <h2 className="login-title" id="login-title">
        Masuk sebagai {role}
      </h2>
      <div className="fields">
        <label className="field" htmlFor={`${role}-username`}>
          <span>{role === "Member" ? "ID Member" : "Username"}</span>
          <input
            autoComplete={role === "Member" ? "off" : "username"}
            id={`${role}-username`}
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            placeholder={role === "Member" ? "Masukkan ID Member" : "Masukkan username"}
            required
            type="text"
            value={username}
          />
        </label>
        <label className="field" htmlFor={`${role}-password`}>
          <span>{role === "Member" ? "No. HP" : "Password"}</span>
          <input
            autoComplete={role === "Member" ? "tel" : "current-password"}
            id={`${role}-password`}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan password"
            required
            type={role === "Member" ? "tel" : "password"}
            value={password}
          />
        </label>
      </div>
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      <button className="login-action login-submit" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Memeriksa..." : "Masuk"}
      </button>
      {role === "Member" && (
        <p className="register-prompt">
          Belum memiliki akun?{" "}
          <Link className="register-link" href="/daftar">
            Daftar Member
          </Link>
        </p>
      )}
      <p className="register-prompt">
        <Link className="register-link" href="/">
          Kembali ke Halaman Awal
        </Link>
      </p>
    </form>
  );
}
