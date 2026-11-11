"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Transaction = {
  id_transaksi: string;
  nama_barang: string;
  jenis_layanan: string | null;
  jumlah: number;
  berat_kg: string | null;
  harga_satuan: string;
  catatan_pakaian: string;
};

const input =
  "min-h-11 rounded-lg border border-[#e2e8f0] px-3.5 text-sm outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

export function TransactionEditForm({ transaction }: { transaction: Transaction }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch(
        `/api/transaksi/${encodeURIComponent(transaction.id_transaksi)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama_barang: values.get("nama_barang"),
            jenis_layanan: values.get("jenis_layanan"),
            jumlah: Number(values.get("jumlah")),
            berat_kg: values.get("berat_kg") || null,
            harga_satuan: values.get("harga_satuan"),
            catatan_pakaian: values.get("catatan_pakaian"),
          }),
        },
      );
      const result = (await response.json()) as { message?: string; error?: string };
      setMessage(result.message ?? result.error ?? "Perubahan gagal disimpan.");
      if (response.ok) router.push("/kasir/transaksi");
    } catch {
      setMessage("Tidak dapat menghubungi server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="max-w-3xl rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Jenis layanan</span>
          <input
            className={input}
            defaultValue={transaction.jenis_layanan ?? ""}
            maxLength={100}
            name="jenis_layanan"
          />
        </label>
        <label className="field">
          <span>Nama pakaian / rincian</span>
          <input
            className={input}
            defaultValue={transaction.nama_barang}
            maxLength={100}
            name="nama_barang"
            required
          />
        </label>
        <label className="field">
          <span>Berat (kg)</span>
          <input
            className={input}
            defaultValue={transaction.berat_kg ?? ""}
            max="999.99"
            min="0.01"
            name="berat_kg"
            step="0.01"
            type="number"
          />
        </label>
        <label className="field">
          <span>Jumlah (pcs)</span>
          <input
            className={input}
            defaultValue={transaction.jumlah}
            max="2147483647"
            min="1"
            name="jumlah"
            required
            step="1"
            type="number"
          />
        </label>
        <label className="field">
          <span>Harga satuan</span>
          <input
            className={input}
            defaultValue={transaction.harga_satuan}
            min="1"
            name="harga_satuan"
            required
            step="1"
            type="number"
          />
        </label>
        <label className="field sm:col-span-2">
          <span>Catatan Pakaian</span>
          <textarea
            className={`${input} min-h-24 py-3`}
            defaultValue={transaction.catatan_pakaian}
            maxLength={1000}
            name="catatan_pakaian"
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-[#64748b]">
        Rincian layanan, barang, dan jumlah disimpan sebagai Catatan_Pakaian pada transaksi.
      </p>
      <button className="login-action register-submit max-w-sm" disabled={busy} type="submit">
        {busy ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
      {message && (
        <p aria-live="polite" className="mt-3 text-sm" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
