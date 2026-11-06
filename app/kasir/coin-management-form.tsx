"use client";

import { useState, type FormEvent } from "react";

type Member = { id_user: number; nama: string; koin_saldo: number };
type CoinHistory = {
  id_riwayat_koin: number;
  jumlah: number;
  keterangan: string;
  dibuat_pada: string;
};
type CoinResult = {
  error?: string;
  message?: string;
  balance?: number;
  history?: CoinHistory[];
};

const fieldClass =
  "min-h-11 rounded-lg border border-[#e2e8f0] bg-white px-3.5 text-sm outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

export function CoinManagementForm({ members }: { members: Member[] }) {
  const [memberId, setMemberId] = useState("");
  const [operation, setOperation] = useState<"earn" | "redeem">("earn");
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<CoinHistory[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadMemberCoins(id: string) {
    setMemberId(id);
    setMessage("");
    if (!id) {
      setBalance(null);
      setHistory([]);
      return;
    }
    try {
      const response = await fetch(`/api/koin?memberId=${encodeURIComponent(id)}`);
      const result = (await response.json()) as CoinResult;
      if (!response.ok) {
        setMessage(result.error ?? "Saldo koin tidak dapat dimuat.");
        return;
      }
      setBalance(result.balance ?? 0);
      setHistory(result.history ?? []);
    } catch {
      setMessage("Tidak dapat menghubungi server.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const payload =
      operation === "earn"
        ? {
            operation,
            id_user: Number(memberId),
            berat_kg: Number(formData.get("berat_kg")),
          }
        : {
            operation,
            id_user: Number(memberId),
            jumlah: Number(formData.get("jumlah")),
          };
    try {
      const response = await fetch("/api/koin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as CoinResult;
      setMessage(result.message ?? result.error ?? "Operasi koin gagal.");
      if (response.ok) {
        setBalance(result.balance ?? null);
        const updated = await fetch(`/api/koin?memberId=${encodeURIComponent(memberId)}`);
        const details = (await updated.json()) as CoinResult;
        if (updated.ok) {
          setBalance(details.balance ?? result.balance ?? null);
          setHistory(details.history ?? []);
        }
      }
    } catch {
      setMessage("Tidak dapat menghubungi server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <form
        className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6"
        onSubmit={handleSubmit}
      >
        <h2 className="mb-4 text-base font-semibold">Kelola Koin Member</h2>
        <div className="flex flex-col gap-4">
          <label className="field">
            <span>Member</span>
            <select
              className={fieldClass}
              onChange={(event) => void loadMemberCoins(event.target.value)}
              required
              value={memberId}
            >
              <option value="">Pilih Member</option>
              {members.map((member) => (
                <option key={member.id_user} value={member.id_user}>
                  MBR-{String(member.id_user).padStart(3, "0")} · {member.nama} ·{" "}
                  {member.koin_saldo} koin
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Operasi</span>
            <select
              className={fieldClass}
              onChange={(event) => setOperation(event.target.value as "earn" | "redeem")}
              value={operation}
            >
              <option value="earn">Tambahkan koin dari berat pakaian</option>
              <option value="redeem">Tukarkan koin</option>
            </select>
          </label>

          {operation === "earn" ? (
            <label className="field">
              <span>Berat Pakaian (kg)</span>
              <input
                className={fieldClass}
                max="9999"
                min="5"
                name="berat_kg"
                placeholder="Minimal 5 kg"
                required
                step="0.1"
                type="number"
              />
              <span className="text-xs font-normal text-[#64748b]">
                1 koin diberikan untuk setiap 5 kg penuh.
              </span>
            </label>
          ) : (
            <label className="field">
              <span>Jumlah Koin yang Ditukarkan</span>
              <input
                className={fieldClass}
                max={balance ?? undefined}
                min="1"
                name="jumlah"
                placeholder="Masukkan jumlah koin"
                required
                step="1"
                type="number"
              />
            </label>
          )}
        </div>
        <button
          className="login-action register-submit max-w-sm"
          disabled={busy || !memberId}
          type="submit"
        >
          {busy ? "Memproses..." : operation === "earn" ? "Hitung dan Tambah Koin" : "Proses Penukaran"}
        </button>
        {balance !== null && (
          <p className="mt-4 text-sm font-semibold">Saldo saat ini: {balance} koin</p>
        )}
        {message && (
          <p aria-live="polite" className="mt-3 text-sm text-[#334155]" role="status">
            {message}
          </p>
        )}
      </form>

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Riwayat Koin Member</h2>
        {memberId && history.length ? (
          <ul className="divide-y divide-[#e2e8f0]">
            {history.map((item) => (
              <li className="py-3 text-sm" key={item.id_riwayat_koin}>
                <div className="flex justify-between gap-3">
                  <span>{item.keterangan}</span>
                  <span className="font-semibold">{item.jumlah > 0 ? "+" : ""}{item.jumlah}</span>
                </div>
                <time className="mt-1 block text-xs text-[#64748b]">
                  {new Date(item.dibuat_pada).toLocaleString("id-ID")}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#64748b]">
            {memberId ? "Belum ada riwayat koin." : "Pilih Member untuk melihat saldo dan riwayat."}
          </p>
        )}
      </section>
    </div>
  );
}
