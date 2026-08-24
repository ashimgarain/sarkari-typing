"use client";

import { Check, Crown, LayoutPanelTop, Moon, Palette, Sparkles, Sun } from "lucide-react";
import { SITE_CONFIG } from "../lib/site-config.mjs";

const swatches = {
  pastel: ["#a78bfa", "#f9a8d4", "#7dd3fc"],
  classic: ["#2563eb", "#64748b", "#f8fafc"],
  neo: ["#22d3ee", "#a3e635", "#c084fc"],
  aurora: ["#38bdf8", "#34d399", "#818cf8"],
  retro: ["#22c55e", "#f59e0b", "#052e16"],
  paper: ["#b08968", "#e6ccb2", "#fff7ed"],
};

function formatPreview(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export default function ThemeStudio({
  theme,
  palette,
  layoutMode,
  isPremium,
  trialActive,
  trialRemainingSeconds,
  onThemeChange,
  onPaletteChange,
  onLayoutChange,
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-fuchsia-50 to-sky-50 p-5 dark:from-fuchsia-500/10 dark:to-sky-500/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-black"><Sparkles className="h-5 w-5 text-fuchsia-500" /> Appearance Lab</div>
            <p className="mt-1 text-sm font-semibold text-slate-500">Choose light/dark, a color palette and the amount of interface you want to see.</p>
          </div>
          {!isPremium ? (
            <div className={`rounded-full px-3 py-2 text-xs font-black ${trialActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
              {trialActive ? `Pro preview ${formatPreview(trialRemainingSeconds)}` : `One ${SITE_CONFIG.appearance.premiumPreviewMinutes}-min Pro preview included`}
            </div>
          ) : <div className="rounded-full bg-amber-100 px-3 py-2 text-xs font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">👑 All themes unlocked</div>}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 font-black"><Sun className="h-5 w-5 text-amber-500" /> Brightness</div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onThemeChange("light")} className={`rounded-3xl border p-4 text-left transition ${theme === "light" ? "border-violet-500 ring-4 ring-violet-500/10" : "border-slate-200 dark:border-slate-800"}`}>
            <Sun className="h-5 w-5 text-amber-500" /><div className="mt-2 font-black">Light</div><div className="text-xs font-semibold text-slate-400">Bright and airy</div>
          </button>
          <button type="button" onClick={() => onThemeChange("dark")} className={`rounded-3xl border p-4 text-left transition ${theme === "dark" ? "border-violet-500 ring-4 ring-violet-500/10" : "border-slate-200 dark:border-slate-800"}`}>
            <Moon className="h-5 w-5 text-indigo-500" /><div className="mt-2 font-black">Dark</div><div className="text-xs font-semibold text-slate-400">Comfortable at night</div>
          </button>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 font-black"><Palette className="h-5 w-5 text-fuchsia-500" /> Palettes</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SITE_CONFIG.appearance.palettes.map((item) => {
            const locked = item.premium && !isPremium && !trialActive;
            const active = palette === item.id;
            return (
              <button key={item.id} type="button" onClick={() => onPaletteChange(item.id)} className={`relative overflow-hidden rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${active ? "border-violet-500 ring-4 ring-violet-500/10" : "border-slate-200 dark:border-slate-800"}`}>
                <div className="flex gap-1.5">
                  {(swatches[item.id] || swatches.pastel).map((color) => <span key={color} className="h-7 flex-1 rounded-xl" style={{ background: color }} />)}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2"><span className="font-black">{item.name}</span>{active ? <Check className="h-4 w-4 text-emerald-500" /> : item.premium ? <Crown className="h-4 w-4 text-amber-500" /> : null}</div>
                <div className="mt-1 text-xs font-semibold text-slate-400">{item.description}</div>
                {locked ? <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-amber-500">Pro · tap to preview/unlock</div> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 font-black"><LayoutPanelTop className="h-5 w-5 text-sky-500" /> Page Style</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SITE_CONFIG.appearance.layouts.map((item) => {
            const active = layoutMode === item.id;
            return (
              <button key={item.id} type="button" onClick={() => onLayoutChange(item.id)} className={`rounded-3xl border p-4 text-left transition ${active ? "border-sky-500 ring-4 ring-sky-500/10" : "border-slate-200 dark:border-slate-800"}`}>
                <div className="flex items-center justify-between"><LayoutPanelTop className="h-5 w-5 text-sky-500" />{item.premium ? <Crown className="h-4 w-4 text-amber-500" /> : null}</div>
                <div className="mt-2 font-black">{item.name}</div>
                <div className="mt-1 text-xs font-semibold text-slate-400">{item.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
