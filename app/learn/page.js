import Link from "next/link";
import { LEARN_ARTICLES } from "../../lib/content.mjs";

export const metadata = {
  title: "Typing Guides",
  description: "Practical typing guides for accuracy, speed, home-row technique and government exam preparation.",
};

export default function LearnIndexPage() {
  return (
    <main className="st-shell min-h-screen px-4 py-10 text-slate-800 dark:text-slate-100 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-black text-violet-600 dark:text-violet-300">← SarkariType Pro</Link>
        <h1 className="mt-5 text-4xl font-black">Typing Guides</h1>
        <p className="mt-2 max-w-2xl font-semibold leading-7 text-slate-500">Short, practical guides designed to improve real typing performance rather than only test scores.</p>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {LEARN_ARTICLES.map((article, index) => (
            <Link key={article.slug} href={`/learn/${article.slug}`} className={`rounded-3xl p-6 shadow-sm transition hover:-translate-y-1 ${index % 3 === 0 ? "bg-pink-50 dark:bg-pink-500/10" : index % 3 === 1 ? "bg-sky-50 dark:bg-sky-500/10" : "bg-lime-50 dark:bg-lime-500/10"}`}>
              <div className="text-xs font-black uppercase tracking-widest text-violet-500">Guide {String(index + 1).padStart(2, "0")}</div>
              <h2 className="mt-2 text-xl font-black">{article.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{article.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
