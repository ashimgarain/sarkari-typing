"use client";

import { X } from "lucide-react";

export default function Modal({ children, onClose, wide = false, title = "" }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-7 ${wide ? "max-w-5xl" : "max-w-lg"}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            {title ? <h2 className="text-xl font-black tracking-tight">{title}</h2> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
