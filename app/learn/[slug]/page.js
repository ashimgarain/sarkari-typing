import Link from "next/link";
import { notFound } from "next/navigation";
import { LEARN_ARTICLES, findLearnArticle } from "../../../lib/content.mjs";

export function generateStaticParams() {
  return LEARN_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = findLearnArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/learn/${article.slug}` },
  };
}

export default async function LearnArticlePage({ params }) {
  const { slug } = await params;
  const article = findLearnArticle(slug);
  if (!article) notFound();

  return (
    <main className="st-shell min-h-screen px-4 py-10 text-slate-800 dark:text-slate-100 sm:px-6">
      <article className="mx-auto max-w-3xl">
        <Link href="/learn" className="text-sm font-black text-violet-600 dark:text-violet-300">← All typing guides</Link>
        <div className="mt-6 rounded-[2.2rem] bg-white p-7 shadow-sm dark:bg-slate-900 sm:p-10">
          <div className="text-xs font-black uppercase tracking-[.2em] text-violet-500">SarkariType Learning Lab</div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">{article.title}</h1>
          <p className="mt-3 font-semibold leading-7 text-slate-500">{article.description}</p>
          <div className="mt-7 space-y-6">
            {article.sections.map(([heading, body]) => (
              <section key={heading}>
                <h2 className="text-xl font-black">{heading}</h2>
                <p className="mt-2 font-semibold leading-7 text-slate-600 dark:text-slate-300">{body}</p>
              </section>
            ))}
          </div>
          <Link href="/" className="mt-8 inline-block rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Practise this now →</Link>
        </div>
      </article>
    </main>
  );
}
