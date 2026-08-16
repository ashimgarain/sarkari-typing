"use client";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import confetti from "canvas-confetti";
import { createClient } from "@supabase/supabase-js";
import { SITE_CONFIG } from "../config/site";
import { PASSAGES } from "../data/passages";
import { Award, Lock, Moon, Sun, Play, RotateCcw } from "lucide-react";

// Initialize Supabase (Ensure your .env.local has these keys)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function SupremeTypingPortal() {
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_premium: false, total_xp: 0 });
  const [testCount, setTestCount] = useState(0);

  const [passageIndex, setPassageIndex] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(SITE_CONFIG.examModes.SSC_CGL.duration);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const inputRef = useRef(null);
  const currentPassage = PASSAGES[passageIndex].text;

  // 1. Load User Data on Start
  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (prof) setProfile(prof);

        const { count } = await supabase.from("test_results").select("*", { count: "exact" }).eq("user_id", session.user.id);
        setTestCount(count || 0);
      }
    }
    loadUser();
  }, []);

  // 2. Timer Logic
  useEffect(() => {
    let timer = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      finishTest();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  // 3. Test Controls
  const startTest = () => {
    if (!user) {
      supabase.auth.signInWithOAuth({ provider: "google" });
      return;
    }
    if (!profile.is_premium && testCount >= SITE_CONFIG.pricing.freeTrialsAllowed) {
      setShowPaywall(true);
      return;
    }
    setInput("");
    setTimeLeft(SITE_CONFIG.examModes.SSC_CGL.duration);
    setIsActive(true);
    setIsFinished(false);
    inputRef.current?.focus();
  };

  const handleInput = (e) => {
    if (!isActive && !isFinished) setIsActive(true);
    setInput(e.target.value);
  };

  // 4. Finishing and Scoring
  const finishTest = async () => {
    setIsActive(false);
    setIsFinished(true);

    const totalChars = input.length;
    const grossWpm = Math.round((totalChars / 5) / (SITE_CONFIG.examModes.SSC_CGL.duration / 60)) || 0;
    
    let mistakes = 0;
    const refWords = currentPassage.split(" ");
    const typedWords = input.trim().split(" ");
    typedWords.forEach((word, idx) => { if (refWords[idx] !== word) mistakes++; });
    
    const accuracy = totalChars > 0 ? Math.max(0, Math.round(((totalChars - (mistakes * 5)) / totalChars) * 100)) : 0;
    const netWpm = Math.max(0, Math.round(grossWpm * (accuracy / 100)));
    const xpEarned = Math.round(netWpm * (accuracy / 100) * SITE_CONFIG.features.xpMultiplier);

    if (accuracy > 90) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

    // Save to Database
    if (user) {
      await supabase.from("test_results").insert({ user_id: user.id, net_wpm: netWpm, accuracy, xp_earned: xpEarned });
      await supabase.from("profiles").update({ total_xp: profile.total_xp + xpEarned }).eq("id", user.id);
      setProfile({ ...profile, total_xp: profile.total_xp + xpEarned });
      setTestCount(testCount + 1);
    }
  };

  // 5. Razorpay Checkout
  const handlePayment = async () => {
    const res = await fetch("/api/create-order", {
      method: "POST",
      body: JSON.stringify({ userId: user.id, amount: SITE_CONFIG.pricing.amountINR }),
    });
    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      name: "SarkariType Premium",
      description: "Unlock all Passages & Leaderboard",
      order_id: order.id,
      handler: async (response) => {
        const verifyRes = await fetch("/api/verify-payment", {
          method: "POST",
          body: JSON.stringify({ ...response, userId: user.id }),
        });
        const result = await verifyRes.json();
        if (result.success) {
          setShowPaywall(false);
          setProfile({ ...profile, is_premium: true });
          alert("Payment Successful! Lifetime access granted.");
        }
      },
      prefill: { email: user?.email },
      theme: { color: "#2563EB" },
    };
    new window.Razorpay(options).open();
  };

  return (
    <div className={theme === "dark" ? "dark bg-slate-950 text-slate-100 min-h-screen" : "bg-slate-50 text-slate-900 min-h-screen"}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      {/* Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center max-w-5xl mx-auto">
        <h1 className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-500">SarkariType</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="font-bold text-amber-500 flex items-center gap-1"><Award className="w-5 h-5"/> {profile.total_xp} XP</span>
              {!profile.is_premium && (
                <button onClick={() => setShowPaywall(true)} className="bg-amber-500 text-black font-bold px-4 py-2 rounded-lg text-sm shadow-lg hover:bg-amber-400">
                  Unlock Premium
                </button>
              )}
            </div>
          ) : (
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 mt-4">
        {/* Exam Select */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {PASSAGES.map((p, idx) => (
            <button 
              key={p.id} 
              onClick={() => { if(!isActive) setPassageIndex(idx); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${passageIndex === idx ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800"}`}
            >
              Passage {p.id}
            </button>
          ))}
        </div>

        {/* Typing Area */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold font-mono text-blue-500">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
            <div className="flex gap-2">
              <button onClick={() => { setInput(""); setTimeLeft(SITE_CONFIG.examModes.SSC_CGL.duration); setIsActive(false); setIsFinished(false); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={startTest} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2">
                <Play className="w-4 h-4" /> Start
              </button>
            </div>
          </div>
          
          <div className="text-lg font-mono text-slate-500 mb-6 select-none h-40 overflow-y-auto leading-relaxed">{currentPassage}</div>
          
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            disabled={isFinished}
            className="w-full h-40 p-4 font-mono text-lg rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus:border-blue-500 outline-none resize-none"
            placeholder={isActive ? "Type exactly as written above..." : "Click 'Start' to begin test..."}
          />
        </div>
      </main>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl max-w-md w-full text-center">
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-2">Free Trial Completed</h3>
            <p className="text-slate-500 mb-6">Unlock all 10 administrative passages and climb the global leaderboard for a single payment.</p>
            <div className="text-4xl font-black text-blue-600 mb-6">₹{SITE_CONFIG.pricing.amountINR}</div>
            <div className="flex gap-3">
              <button onClick={() => setShowPaywall(false)} className="flex-1 py-3 rounded-lg border border-slate-300 dark:border-slate-700 font-bold">Cancel</button>
              <button onClick={handlePayment} className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold">Pay via UPI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}