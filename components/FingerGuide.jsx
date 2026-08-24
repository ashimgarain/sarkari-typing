"use client";

const rows = [
  [
    ["1", "LP"], ["2", "LR"], ["3", "LM"], ["4", "LI"], ["5", "LI"],
    ["6", "RI"], ["7", "RI"], ["8", "RM"], ["9", "RR"], ["0", "RP"],
  ],
  [
    ["Q", "LP"], ["W", "LR"], ["E", "LM"], ["R", "LI"], ["T", "LI"],
    ["Y", "RI"], ["U", "RI"], ["I", "RM"], ["O", "RR"], ["P", "RP"],
  ],
  [
    ["A", "LP"], ["S", "LR"], ["D", "LM"], ["F", "LI"], ["G", "LI"],
    ["H", "RI"], ["J", "RI"], ["K", "RM"], ["L", "RR"], [";", "RP"],
  ],
  [
    ["Z", "LP"], ["X", "LR"], ["C", "LM"], ["V", "LI"], ["B", "LI"],
    ["N", "RI"], ["M", "RI"], [",", "RM"], [".", "RR"], ["/", "RP"],
  ],
];

const styleByFinger = {
  LP: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  LR: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  LM: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  LI: "bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300",
  RI: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  RM: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  RR: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  RP: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
};

const legends = [
  ["LP", "Left little"], ["LR", "Left ring"], ["LM", "Left middle"], ["LI", "Left index"],
  ["RI", "Right index"], ["RM", "Right middle"], ["RR", "Right ring"], ["RP", "Right little"],
];

export default function FingerGuide() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl bg-gradient-to-br from-pink-50 via-amber-50 to-sky-50 p-5 dark:from-pink-500/10 dark:via-amber-500/10 dark:to-sky-500/10">
          <h3 className="text-lg font-black">1. Find the home row without looking</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
            Rest your left fingers on <b>A S D F</b> and your right fingers on <b>J K L ;</b>. Feel the raised marks on <b>F</b> and <b>J</b>. Both thumbs hover over Space.
          </p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-violet-50 to-sky-50 p-5 dark:from-violet-500/10 dark:to-sky-500/10">
          <h3 className="text-lg font-black">2. Reach, press, return</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
            Each colour below belongs to one finger. Reach only the assigned finger toward the key, press lightly, then guide it back toward its home-row position.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="min-w-[735px] space-y-2">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className={`flex gap-2 ${rowIndex === 2 ? "pl-5" : rowIndex === 3 ? "pl-10" : ""}`}>
              {row.map(([key, finger]) => {
                const homeKey = ["A", "S", "D", "F", "J", "K", "L", ";"].includes(key);
                return (
                  <div
                    key={`${key}-${finger}`}
                    className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-lg font-black shadow-sm ${styleByFinger[finger]} ${homeKey ? "ring-2 ring-slate-900/15 dark:ring-white/20" : "border-white/70"}`}
                    title={legends.find(([code]) => code === finger)?.[1]}
                  >
                    {key}
                    {(key === "F" || key === "J") ? <span className="absolute bottom-1 h-1 w-3 rounded-full bg-current opacity-45" /> : null}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="flex h-14 w-28 items-center justify-center rounded-2xl bg-slate-100 text-xs font-black text-slate-500 dark:bg-slate-800">Left Shift</div>
            <div className="flex h-14 w-72 items-center justify-center rounded-2xl bg-slate-100 font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">SPACE — either thumb</div>
            <div className="flex h-14 w-28 items-center justify-center rounded-2xl bg-slate-100 text-xs font-black text-slate-500 dark:bg-slate-800">Right Shift</div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {legends.map(([code, label]) => (
          <div key={code} className={`rounded-2xl px-3 py-2 text-xs font-black ${styleByFinger[code]}`}>{label}</div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[
          ["3. Opposite Shift rule", "For a capital typed with the left hand, prefer Right Shift. For a capital typed with the right hand, prefer Left Shift. This keeps the letter finger free."],
          ["4. Number-row practice", "Keep the wrist mostly stable and reach upward with the assigned finger. Practise dates, percentages and ₹ amounts slowly before increasing speed."],
          ["5. Eyes on the passage", "Use the F/J bumps to relocate your hands. Looking down repeatedly breaks rhythm and makes exam copying slower."],
          ["6. Accuracy before speed", "A smooth 95%+ accurate rhythm is a better base than frantic speed. Use the Weak Keys report to choose what to practise next."],
          ["7. Neutral wrists", "Keep wrists straight rather than bent sharply upward. Use light keystrokes and relax the shoulders during longer sessions."],
          ["8. Five-minute drill", "Type one easy passage slowly, one moderate passage at normal speed, then spend two minutes repeating your three weakest keys or combinations."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="font-black">{title}</div>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
