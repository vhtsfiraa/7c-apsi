import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/app/components/logout-button";
import type { UserRole } from "@/app/lib/auth";

type DashboardShellProps = {
  children: ReactNode;
  heading: string;
  role: UserRole;
  identity: string;
  activeHref?: string;
};

export function DashboardShell({
  children,
  heading,
  role,
  identity,
  activeHref,
}: DashboardShellProps) {
  const links =
    role === "Kasir"
      ? [
          { label: "Dashboard", href: "/kasir" },
          { label: "Data Member", href: "/kasir/member" },
          { label: "Transaksi", href: "/kasir/transaksi" },
          { label: "Status Laundry", href: "/kasir/status" },
          { label: "Koin Member", href: "/kasir/koin" },
          { label: "Notifikasi", href: "/kasir/notifikasi" },
          { label: "Data Pakaian", href: "/kasir/pakaian" },
          { label: "Cetak Nota", href: "/kasir/nota" },
        ]
      : [
          { label: "Dashboard", href: "/member" },
          { label: "Riwayat Laundry", href: "/member/riwayat" },
          { label: "Notifikasi", href: "/member/notifikasi" },
          { label: "Profil", href: "/member/profil" },
        ];

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#0f172a]">
      <aside className="bg-[#0f2a4a] px-4 py-6 text-white sm:fixed sm:inset-y-0 sm:left-0 sm:z-10 sm:flex sm:w-60 sm:flex-col">
        <div>
          <p className="text-xl font-bold">Job Laundry</p>
          <p className="mt-1 text-xs text-[#93c5fd]">{role}</p>
        </div>
        <nav
          aria-label="Navigasi utama"
          className="mt-6 flex gap-2 overflow-x-auto sm:flex-col sm:items-stretch"
        >
          {links.map((link) => (
            <Link
              aria-current={activeHref === link.href ? "page" : undefined}
              className={`shrink-0 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                activeHref === link.href ? "bg-[#2563eb]" : "text-white/85"
              }`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <LogoutButton />
        </nav>
      </aside>

      <div className="sm:ml-60">
        <header
          className="flex min-h-[64px] items-center justify-between gap-4 bg-white px-5 py-4 sm:px-8"
          id="profile"
        >
          <h1 className="text-lg font-bold sm:text-xl">{heading}</h1>
          <div className="flex shrink-0 items-center gap-2.5 text-xs sm:text-[13px]">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#dbeafe] font-bold text-[#2563eb]">
              {role === "Member" ? "M" : "K"}
            </span>
            <span>{identity}</span>
          </div>
        </header>
        <div className="flex flex-col gap-5 px-5 py-6 sm:px-8 sm:py-7">
          {children}
        </div>
      </div>
    </main>
  );
}
