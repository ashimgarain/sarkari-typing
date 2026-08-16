"use client";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import confetti from "canvas-confetti";
import { createClient } from "@supabase/supabase-js";
import { Award, Lock, Moon, Sun, Play, RotateCcw } from "lucide-react";

// --- 1. CONFIGURATION (Embedded here so Vercel never loses it) ---
const SITE_CONFIG = {
  pricing: { amountINR: 50, freeTrialsAllowed: 1 },
  features: { enableSoundEffects: true, enableConfettiOnHighAccuracy: true, xpMultiplier: 10 },
  examModes: {
    SSC_CGL: { name: "SSC CGL (DEST)", duration: 900, targetWpm: 27, allowBackspace: true },
    HIGH_COURT: { name: "High Court (Strict)", duration: 600, targetWpm: 35, allowBackspace: false },
    STATE_PSC: { name: "State PSC", duration: 600, targetWpm: 30, allowBackspace: true },
  }
};

// --- 2. EXAM PASSAGES (Embedded here so Vercel never loses them) ---
const PASSAGES = [
  { id: 1, text: "The efficacy of parliamentary democracy hinges fundamentally upon the robust functioning of statutory committees and legislative scrutiny. In our constitutional framework, the executive remains perpetually accountable to the legislature for all administrative actions, policy formulations, and fiscal allocations." },
  { id: 2, text: "Democratic decentralization through the institutionalization of Panchayati Raj structures represents a profound constitutional commitment toward grassroots governance. The historical enactment conferred formal statutory legitimacy upon local self-governing bodies, mandating regular elections and proportional representation." },
  { id: 3, text: "The structural stability of the Indian federation depends critically on the balanced equilibrium between central revenue collection and state expenditure commitments. The constitutional architecture recognizes inherent vertical and horizontal fiscal imbalances." },
  { id: 4, text: "The administration of justice constitutes the cornerstone of constitutional governance, ensuring the protection of fundamental liberties and the enforcement of the rule of law. A significant challenge confronting the judiciary is the persistent accumulation of pending litigation." },
  { id: 5, text: "An impartial, competent, and ethical civil service remains the permanent administrative backbone of constitutional governance in a multi-party parliamentary system. Civil servants are constitutionally mandated to execute statutory enactments with objective professionalism." },
  { id: 6, text: "The rapid expansion of Digital Public Infrastructure has transformed the delivery of public services and revolutionized citizen-state engagement. Direct Benefit Transfers, anchored by digital biometric authentication, ensure targeted fiscal subsidies reach entitled beneficiaries." },
  { id: 7, text: "Balancing industrial expansion with ecological preservation represents one of the most critical governance imperatives. Unsustainable environmental degradation and groundwater depletion impose severe socio-economic burdens on vulnerable communities." },
  { id: 8, text: "A resilient, equitable, and universally accessible public healthcare architecture is fundamental to human capital development. Emphasizing preventative wellness and maternal-child health interventions reduces the clinical burden on secondary medical colleges." },
  { id: 9, text: "The competitiveness of domestic manufacturing depends critically upon the efficiency of national multimodal logistics infrastructure. The implementation of integrated logistics master plans addresses these structural inefficiencies by synchronizing rail networks and modern highways." },
  { id: 10, text: "Universal access to formal, affordable, and regulated financial services constitutes an indispensable catalyst for socio-economic mobility. Financial inclusion initiatives ensure marginalized rural households obtain zero-balance bank accounts and affordable life insurance." }
];

// --- 3. DATABASE CONNECTION ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 4. MAIN TYPING PORTAL LOGIC ---
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

  useEffect(() => {
    let timer = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      finishTest();
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]);

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

    if (user) {
      await supabase.from("test_results").insert({ user_id: user.id, net_wpm: netWpm, accuracy, xp_earned: xpEarned });
      await supabase.from("profiles").update({ total_xp: profile.total_xp + xpEarned }).eq("id", user.id);
      setProfile({ ...profile, total_xp: profile.total_xp + xpEarned });
      setTestCount(testCount + 1);
    }
  };

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