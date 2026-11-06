import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

export default async function KasirLaundryItemsPage() {
  const cashier = await requireRole("Kasir");
  const items = await getPrismaClient().transaksi.findMany({
    orderBy: { tanggal: "desc" },
    select: {
      id_transaksi: true,
      nama_barang: true,
      jumlah: true,
      tanggal: true,
      users: { select: { nama: true } },
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
                <th className="px-3 py-3 font-medium">Pakaian / Paket</th>
                <th className="px-3 py-3 font-medium">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-t border-[#e2e8f0]" key={item.id_transaksi}>
                  <td className="px-3 py-3">
                    {item.tanggal.toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-3">{item.users.nama}</td>
                  <td className="px-3 py-3">{item.nama_barang}</td>
                  <td className="px-3 py-3">{item.jumlah}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-[#64748b]"
                    colSpan={4}
                  >
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
