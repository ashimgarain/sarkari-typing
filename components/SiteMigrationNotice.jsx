"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const LEGACY_HOSTNAME = "sarkari-typing.vercel.app";
const NEW_ORIGIN = "https://typing.aglimitless.in";
const REDIRECT_AFTER_SECONDS = 5;
const EXCLUDED_PATH_PREFIXES = ["/api/", "/auth/"];

function subscribeToLocation() {
  return () => {};
}

function isLegacyPage() {
  if (typeof window === "undefined") return false;

  if (window.location.hostname.toLowerCase() !== LEGACY_HOSTNAME) {
    return false;
  }

  return !EXCLUDED_PATH_PREFIXES.some((prefix) =>
    window.location.pathname.startsWith(prefix)
  );
}

function isLegacyPageOnServer() {
  return false;
}

export default function SiteMigrationNotice() {
  const isLegacyHost = useSyncExternalStore(
    subscribeToLocation,
    isLegacyPage,
    isLegacyPageOnServer
  );

  const [secondsRemaining, setSecondsRemaining] = useState(
    REDIRECT_AFTER_SECONDS
  );

  const destination = isLegacyHost
    ? new URL(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
        NEW_ORIGIN
      ).toString()
    : NEW_ORIGIN;

  useEffect(() => {
    if (!isLegacyHost) return undefined;

    const startedAt = Date.now();

    const timer = window.setInterval(() => {
      const elapsedSeconds = Math.floor(
        (Date.now() - startedAt) / 1000
      );

      const remaining = Math.max(
        0,
        REDIRECT_AFTER_SECONDS - elapsedSeconds
      );

      setSecondsRemaining(remaining);

      if (remaining === 0) {
        window.clearInterval(timer);
        window.location.replace(destination);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [destination, isLegacyHost]);

  if (!isLegacyHost) return null;

  return (
    <div
      className="fixed inset-0 z-[2147483647] flex min-h-screen items-center justify-center overflow-y-auto bg-gradient-to-br from-slate-950 via-violet-950 to-sky-950 p-5 text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="migration-title"
    >
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/20 bg-white/10 p-7 text-center shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-lg">
          ⌨️
        </div>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.24em] text-sky-300">
          SarkariType Pro v5.2
        </p>

        <h1
          id="migration-title"
          className="mt-3 text-4xl font-black leading-tight sm:text-6xl"
        >
          We moved to a better place!
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base font-semibold leading-7 text-slate-200 sm:text-lg">
          SarkariType Pro now lives at typing.aglimitless.in. Your
          account, Pro access and saved progress remain available there.
        </p>

        <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-full border-4 border-sky-300/70 bg-slate-950/50 text-4xl font-black shadow-lg">
          <span
            aria-live="polite"
            aria-label={`${secondsRemaining} seconds remaining`}
          >
            {secondsRemaining}
          </span>
        </div>

        <p className="mt-3 text-sm font-bold text-slate-300">
          Redirecting automatically in {secondsRemaining} second
          {secondsRemaining === 1 ? "" : "s"}…
        </p>

        <a
          href={destination}
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-7 py-3 font-black text-violet-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50"
        >
          Continue to the new website now →
        </a>

        <p className="mt-6 text-xs font-semibold text-slate-400">
          New official address: https://typing.aglimitless.in
        </p>
      </div>
    </div>
  );
}
