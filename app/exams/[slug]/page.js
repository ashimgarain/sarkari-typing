import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAM_PAGES, findExamPage } from "../../../lib/content.mjs";

export function generateStaticParams() {
  return EXAM_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = findExamPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/exams/${page.slug}` },
  };
}

export default async function ExamLandingPage({ params }) {
  const { slug } = await params;
  const page = findExamPage(slug);
  if (!page) notFound();

  return (
    <main className="st-shell min-h-screen px-4 py-10 text-slate-800 dark:text-slate-100 sm:px-6">
      <article className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-black text-violet-600 dark:text-violet-300">← Open SarkariType Pro</Link>
        <div className="mt-6 rounded-[2.2rem] bg-gradient-to-br from-violet-500 via-fuchsia-400 to-sky-400 p-7 text-white shadow-xl sm:p-10">
          <div className="text-xs font-black uppercase tracking-[.2em] text-white/80">Free Exam Practice Guide</div>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">{page.title}</h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/90">{page.description}</p>
          <Link href={`/?exam=${encodeURIComponent(page.examMode)}`} className="mt-6 inline-block rounded-2xl bg-white px-5 py-3 font-black text-violet-700">Start free practice →</Link>
        </div>

        <section className="mt-7 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="text-2xl font-black">How to practise effectively</h2>
          <div className="mt-4 grid gap-3">
            {page.tips.map((tip, index) => <div key={tip} className="rounded-2xl bg-violet-50 p-4 font-semibold leading-6 dark:bg-violet-500/10"><span className="mr-2 font-black text-violet-600 dark:text-violet-300">{index + 1}.</span>{tip}</div>)}
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-sky-50 p-6 dark:bg-sky-500/10">
          <h2 className="text-xl font-black">What SarkariType tracks</h2>
          <p className="mt-2 font-semibold leading-7 text-slate-600 dark:text-slate-300">Net WPM, Gross WPM, accuracy, character mistakes, practice time, XP, streak, personal bests and exam-readiness trends are stored for signed-in learners.</p>
        </section>
      </article>
    </main>
  );
}
