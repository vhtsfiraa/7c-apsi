"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ApiActionButtonProps = {
  endpoint: string;
  label: string;
  body?: Record<string, unknown>;
  method?: "POST" | "PATCH";
  disabled?: boolean;
};

export function ApiActionButton({
  endpoint,
  label,
  body = {},
  method = "POST",
  disabled = false,
}: ApiActionButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      setMessage(result.message ?? result.error ?? "Permintaan gagal diproses.");
      if (response.ok) router.refresh();
    } catch {
      setMessage("Tidak dapat menghubungi server. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <button
        className="rounded-lg bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || isSubmitting}
        onClick={handleClick}
        type="button"
      >
        {isSubmitting ? "Memproses..." : label}
      </button>
      {message && (
        <p aria-live="polite" className="mt-2 text-xs text-[#64748b]" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
