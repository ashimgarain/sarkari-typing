"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "../lib/supabase-browser";

function Stat({ label, value }) {
  return (
    <div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-black text-violet-600 dark:text-violet-300">{value}</div>
    </div>
  );
}

export default function AdminConsole() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [summary, setSummary] = useState(null);
  const [passages, setPassages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [editing, setEditing] = useState(null);

  const token = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, [supabase]);

  const request = useCallback(async (url, options = {}) => {
    const accessToken = await token();
    if (!accessToken) throw new Error("Sign in with an administrator account first.");
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers || {}),
      },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Admin request failed.");
    return result;
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryResult, passageResult] = await Promise.all([
        request("/api/admin/summary"),
        request("/api/admin/passages"),
      ]);
      setSummary(summaryResult);
      setPassages(passageResult.passages || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    // Defer the initial async load to the next task. This keeps the effect
    // focused on scheduling external synchronization and satisfies the
    // React hooks rule against synchronous state updates from an effect.
    const timerId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [load]);

  const seed = async () => {
    setSeedLoading(true);
    setError("");
    try {
      const result = await request("/api/admin/passages", {
        method: "POST",
        body: JSON.stringify({ action: "seed" }),
      });
      setError(`Success: ${result.count} static passages synced to the CMS.`);
      await load();
    } catch (seedError) {
      setError(seedError.message);
    } finally {
      setSeedLoading(false);
    }
  };

  const savePassage = async (event) => {
    event.preventDefault();
    if (!editing) return;
    setError("");
    try {
      await request("/api/admin/passages", {
        method: "PATCH",
        body: JSON.stringify(editing),
      });
      setEditing(null);
      await load();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-6xl p-8 font-bold text-slate-500">Loading the protected admin console…</div>;
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <Link href="/" className="font-black text-violet-600">← Back to SarkariType</Link>
        <div className="mt-6 rounded-3xl bg-rose-50 p-6 font-bold text-rose-600 dark:bg-rose-500/10">{error || "Admin access unavailable."}</div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm font-black text-violet-600 dark:text-violet-300">← Back to SarkariType</Link>
          <h1 className="mt-2 text-3xl font-black">V5 Admin Console</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Private analytics, error signals and passage CMS.</p>
        </div>
        <button type="button" onClick={seed} disabled={seedLoading} className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
          {seedLoading ? "Syncing…" : "Sync 140 Static Passages → CMS"}
        </button>
      </div>

      {error ? <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{error}</div> : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Users" value={summary.summary.users} />
        <Stat label="Premium" value={summary.summary.premiumUsers} />
        <Stat label="Saved tests" value={summary.summary.totalTests} />
        <Stat label="Paid orders" value={summary.summary.paidOrders} />
        <Stat label="Recorded revenue" value={`₹${summary.summary.revenueINR}`} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black">Recent application errors</h2>
          <div className="mt-4 space-y-2">
            {(summary.recentErrors || []).map((item, index) => (
              <div key={`${item.created_at}-${index}`} className="rounded-2xl bg-rose-50 p-3 dark:bg-rose-500/10">
                <div className="text-xs font-black text-rose-600 dark:text-rose-300">{item.context}</div>
                <div className="mt-1 text-sm font-semibold">{item.message}</div>
                <div className="mt-1 text-[11px] text-slate-400">{new Date(item.created_at).toLocaleString()}</div>
              </div>
            ))}
            {!summary.recentErrors?.length ? <div className="text-sm font-semibold text-slate-400">No recent errors recorded.</div> : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black">Recent product events</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(summary.recentEvents || []).map((item, index) => (
              <span key={`${item.created_at}-${index}`} className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                {item.event_name}
              </span>
            ))}
            {!summary.recentEvents?.length ? <div className="text-sm font-semibold text-slate-400">No events recorded yet.</div> : null}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-lg font-black">Passage CMS</h2><p className="text-xs font-semibold text-slate-400">{passages.length} database passages</p></div>
        </div>
        <div className="mt-4 max-h-[580px] overflow-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wider text-slate-400 dark:bg-slate-950">
              <tr><th className="p-3">ID</th><th className="p-3">Title</th><th className="p-3">Difficulty</th><th className="p-3">Category</th><th className="p-3">Premium</th><th className="p-3">Active</th><th className="p-3">Edit</th></tr>
            </thead>
            <tbody>
              {passages.map((passage) => (
                <tr key={passage.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-3 font-black">{passage.id}</td><td className="p-3 font-bold">{passage.title}</td><td className="p-3">{passage.difficulty}</td><td className="p-3">{passage.category}</td><td className="p-3">{passage.is_premium ? "Yes" : "No"}</td><td className="p-3">{passage.is_active ? "Yes" : "No"}</td><td className="p-3"><button type="button" onClick={() => setEditing({ ...passage })} className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={savePassage} className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between"><h2 className="text-xl font-black">Edit {editing.id}</h2><button type="button" onClick={() => setEditing(null)} className="rounded-xl bg-slate-100 px-3 py-2 font-black dark:bg-slate-800">Close</button></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-black text-slate-500">Title<input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="mt-1 w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950" /></label>
              <label className="text-xs font-black text-slate-500">Category<input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="mt-1 w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950" /></label>
              <label className="text-xs font-black text-slate-500">Difficulty<select value={editing.difficulty || "Easy"} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })} className="mt-1 w-full rounded-xl border p-3 dark:border-slate-700 dark:bg-slate-950"><option>Easy</option><option>Moderate</option><option>Hard</option></select></label>
              <label className="flex items-center gap-2 pt-6 text-sm font-black"><input type="checkbox" checked={editing.is_active !== false} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active</label>
              <label className="flex items-center gap-2 text-sm font-black sm:col-start-2"><input type="checkbox" checked={editing.is_premium !== false} onChange={(e) => setEditing({ ...editing, is_premium: e.target.checked })} /> Premium</label>
            </div>
            <label className="mt-4 block text-xs font-black text-slate-500">Passage text<textarea value={editing.body || ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className="mt-1 h-64 w-full rounded-2xl border p-4 font-mono dark:border-slate-700 dark:bg-slate-950" /></label>
            <button className="mt-4 w-full rounded-2xl bg-violet-600 py-3.5 font-black text-white">Save passage</button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
