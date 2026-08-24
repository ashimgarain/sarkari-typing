import { EXAM_PAGES, LEARN_ARTICLES } from "../lib/content.mjs";

export default function sitemap() {
  const base = "https://sarkari-typing.vercel.app";
  const staticPages = ["", "/learn"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path ? "weekly" : "daily",
    priority: path ? 0.7 : 1,
  }));
  const examPages = EXAM_PAGES.map((page) => ({
    url: `${base}/exams/${page.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  const articles = LEARN_ARTICLES.map((article) => ({
    url: `${base}/learn/${article.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [...staticPages, ...examPages, ...articles];
}
