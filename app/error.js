"use client";

export default function ErrorPage({ error, reset }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffafc] p-6 text-slate-800 dark:bg-[#090d18] dark:text-slate-100">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-xl dark:bg-slate-900">
        <div className="text-5xl">🌧️</div>
        <h1 className="mt-4 text-2xl font-black">Something interrupted this page</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Your payment and saved profile are not changed by this screen. Try loading this page again.</p>
        <button type="button" onClick={() => reset()} className="mt-5 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white">Try again</button>
        {process.env.NODE_ENV === "development" ? <pre className="mt-4 overflow-auto rounded-xl bg-slate-100 p-3 text-left text-xs dark:bg-slate-950">{error?.message}</pre> : null}
      </div>
    </main>
  );
}
