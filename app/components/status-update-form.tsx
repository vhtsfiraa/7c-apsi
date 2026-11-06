"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type StatusUpdateFormProps = {
  transactionId: number;
  currentStatus: string | null;
};

const nextStatus: Record<string, string> = {
  Menunggu: "Diproses",
  Diproses: "Selesai",
};

export function StatusUpdateForm({
  transactionId,
  currentStatus,
}: StatusUpdateFormProps) {
  const router = useRouter();
  const [status] = useState(nextStatus[currentStatus ?? ""] ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/transaksi/${transactionId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_status: status }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      setMessage(result.message ?? result.error ?? "Status gagal diperbarui.");
      if (response.ok) router.refresh();
    } catch {
      setMessage("Tidak dapat menghubungi server.");
    } finally {
      setBusy(false);
    }
  }

  if (!status || currentStatus === "Sudah Diambil") {
    return <span className="text-xs text-[#64748b]">—</span>;
  }

  return (
    <form className="flex flex-col gap-1" onSubmit={handleSubmit}>
      <button
        className="whitespace-nowrap rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        {busy ? "Menyimpan..." : `Ubah ke ${status}`}
      </button>
      {message && (
        <span aria-live="polite" className="text-[11px] text-[#64748b]" role="status">
          {message}
        </span>
      )}
    </form>
  );
}
