"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type MemberFormProps = {
  member?: {
    id_member: string;
    nama: string;
    nomor_telepon: string | null;
  };
};

type Result = {
  message?: string;
  error?: string;
  credentials?: { username: string; password: string };
};

export function MemberForm({ member }: MemberFormProps) {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(member);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      nama: formData.get("nama"),
      nomor_telepon: formData.get("nomor_telepon"),
    };
    try {
      const response = await fetch(
        isEdit ? `/api/members/${encodeURIComponent(member?.id_member ?? "")}` : "/api/members",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as Result;
      setResult(response.ok ? data : { error: data.error ?? "Permintaan gagal." });
      if (response.ok && isEdit) router.push("/kasir/member");
      if (response.ok && !isEdit) form.reset();
    } catch {
      setResult({ error: "Tidak dapat menghubungi server." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="max-w-2xl rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Nama lengkap</span>
          <input
            autoComplete="name"
            defaultValue={member?.nama}
            maxLength={100}
            name="nama"
            placeholder="Masukkan nama lengkap"
            required
          />
        </label>
        <label className="field">
          <span>No. HP</span>
          <input
            autoComplete="tel"
            defaultValue={member?.nomor_telepon ?? ""}
            inputMode="tel"
            maxLength={24}
            name="nomor_telepon"
            placeholder="Contoh: 0813-1234-5678"
            required
            type="tel"
          />
        </label>
      </div>
      <button
        className="login-action register-submit max-w-sm"
        disabled={busy}
        type="submit"
      >
        {busy ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Daftarkan Member"}
      </button>
      {result?.error && (
        <p className="login-error" role="alert">
          {result.error}
        </p>
      )}
      {result?.message && (
        <section aria-live="polite" className="auth-success" role="status">
          <p>{result.message}</p>
          {result.credentials && (
            <>
              <p>ID Member: <strong>{result.credentials.username}</strong></p>
              <p>No. HP: <strong>{result.credentials.password}</strong></p>
            </>
          )}
        </section>
      )}
    </form>
  );
}
