import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";

export const instant = false;

const cashierFeatures = [
  {
    title: "Kelola Transaksi Laundry",
    description: "Buat dan perbarui transaksi, status, serta serah terima.",
    href: "/kasir/transaksi",
    label: "Buka",
  },
  {
    title: "Ringkasan Koin Member",
    description: "Lihat saldo dan aktivitas koin yang tercatat pada transaksi.",
    href: "/kasir/koin",
    label: "Buka",
  },
  {
    title: "Kelola Data Member",
    description: "Daftarkan, perbarui, atau lihat data Member.",
    href: "/kasir/member",
    label: "Buka",
  },
  {
    title: "Data Status Laundry",
    description: "Lihat status yang digunakan dalam proses laundry.",
    href: "/kasir/status",
    label: "Lihat Status",
  },
  {
    title: "Kelola Data Pakaian",
    description: "Lihat rincian item pada transaksi laundry.",
    href: "/kasir/pakaian",
    label: "Buka",
  },
  {
    title: "Cetak Nota",
    description: "Pilih dan cetak nota pembayaran transaksi.",
    href: "/kasir/nota",
    label: "Pilih Nota",
  },
];

export default async function KasirPage() {
  const cashier = await requireRole("Kasir");

  return (
    <DashboardShell
      heading="Dashboard Kasir"
      identity={`${cashier.name} · Kasir`}
      activeHref="/kasir"
      role="Kasir"
    >
      <section aria-labelledby="cashier-features-title">
        <h2
          className="mb-3 text-sm font-medium text-[#64748b]"
          id="cashier-features-title"
        >
          Pilih fitur
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {cashierFeatures.map((feature) => (
            <article
              className="flex flex-col items-start gap-3.5 rounded-xl border border-[#e2e8f0] bg-white px-6 py-5"
              key={feature.title}
            >
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="text-[13px] leading-relaxed text-[#64748b]">
                {feature.description}
              </p>
              <Link
                className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                href={feature.href}
              >
                {feature.label}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
