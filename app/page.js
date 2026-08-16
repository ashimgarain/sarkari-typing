"use client";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import confetti from "canvas-confetti";
import { createClient } from "@supabase/supabase-js";
import { Award, Lock, Moon, Sun, Play, RotateCcw, Activity } from "lucide-react";

// --- 1. CONFIGURATION ---
const SITE_CONFIG = {
  pricing: { amountINR: 50, freeTrialsAllowed: 1 },
  features: { enableConfetti: true, xpMultiplier: 10 },
  examModes: { SSC_CGL: { duration: 900 } }
};

// --- 2. EXAM PASSAGES ---
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

// --- 3. DATABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 4. MASTER COMPONENT ---
export default function SupremeTypingPortal() {
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_premium: false, total_xp: 0 });
  
  // Track free trials locally so users don't need to log in immediately
  const [localTestCount, setLocalTestCount] = useState(0);

  const [passageIndex, setPassageIndex] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(SITE_CONFIG.examModes.SSC_CGL.duration);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const inputRef = useRef(null);
  const currentPassage = PASSAGES[passageIndex].text;

  // Load User & Local Storage on mount
  useEffect(() => {
    const savedCount = parseInt(localStorage.getItem("sarkari_test_count") || "0");
    setLocalTestCount(savedCount);

    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (prof) setProfile(prof);
      }
    }
    loadUser();
  }, []);

  // Timer
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
    // If they aren't premium and used their free trial, hit the paywall
    if (!profile.is_premium && localTestCount >= SITE_CONFIG.pricing.freeTrialsAllowed) {
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

    const stats = calculateLiveStats();
    if (stats.acc > 90 && SITE_CONFIG.features.enableConfetti) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    // Increment free trial count
    if (!profile.is_premium) {
      const newCount = localTestCount + 1;
      setLocalTestCount(newCount);
      localStorage.setItem("sarkari_test_count", newCount.toString());
    }

    if (user) {
      const xpEarned = Math.round(stats.nwpm * (stats.acc / 100) * SITE_CONFIG.features.xpMultiplier);
      await supabase.from("test_results").insert({ user_id: user.id, net_wpm: stats.nwpm, accuracy: stats.acc, xp_earned: xpEarned });
      await supabase.from("profiles").update({ total_xp: profile.total_xp + xpEarned }).eq("id", user.id);
      setProfile({ ...profile, total_xp: profile.total_xp + xpEarned });
    } else {
        alert(`Time's Up! \nNet WPM: ${stats.nwpm} \nAccuracy: ${stats.acc}% \n\nSign in to save your XP to the Leaderboard!`);
    }
  };

  // --- LIVE CALCULATION ENGINE ---
  const calculateLiveStats = () => {
    const elapsedMins = (SITE_CONFIG.examModes.SSC_CGL.duration - timeLeft) / 60;
    if (elapsedMins <= 0) return { gwpm: 0, nwpm: 0, acc: 100 };
    
    const typedChars = input.length;
    const gwpm = Math.round((typedChars / 5) / elapsedMins) || 0;
    
    const typedWords = input.trim().split(/\s+/).filter(w => w.length > 0);
    const refWords = currentPassage.split(/\s+/);
    let mistakes = 0;
    
    typedWords.forEach((word, idx) => { if (word !== refWords[idx]) mistakes++; });
    
    const acc = typedChars > 0 ? Math.max(0, Math.round(((typedChars - (mistakes * 5)) / typedChars) * 100)) : 100;
    const nwpm = Math.max(0, Math.round(gwpm * (acc / 100)));
    
    return { gwpm, nwpm, acc };
  };

  // --- REAL-TIME HIGHLIGHTING ENGINE ---
  const renderPassage = () => {
    const typedWords = input.trim().split(/\s+/);
    const refWords = currentPassage.split(/\s+/);

    return refWords.map((word, idx) => {
      let colorClass = "text-slate-500 dark:text-slate-400"; // default un-typed
      
      if (idx < typedWords.length - 1 || (idx === typedWords.length - 1 && input.endsWith(" "))) {
        // Word is fully typed
        colorClass = word === typedWords[idx] ? "text-emerald-500 font-bold" : "text-red-500 line-through bg-red-500/10 rounded";
      } else if (idx === typedWords.length - 1 && !input.endsWith(" ")) {
        // Currently typing this word
        colorClass = word.startsWith(typedWords[idx]) ? "text-blue-600 dark:text-blue-400 bg-blue-500/20 rounded border-b-2 border-blue-500" : "text-red-500 bg-red-500/20 rounded border-b-2 border-red-500";
      }
      return <span key={idx} className={`${colorClass} mr-1.5 px-0.5 transition-colors duration-150`}>{word}</span>;
    });
  };

  const handleLogin = async () => {
    try {
        await supabase.auth.signInWithOAuth({ provider: "google" });
    } catch(err) {
        alert("Google Login is not configured yet. Proceed with Guest Mode!");
    }
  };

  const handlePayment = async () => {
    if (!user) {
        alert("Please log in first to secure your premium account!");
        return;
    }
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

  const liveStats = calculateLiveStats();

  return (
    <div className={theme === "dark" ? "dark bg-[#0B1120] text-slate-100 min-h-screen" : "bg-slate-50 text-slate-900 min-h-screen"}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      {/* Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800/60 px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <h1 className="text-3xl font-black tracking-tight text-blue-600">Sarkari<span className="text-slate-800 dark:text-white">Type</span></h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                <Award className="w-5 h-5"/> {profile.total_xp} XP
              </span>
              {!profile.is_premium && (
                <button onClick={() => setShowPaywall(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-5 py-2 rounded-full text-sm shadow-lg hover:scale-105 transition transform">
                  Unlock Pro
                </button>
              )}
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold shadow-md transition">
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 mt-6">
        {/* Live Metrics Dashboard */}
        <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Time Left</span>
                <span className="text-3xl font-black font-mono text-blue-500">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net WPM</span>
                <span className="text-3xl font-black font-mono">{liveStats.nwpm}</span>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Accuracy</span>
                <span className={`text-3xl font-black font-mono ${liveStats.acc < 90 ? 'text-red-500' : 'text-emerald-500'}`}>{liveStats.acc}%</span>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Keystrokes</span>
                <span className="text-3xl font-black font-mono">{input.length}</span>
            </div>
        </div>

        {/* Passage Selection */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          {PASSAGES.map((p, idx) => (
            <button 
              key={p.id} 
              onClick={() => { if(!isActive) setPassageIndex(idx); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                passageIndex === idx 
                ? "bg-blue-600 text-white shadow-md scale-105" 
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              Passage {p.id} {idx > 0 && !profile.is_premium ? <Lock className="inline w-3 h-3 ml-1 text-slate-400"/> : ""}
            </button>
          ))}
        </div>

        {/* Interactive Typing Area */}
        <div className="bg-white dark:bg-slate-800/80 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 relative">
          
          <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
            <div className="flex items-center gap-2 text-slate-500 font-semibold">
                <Activity className="w-5 h-5 text-blue-500" /> Live SSC DEST Evaluation
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setInput(""); setTimeLeft(SITE_CONFIG.examModes.SSC_CGL.duration); setIsActive(false); setIsFinished(false); }} className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition text-slate-600 dark:text-slate-300">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={startTest} className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-lg flex items-center gap-2 shadow-lg hover:scale-105 transition transform">
                <Play className="w-4 h-4 fill-current" /> {localTestCount === 0 ? "Start Free Trial" : "Start Mock Test"}
              </button>
            </div>
          </div>
          
          {/* Reference Passage with Dynamic Highlighting */}
          <div className="text-xl font-mono leading-[2.2] select-none h-48 overflow-y-auto mb-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
            {renderPassage()}
          </div>
          
          {/* Typing Input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            disabled={isFinished}
            className="w-full h-40 p-5 font-mono text-xl rounded-2xl bg-slate-50 dark:bg-[#0B1120] border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none resize-none transition-all placeholder:text-slate-400"
            placeholder={isActive ? "Type exactly as written above..." : "Click the blue 'Start' button to begin your test..."}
          />
        </div>
      </main>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-10 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <Lock className="w-14 h-14 text-amber-500 mx-auto mb-6" />
            <h3 className="text-3xl font-black mb-3">Free Trial Used</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">You have completed your free evaluation. Unlock all 10 official exam passages and secure your spot on the global leaderboard.</p>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 mb-8 border border-slate-200 dark:border-slate-700">
                <div className="text-5xl font-black text-blue-600 mb-2">₹{SITE_CONFIG.pricing.amountINR}</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">One-Time Lifetime Access</div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button onClick={handlePayment} className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-lg shadow-lg hover:scale-[1.02] transition transform">
                Pay via UPI / Card
              </button>
              <button onClick={() => setShowPaywall(false)} className="w-full py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}