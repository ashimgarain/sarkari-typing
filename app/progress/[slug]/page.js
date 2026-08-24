import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "../../../lib/supabase-server.mjs";
import { calculateReadiness } from "../../../lib/scoring.mjs";
import { getLevelInfo, SITE_CONFIG } from "../../../lib/site-config.mjs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: "Typing Progress",
    description: "A shared SarkariType Pro typing progress report.",
    alternates: { canonical: `/progress/${slug}` },
  };
}

function Card({ label, value }) {
  return <div className="rounded-3xl bg-white p-5 text-center shadow-sm dark:bg-slate-900"><div className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</div><div className="mt-2 text-3xl font-black text-violet-600 dark:text-violet-300">{value}</div></div>;
}

export default async function PublicProgressPage({ params }) {
  const { slug } = await params;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("id,full_name,total_xp,total_tests,total_practice_seconds,best_net_wpm,best_gross_wpm,best_accuracy,current_streak,longest_streak,public_slug,share_enabled,referral_code,is_premium")
    .eq("public_slug", slug)
    .eq("share_enabled", true)
    .eq("is_premium", true)
    .maybeSingle();

  if (!profile) notFound();

  const { data: results } = await admin
    .from("test_results")
    .select("net_wpm,gross_wpm,accuracy,duration_seconds,difficulty,completed_at")
    .eq("user_id", profile.id)
    .order("completed_at", { ascending: false })
    .limit(20);

  const readiness = calculateReadiness(results || []);
  const level = getLevelInfo(profile.total_xp || 0);
  const practiceMinutes = Math.round((profile.total_practice_seconds || 0) / 60);
  const referralUrl = `${SITE_CONFIG.siteUrl}/?ref=${encodeURIComponent(profile.referral_code || "")}`;

  return (
    <main className="st-shell min-h-screen px-4 py-10 text-slate-800 dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2.3rem] bg-gradient-to-br from-violet-500 via-fuchsia-400 to-sky-400 p-7 text-white shadow-2xl sm:p-10">
          <div className="text-xs font-black uppercase tracking-[.2em] text-white/80">SarkariType Pro · Shared Progress</div>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">{profile.full_name || "SarkariType Learner"}</h1>
          <p className="mt-3 font-semibold text-white/90">Level {level.level} · {level.title} {profile.is_premium ? "· Pro 👑" : ""}</p>
          <div className="mt-5 inline-flex rounded-2xl bg-white/15 px-4 py-2 text-sm font-black">Readiness {readiness.overall}/100</div>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card label="Best Net WPM" value={profile.best_net_wpm || 0} />
          <Card label="Best Accuracy" value={`${profile.best_accuracy || 0}%`} />
          <Card label="Tests" value={profile.total_tests || 0} />
          <Card label="Practice" value={`${practiceMinutes}m`} />
          <Card label="XP" value={profile.total_xp || 0} />
          <Card label="Current Streak" value={`🔥 ${profile.current_streak || 0}`} />
          <Card label="Longest Streak" value={profile.longest_streak || 0} />
          <Card label="Best Gross WPM" value={profile.best_gross_wpm || 0} />
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="text-xl font-black">Exam readiness snapshot</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[['Speed', readiness.speed], ['Accuracy', readiness.accuracy], ['Consistency', readiness.consistency], ['Endurance', readiness.endurance]].map(([name, score]) => (
              <div key={name} className="rounded-2xl bg-violet-50 p-4 dark:bg-violet-500/10"><div className="text-xs font-black uppercase text-slate-400">{name}</div><div className="mt-1 text-2xl font-black">{score}/100</div></div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-gradient-to-r from-pink-50 to-sky-50 p-6 dark:from-pink-500/10 dark:to-sky-500/10">
          <h2 className="text-xl font-black">Think you can beat this progress?</h2>
          <p className="mt-2 font-semibold leading-6 text-slate-500">Join SarkariType using this learner&apos;s referral. If you buy Lifetime Pro while the referral is attached, you receive 20% off the regular ₹50 price.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={referralUrl} className="rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Join with 20% referral discount</a>
            <Link href="/" className="rounded-2xl bg-white px-5 py-3 font-black text-violet-600 shadow-sm dark:bg-slate-900 dark:text-violet-300">Try typing free</Link>
          </div>
        </section>

        <p className="mt-6 text-center text-xs font-semibold text-slate-400">This public report intentionally does not expose the learner&apos;s email or payment information.</p>
      </div>
    </main>
  );
}
