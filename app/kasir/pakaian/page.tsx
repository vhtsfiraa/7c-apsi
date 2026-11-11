import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

const laundryTransactionFilter = {
  OR: [
    { Catatan_Pakaian: null },
    {
      AND: [
        { NOT: { Catatan_Pakaian: { startsWith: "Migrasi riwayat koin:" } } },
        { NOT: { Catatan_Pakaian: { startsWith: "Penyesuaian saldo koin saat migrasi skema ERD." } } },
      ],
    },
  ],
};

export default async function KasirLaundryItemsPage() {
  const cashier = await requireRole("Kasir");
  const items = await getPrismaClient().transaksi.findMany({
    where: laundryTransactionFilter,
    orderBy: { Tgl_Jam_Transaksi: "desc" },
    select: {
      Kode_Transaksi: true,
      Catatan_Pakaian: true,
      Total_Berat_Kg: true,
      Tgl_Jam_Transaksi: true,
      member: { select: { Nama_Member: true } },
    },
  });

  return (
    <DashboardShell
      heading="Data Pakaian / Paket"
      identity={`${cashier.name} · ${cashier.username}`}
      role="Kasir"
    >
      <section
        aria-labelledby="laundry-items-title"
        className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-5 sm:px-6"
      >
        <h2 className="mb-4 text-base font-semibold" id="laundry-items-title">
          Item pada transaksi
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-xs">
            <thead className="bg-[#f1f5f9] text-[#64748b]">
              <tr>
                <th className="px-3 py-3 font-medium">Tanggal</th>
                <th className="px-3 py-3 font-medium">Member</th>
                <th className="px-3 py-3 font-medium">Catatan Pakaian</th>
                <th className="px-3 py-3 font-medium">Berat</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-t border-[#e2e8f0]" key={item.Kode_Transaksi}>
                  <td className="px-3 py-3">
                    {item.Tgl_Jam_Transaksi.toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-3">{item.member.Nama_Member}</td>
                  <td className="px-3 py-3">{item.Catatan_Pakaian ?? "—"}</td>
                  <td className="px-3 py-3">
                    {item.Total_Berat_Kg ? `${item.Total_Berat_Kg.toString()} kg` : "—"}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-[#64748b]" colSpan={4}>
                    Belum ada item laundry tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Link
        className="text-sm font-medium text-[#2563eb] hover:underline"
        href="/kasir"
      >
        Kembali ke Dashboard
      </Link>
    </DashboardShell>
  );
}
