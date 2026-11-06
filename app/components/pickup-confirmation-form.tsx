"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function PickupConfirmationForm({
  transactionId,
}: {
  transactionId: number;
}) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/transaksi/${transactionId}/pickup/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identityVerified: verified }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      setMessage(result.message ?? result.error ?? "Serah terima gagal diproses.");
      if (response.ok) router.refresh();
    } catch {
      setMessage("Tidak dapat menghubungi server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex min-w-52 flex-col gap-2" onSubmit={handleSubmit}>
      <label className="flex items-start gap-2 text-xs leading-relaxed text-[#334155]">
        <input
          checked={verified}
          className="mt-0.5"
          onChange={(event) => setVerified(event.target.checked)}
          required
          type="checkbox"
        />
        Identitas Member sudah diverifikasi
      </label>
      <button
        className="rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={busy || !verified}
        type="submit"
      >
        {busy ? "Memproses..." : "Konfirmasi Serah Terima"}
      </button>
      {message && (
        <p aria-live="polite" className="text-xs text-[#64748b]" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
