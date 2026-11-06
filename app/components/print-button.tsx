"use client";

export function PrintButton() {
  return (
    <button
      className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
      onClick={() => window.print()}
      type="button"
    >
      Cetak Nota
    </button>
  );
}
