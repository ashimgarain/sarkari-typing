import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffafc] p-6 text-slate-800 dark:bg-[#090d18] dark:text-slate-100">
      <div className="max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-xl dark:bg-slate-900">
        <div className="text-5xl">⌨️</div>
        <h1 className="mt-4 text-3xl font-black">Page not found</h1>
        <p className="mt-2 font-semibold text-slate-500">The link may be private, expired, or typed incorrectly.</p>
        <Link href="/" className="mt-5 inline-block rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Back to SarkariType</Link>
      </div>
    </main>
  );
}
