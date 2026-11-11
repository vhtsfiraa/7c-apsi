"use client";

import { useState } from "react";

type CoinHistory = {
  key: string;
  label: string;
  amount: number;
  transactionCode: string;
  date: string;
};
type Member = {
  ID_Member: string;
  Nama_Member: string;
  balance: number;
  history: CoinHistory[];
};

const fieldClass =
  "min-h-11 rounded-lg border border-[#e2e8f0] bg-white px-3.5 text-sm outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

export function CoinManagementForm({ members }: { members: Member[] }) {
  const [memberId, setMemberId] = useState("");
  const member = members.find((item) => item.ID_Member === memberId);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Saldo Koin Member</h2>
        <label className="field">
          <span>Member</span>
          <select
            className={fieldClass}
            onChange={(event) => setMemberId(event.target.value)}
            value={memberId}
          >
            <option value="">Pilih Member</option>
            {members.map((item) => (
              <option key={item.ID_Member} value={item.ID_Member}>
                {item.ID_Member} · {item.Nama_Member}
              </option>
            ))}
          </select>
        </label>
        {member ? (
          <p className="mt-4 text-sm font-semibold">
            Saldo saat ini: {member.balance} koin
          </p>
        ) : (
          <p className="mt-4 text-sm text-[#64748b]">
            Pilih Member untuk melihat saldo dan riwayat.
          </p>
        )}
        <p className="mt-4 text-xs text-[#64748b]">
          Koin hanya dapat ditampilkan dari nilai Koin_Didapat dikurangi Koin_Ditukar pada transaksi.
          ERD tidak menyediakan operasi penyesuaian saldo terpisah.
        </p>
      </section>

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Riwayat Koin Member</h2>
        {member?.history.length ? (
          <ul className="divide-y divide-[#e2e8f0]">
            {member.history.map((item) => (
              <li className="py-3 text-sm" key={item.key}>
                <div className="flex justify-between gap-3">
                  <span>
                    {item.label} · {item.transactionCode}
                  </span>
                  <span className="font-semibold">
                    {item.amount > 0 ? "+" : ""}
                    {item.amount}
                  </span>
                </div>
                <time className="mt-1 block text-xs text-[#64748b]">
                  {new Date(item.date).toLocaleString("id-ID")}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#64748b]">
            {member ? "Belum ada riwayat koin." : "Pilih Member untuk melihat saldo dan riwayat."}
          </p>
        )}
      </section>
    </div>
  );
}
