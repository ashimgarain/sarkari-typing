"use client";

import {
  Award,
  BarChart3,
  Check,
  Clock3,
  Copy,
  Crown,
  Flame,
  Gauge,
  Gift,
  Link2,
  Loader2,
  RefreshCcw,
  Share2,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react";
import ProgressChart from "./ProgressChart";
import { formatPracticeTime } from "../lib/scoring.mjs";
import { getLevelInfo, SITE_CONFIG } from "../lib/site-config.mjs";

function Stat({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 ${className}`}>
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

export default function ProfileDrawer({
  data,
  loading,
  onRestorePurchase,
  restoring,
  onAttachReferral,
  onToggleShare,
  onShareProgress,
  onCopy,
  referralInput,
  setReferralInput,
  notice,
}) {
  const profile = data?.profile || {};
  const level = getLevelInfo(profile.total_xp || 0);
  const referralPrice = profile.referred_by && !profile.referral_discount_used
    ? SITE_CONFIG.pricing.referralINR
    : SITE_CONFIG.pricing.regularINR;
  const shareUrl = profile.public_slug
    ? `${SITE_CONFIG.siteUrl}/progress/${profile.public_slug}`
    : "";
  const referralUrl = profile.referral_code
    ? `${SITE_CONFIG.siteUrl}/?ref=${profile.referral_code}`
    : "";

  if (loading && !data) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-violet-100 via-pink-100 to-sky-100 p-5 dark:from-violet-500/15 dark:via-pink-500/10 dark:to-sky-500/15">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-violet-600 shadow-sm dark:bg-slate-900 dark:text-violet-300">
              <UserRound className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black">{profile.full_name || "SarkariType Learner"}</h3>
                {profile.is_premium ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <Crown className="h-3 w-3" /> Pro
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-500">Level {level.level} · {level.title}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 text-center dark:bg-slate-900/80">
            <div className="text-2xl font-black text-violet-600 dark:text-violet-300">{profile.total_xp || 0}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total XP</div>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70 dark:bg-slate-900/70">
          <div className="h-full rounded-full bg-violet-500" style={{ width: `${level.progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat icon={Gauge} label="Best Net WPM" value={profile.best_net_wpm || 0} />
        <Stat icon={Gauge} label="Best Gross WPM" value={profile.best_gross_wpm || 0} />
        <Stat icon={Award} label="Best Accuracy" value={`${profile.best_accuracy || 0}%`} />
        <Stat icon={Trophy} label="Saved Tests" value={profile.total_tests || 0} />
        <Stat icon={Clock3} label="Practice" value={formatPracticeTime(profile.total_practice_seconds || 0)} />
        <Stat icon={Flame} label="Streak" value={`${profile.current_streak || 0} days`} />
      </div>

      {profile.is_premium ? (
        <>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
        <div>
          <div className="mb-2 flex items-center gap-2 font-black"><BarChart3 className="h-5 w-5 text-violet-500" /> Progress</div>
          <ProgressChart points={data?.progress || []} />
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-sky-50 p-4 dark:from-emerald-500/10 dark:to-sky-500/10">
          <div className="flex items-center gap-2 font-black"><Sparkles className="h-5 w-5 text-emerald-500" /> Exam Readiness</div>
          <div className="mt-3 text-5xl font-black text-emerald-600 dark:text-emerald-300">{data?.readiness?.overall || 0}<span className="text-lg">/100</span></div>
          <div className="mt-4 space-y-2 text-xs font-bold text-slate-500">
            {[
              ["Speed", data?.readiness?.speed || 0],
              ["Accuracy", data?.readiness?.accuracy || 0],
              ["Consistency", data?.readiness?.consistency || 0],
              ["Endurance", data?.readiness?.endurance || 0],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between"><span>{label}</span><span>{value}%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white dark:bg-slate-800"><div className="h-full bg-emerald-400" style={{ width: `${value}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2 font-black"><Trophy className="h-5 w-5 text-amber-500" /> Rewards & Achievements</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(data?.achievements || []).length ? data.achievements.map((item) => (
              <span key={item.id} title={item.description} className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                {item.emoji} {item.name}
              </span>
            )) : <p className="text-sm font-semibold text-slate-400">Complete saved tests to unlock rewards.</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2 font-black"><Gauge className="h-5 w-5 text-rose-500" /> Weak Keys</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(data?.weakKeys || []).length ? data.weakKeys.map((item) => (
              <span key={item.key} className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                {item.key}: {item.count}
              </span>
            )) : <p className="text-sm font-semibold text-slate-400">No repeated mistake pattern yet.</p>}
          </div>
        </div>
      </div>
        </>
      ) : (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-violet-50 p-5 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-violet-500/10">
          <div className="flex items-center gap-2 font-black"><Crown className="h-5 w-5 text-amber-500" /> Pro Progress Intelligence</div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Unlock progress graphs, Exam Readiness, weak-key analysis, achievement history and deeper performance insights with Lifetime Pro.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 opacity-70">
            <div className="h-20 rounded-2xl bg-white dark:bg-slate-900" />
            <div className="h-20 rounded-2xl bg-white dark:bg-slate-900" />
            <div className="h-20 rounded-2xl bg-white dark:bg-slate-900" />
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-500/20 dark:bg-violet-500/5">
        <div className="flex items-center gap-2 font-black"><Gift className="h-5 w-5 text-violet-500" /> Referral Rewards</div>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          Share your code. A new learner who joins through it gets 20% off their first Pro purchase (₹40 instead of ₹50). When that purchase is captured, you receive 250 XP.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-black dark:bg-slate-900">{profile.referral_code || "Generating..."}</div>
          <button type="button" onClick={() => onCopy(referralUrl)} disabled={!referralUrl} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white disabled:opacity-40">
            <Copy className="h-4 w-4" /> Copy referral link
          </button>
        </div>

        {!profile.is_premium && !profile.referred_by ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input value={referralInput} onChange={(event) => setReferralInput(event.target.value)} placeholder="Have a referral code?" className="flex-1 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-violet-500 dark:border-violet-500/20 dark:bg-slate-900" />
            <button type="button" onClick={onAttachReferral} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-violet-700 shadow-sm dark:bg-slate-900 dark:text-violet-300">Apply code</button>
          </div>
        ) : null}

        {!profile.is_premium && profile.referred_by && !profile.referral_discount_used ? (
          <div className="mt-3 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Check className="mr-1 inline h-4 w-4" /> Referral discount active: Pro price ₹{referralPrice}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-500/20 dark:bg-sky-500/5">
        <div className="flex items-center gap-2 font-black"><Share2 className="h-5 w-5 text-sky-500" /> Shareable Progress Report {profile.is_premium ? null : <Crown className="h-4 w-4 text-amber-500" />}</div>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Create a public, email-free progress page showing your WPM, accuracy, XP, streak and readiness score. Every shared page also links back to SarkariType.</p>
        {profile.is_premium ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => onToggleShare(!profile.share_enabled)} className={`rounded-2xl px-4 py-3 text-sm font-black ${profile.share_enabled ? "bg-emerald-500 text-white" : "bg-white text-sky-700 shadow-sm dark:bg-slate-900 dark:text-sky-300"}`}>
              <Link2 className="mr-2 inline h-4 w-4" /> {profile.share_enabled ? "Public link ON" : "Enable public link"}
            </button>
            {profile.share_enabled && shareUrl ? (
              <button type="button" onClick={onShareProgress} className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-black text-white">
                <Share2 className="mr-2 inline h-4 w-4" /> Share progress
              </button>
            ) : null}
          </div>
        ) : <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-sky-700 dark:bg-slate-900 dark:text-sky-300">👑 Unique public progress links are a Pro feature.</div>}
      </div>

      {!profile.is_premium ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="font-black">Already paid but Pro is missing?</div>
          <p className="mt-1 text-sm font-semibold text-slate-500">Restore Purchase securely checks your captured SarkariType payment and repairs the Premium flag. It never charges you.</p>
          <button type="button" onClick={onRestorePurchase} disabled={restoring} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
            {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Restore Purchase
          </button>
        </div>
      ) : null}

      {notice ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{notice}</div> : null}

      <div>
        <div className="mb-2 font-black">Payment History</div>
        <div className="space-y-2">
          {(data?.paymentHistory || []).length ? (data.paymentHistory || []).map((item, index) => (
            <div key={`${item.razorpay_order_id}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
              <div><div className="font-black">SarkariType Pro · ₹{Math.round((Number(item.amount) || 0) / 100)}</div><div className="text-xs font-semibold text-slate-400">{item.razorpay_payment_id || item.razorpay_order_id}</div></div>
              <div className={`rounded-full px-3 py-1 text-xs font-black ${item.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>{String(item.status || "unknown").toUpperCase()}</div>
            </div>
          )) : <p className="text-sm font-semibold text-slate-400">No purchase history on this account.</p>}
        </div>
      </div>

      <div>
        <div className="mb-2 font-black">Recent Tests</div>
        <div className="space-y-2">
          {(data?.recentResults || []).slice(0, 8).map((item, index) => (
            <div key={`${item.completed_at}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
              <div>
                <div className="font-black">{item.passage_title || "Typing Test"}</div>
                <div className="text-xs font-semibold text-slate-400">{item.difficulty || "Practice"} · {new Date(item.completed_at).toLocaleDateString()}</div>
              </div>
              <div className="text-right font-black">{item.net_wpm || 0} WPM · {item.accuracy || 0}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
