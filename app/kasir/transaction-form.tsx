"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type MemberOption = { ID_Member: string; Nama_Member: string; No_HP: string | null };
type TransactionResponse = {
  error?: string;
  transaction?: { total_bayar: string | number | null };
};

const fieldClass =
  "min-h-11 rounded-lg border border-[#e2e8f0] bg-white px-3.5 text-sm font-normal outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

export function KasirTransactionForm({ members }: { members: MemberOption[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const weight = String(formData.get("berat_kg") ?? "").trim();

    try {
      const response = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_user: formData.get("ID_Member"),
          nama_barang: formData.get("nama_barang"),
          jenis_layanan: formData.get("jenis_layanan"),
          jumlah: Number(formData.get("jumlah") || 1),
          berat_kg: weight || null,
          harga_satuan: formData.get("harga_satuan"),
          catatan_pakaian: formData.get("catatan_pakaian"),
          gunakan_diskon: formData.get("gunakan_diskon") === "on",
        }),
      });
      const result = (await response.json()) as TransactionResponse;
      if (!response.ok) {
        setNotification({
          message: result.error ?? "Transaksi gagal disimpan.",
          type: "error",
        });
        return;
      }

      const total = result.transaction?.total_bayar;
      form.reset();
      setNotification({
        message: `✅ Transaksi berhasil disimpan${total ? ` · Total ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(total))}` : ""}.`,
        type: "success",
      });
      router.refresh();
    } catch {
      setNotification({
        message: "Tidak dapat menghubungi server. Silakan coba lagi.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          <span>Member</span>
          <select className={fieldClass} defaultValue="" name="ID_Member" required>
            <option disabled value="">
              Pilih Member
            </option>
            {members.map((member) => (
              <option key={member.ID_Member} value={member.ID_Member}>
                {member.ID_Member} · {member.Nama_Member}{" "}
                {member.No_HP ? `(${member.No_HP})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Jenis Layanan</span>
          <input
            className={fieldClass}
            maxLength={100}
            name="jenis_layanan"
            placeholder="Contoh: Cuci Kiloan Regular"
          />
        </label>

        <label className="field">
          <span>Nama Barang / Rincian Pakaian</span>
          <input
            className={fieldClass}
            maxLength={100}
            name="nama_barang"
            placeholder="Contoh: Pakaian harian"
            required
          />
        </label>

        <label className="field">
          <span>Berat (kg), jika layanan kiloan</span>
          <input
            className={fieldClass}
            max="999.99"
            min="0.01"
            name="berat_kg"
            placeholder="Contoh: 4,5"
            step="0.01"
            type="number"
          />
        </label>

        <label className="field">
          <span>Jumlah (pcs), jika bukan kiloan</span>
          <input
            className={fieldClass}
            defaultValue="1"
            max="2147483647"
            min="1"
            name="jumlah"
            required
            step="1"
            type="number"
          />
        </label>

        <label className="field">
          <span>Harga Satuan (Rp/kg atau Rp/pcs)</span>
          <input
            className={fieldClass}
            min="1"
            name="harga_satuan"
            placeholder="Contoh: 12000"
            required
            step="1"
            type="number"
          />
        </label>
        <label className="field">
          <span>Catatan Pakaian (opsional)</span>
          <input
            className={fieldClass}
            maxLength={1000}
            name="catatan_pakaian"
            placeholder="Catatan khusus"
          />
        </label>
      </div>

      <label className="mt-5 flex items-start gap-2 text-sm text-[#334155]">
        <input className="mt-0.5" name="gunakan_diskon" type="checkbox" />
        Gunakan 10 koin untuk diskon 25%
      </label>
      <p className="mt-1 text-xs text-[#64748b]">
        Koin yang diperoleh dan ditukarkan tercatat di transaksi.
      </p>

      <button
        className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || members.length === 0}
        type="submit"
      >
        {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
      </button>
      {members.length === 0 && (
        <p className="mt-3 text-sm text-[#64748b]">
          Tambahkan Member sebelum membuat transaksi.
        </p>
      )}

      {notification && (
        <p
          aria-live="polite"
          className={`mt-4 text-sm ${
            notification.type === "success" ? "text-emerald-700" : "text-red-600"
          }`}
          role="status"
        >
          {notification.message}
        </p>
      )}
    </form>
  );
}
