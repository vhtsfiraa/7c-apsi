"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        setError("Logout gagal. Silakan coba lagi.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server untuk logout.");
    }
  }

  return (
    <>
      <button
        className="w-full rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold text-white/85 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={handleLogout}
        type="button"
      >
        Keluar / Logout
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-200" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
