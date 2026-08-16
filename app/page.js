"use client";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import confetti from "canvas-confetti";
import { createClient } from "@supabase/supabase-js";
import { Award, Lock, Moon, Sun, Play, RotateCcw, Activity, ChevronDown, Mail, CheckCircle2 } from "lucide-react";

// --- 1. MASTER CONFIGURATION ---
const SITE_CONFIG = {
  pricing: { amountINR: 50, freeTrialsAllowed: 1 },
  features: { xpMultiplier: 10 },
  examModes: [
    { id: "practice", name: "1-Min Quick Practice", duration: 60 },
    { id: "ssc", name: "SSC CGL (DEST)", duration: 900 },
    { id: "bank", name: "Banking Mains", duration: 600 },
    { id: "railway", name: "Railway NTPC", duration: 600 },
    { id: "psc", name: "State PSC (Clerk)", duration: 600 }
  ]
};

// --- 2. PROFESSIONAL LONG-FORM PASSAGES ---
const PASSAGES = [
  { id: 1, text: "The efficacy of parliamentary democracy hinges fundamentally upon the robust functioning of statutory committees and legislative scrutiny. In our constitutional framework, the executive remains perpetually accountable to the legislature for all administrative actions, policy formulations, and fiscal allocations. However, the contemporary landscape of governance presents multifaceted challenges that demand institutional agility. The rapid digitalization of public services requires civil servants to adapt to emerging technological paradigms while maintaining the utmost integrity in data privacy. Furthermore, the decentralization of financial powers through the Panchayati Raj institutions emphasizes the critical need for transparent auditing mechanisms at the grassroots level. It is imperative that future policymakers prioritize sustainable development goals alongside rapid economic expansion to ensure equitable resource distribution." },
  { id: 2, text: "Macroeconomic stability in developing nations is deeply intertwined with prudent fiscal management and strategic monetary policy interventions. The central bank plays an indispensable role in mitigating inflationary pressures while fostering an environment conducive to industrial credit expansion. Recent global supply chain disruptions have underscored the necessity of building resilient domestic manufacturing capabilities under the framework of self-reliance. Additionally, the integration of formal banking services with digital biometric authentication has revolutionized the delivery of direct benefit transfers to marginalized demographics. To sustain this momentum, structural reforms in the labor and agricultural sectors must be pursued with consensus-building across diverse political spectrums. The ultimate objective remains the eradication of multidimensional poverty through sustained and inclusive economic growth." },
  { id: 3, text: "The administration of justice constitutes the cornerstone of constitutional governance, ensuring the protection of fundamental liberties and the enforcement of the rule of law. A significant challenge confronting the contemporary judicial apparatus is the persistent accumulation of pending litigation across subordinate and appellate courts. Addressing this backlog requires the expedited modernization of judicial infrastructure, including the widespread adoption of virtual tribunals and electronic filing registries. Moreover, alternate dispute resolution mechanisms, such as mediation and Lok Adalats, must be heavily incentivized to reduce the burden on formal litigation channels. The independence of the judiciary must be fiercely protected against any unwarranted executive encroachment, for it is the ultimate arbiter of constitutional morality." },
  { id: 4, text: "Environmental conservation and sustainable ecological management have transitioned from peripheral concerns to central pillars of national security. The accelerating frequency of extreme climatic events necessitates the urgent implementation of comprehensive disaster risk reduction strategies. State governments must aggressively transition towards renewable energy portfolios, phasing out dependence on legacy fossil fuels. Groundwater depletion in agrarian states presents a severe existential threat to food security, requiring immediate legislative interventions to mandate rainwater harvesting and crop diversification. The preservation of biodiversity hotspots and the stringent enforcement of forest conservation laws remain non-negotiable imperatives for protecting the natural heritage of the subcontinent for future generations." },
  { id: 5, text: "Universal access to high-quality public healthcare and elementary education forms the bedrock of human capital development in any aspiring global superpower. The persistent disparity between urban and rural medical infrastructure requires a radical restructuring of primary health centers and the incentivization of rural medical postings. Preventative healthcare initiatives, focusing on maternal nutrition, sanitation, and immunization, yield the highest socio-economic returns on investment. Simultaneously, the educational curriculum must be overhauled to prioritize critical thinking, vocational skills, and digital literacy over rote memorization. Empowering the youth through equitable access to these fundamental social services is the only guaranteed pathway to capitalizing on the nation's demographic dividend." }
];

// --- 3. DATABASE CONNECTION ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 4. THE MASTERPIECE UI ---
export default function SupremeTypingPortal() {
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_premium: false, total_xp: 0 });
  const [localTestCount, setLocalTestCount] = useState(0);

  // Active States
  const [selectedExam, setSelectedExam] = useState(SITE_CONFIG.examModes[0]);
  const [passageIndex, setPassageIndex] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(selectedExam.duration);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Modals
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [authStatus, setAuthStatus] = useState("");

  const inputRef = useRef(null);
  const activeWordRef = useRef(null);
  const currentPassage = PASSAGES[passageIndex].text;

  // --- AUTO-SCROLL ENGINE ---
  useEffect(() => {
    if (activeWordRef.current && isActive) {
      activeWordRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [input, isActive]);

  // --- INITIALIZATION ---
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

  // --- TIMER LOGIC ---
  useEffect(() => {
    let timer = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      finishTest();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  // --- ACTIONS ---
  const handleExamChange = (e) => {
    if (isActive) return;
    const mode = SITE_CONFIG.examModes.find(m => m.id === e.target.value);
    setSelectedExam(mode);
    setTimeLeft(mode.duration);
  };

  const attemptPassageSelection = (idx) => {
    if (isActive) return;
    if (idx > 0 && !profile.is_premium) {
      setShowPaywall(true);
      return;
    }
    setPassageIndex(idx);
    setInput("");
    setTimeLeft(selectedExam.duration);
    setIsFinished(false);
  };

  const startTest = () => {
    if (!profile.is_premium && localTestCount >= SITE_CONFIG.pricing.freeTrialsAllowed) {
      setShowPaywall(true);
      return;
    }
    setInput("");
    setTimeLeft(selectedExam.duration);
    setIsActive(true);
    setIsFinished(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInput = (e) => {
    if (!isActive && !isFinished) setIsActive(true);
    setInput(e.target.value);
  };

  const finishTest = async () => {
    setIsActive(false);
    setIsFinished(true);

    const stats = calculateLiveStats();
    if (stats.acc > 90) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

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
        setTimeout(() => alert(`Time's Up! \nNet WPM: ${stats.nwpm} \nAccuracy: ${stats.acc}% \n\nCreate a free account to save your scores to the Leaderboard!`), 500);
    }
  };

  const calculateLiveStats = () => {
    const elapsedMins = (selectedExam.duration - timeLeft) / 60;
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

  // --- REAL-TIME HIGHLIGHT ENGINE ---
  const renderPassage = () => {
    const typedWords = input.trim().split(/\s+/);
    const refWords = currentPassage.split(/\s+/);

    return refWords.map((word, idx) => {
      const isCurrentWord = (idx === typedWords.length - 1 && !input.endsWith(" "));
      let colorClass = "text-slate-400 dark:text-slate-500"; // un-typed
      
      if (idx < typedWords.length - 1 || (idx === typedWords.length - 1 && input.endsWith(" "))) {
        colorClass = word === typedWords[idx] ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-red-500 line-through bg-red-100 dark:bg-red-500/20 rounded";
      } else if (isCurrentWord) {
        colorClass = word.startsWith(typedWords[idx]) 
          ? "text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 rounded border-b-2 border-blue-500 shadow-sm" 
          : "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 rounded border-b-2 border-red-500";
      }
      return (
        <span key={idx} ref={isCurrentWord ? activeWordRef : null} className={`${colorClass} mr-2 px-1 py-0.5 transition-colors duration-100 text-2xl tracking-wide leading-[2.5]`}>
          {word}
        </span>
      );
    });
  };

  // --- NATIVE EMAIL AUTHENTICATION ---
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthStatus("Sending secure link...");
    const { error } = await supabase.auth.signInWithOtp({ email: emailInput });
    if (error) {
        setAuthStatus("Error: " + error.message);
    } else {
        setAuthStatus("✅ Magic link sent! Check your email inbox to log in instantly.");
    }
  };

  const handlePayment = async () => {
    if (!user) {
        setShowPaywall(false);
        setShowAuthModal(true);
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
    <div className={theme === "dark" ? "dark bg-[#0B1120] text-slate-100 min-h-screen font-sans selection:bg-blue-500/30" : "bg-slate-50 text-slate-900 min-h-screen font-sans selection:bg-blue-200"}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-500">Sarkari<span className="text-slate-800 dark:text-white">Type</span></h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 shadow-sm">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1 bg-amber-100 dark:bg-amber-500/10 px-4 py-2 rounded-full border border-amber-300 dark:border-amber-500/20 shadow-sm">
                <Award className="w-5 h-5"/> {profile.total_xp} XP
              </span>
              {!profile.is_premium && (
                <button onClick={() => setShowPaywall(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-5 py-2 rounded-full text-sm shadow-md hover:shadow-lg hover:scale-105 transition transform border border-amber-600">
                  Unlock Pro
                </button>
              )}
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition">
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-4">
        
        {/* EXAM MODE MENU */}
        <div className="flex justify-between items-center mb-8 bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">Select Exam Mode:</h2>
            </div>
            <div className="relative">
                <select 
                    value={selectedExam.id} 
                    onChange={handleExamChange}
                    disabled={isActive}
                    className="appearance-none bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3 pl-5 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-inner disabled:opacity-50"
                >
                    {SITE_CONFIG.examModes.map(mode => (
                        <option key={mode.id} value={mode.id}>{mode.name} ({Math.floor(mode.duration / 60)} Mins)</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            </div>
        </div>

        {/* LIVE METRICS */}
        <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center transform hover:scale-105 transition">
                <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Time Left</span>
                <span className={`text-4xl font-black font-mono ${timeLeft < 60 && isActive ? 'text-red-500 animate-pulse' : 'text-blue-600 dark:text-blue-400'}`}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </span>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center transform hover:scale-105 transition">
                <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Net WPM</span>
                <span className="text-4xl font-black font-mono text-slate-800 dark:text-white">{liveStats.nwpm}</span>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center transform hover:scale-105 transition">
                <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Accuracy</span>
                <span className={`text-4xl font-black font-mono ${liveStats.acc < 90 ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{liveStats.acc}%</span>
            </div>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center transform hover:scale-105 transition">
                <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Keystrokes</span>
                <span className="text-4xl font-black font-mono text-slate-800 dark:text-white">{input.length}</span>
            </div>
        </div>

        {/* PASSAGE SELECTION PILLS */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-4 custom-scrollbar">
          {PASSAGES.map((p, idx) => {
            const isLocked = idx > 0 && !profile.is_premium;
            return (
                <button 
                key={p.id} 
                onClick={() => attemptPassageSelection(idx)}
                className={`px-6 py-3 rounded-xl text-sm font-black whitespace-nowrap transition-all shadow-sm flex items-center gap-2 ${
                    passageIndex === idx 
                    ? "bg-blue-600 text-white scale-105 shadow-md border border-blue-700" 
                    : isLocked 
                        ? "bg-slate-100 dark:bg-slate-900/50 text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-200 cursor-pointer"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700"
                }`}
                >
                Passage {p.id} {isLocked ? <Lock className="w-4 h-4"/> : ""}
                </button>
            )
          })}
        </div>

        {/* INTERACTIVE TYPING CONSOLE */}
        <div className="bg-white dark:bg-slate-800/80 p-8 rounded-[2rem] shadow-2xl border border-slate-300 dark:border-slate-700 relative">
          
          <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-6">
            <div className="flex flex-col">
                <span className="text-xl font-black text-slate-800 dark:text-white">{selectedExam.name} Evaluation</span>
                <span className="text-sm font-bold text-slate-500">Official Format • Strict Accuracy Tracking</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setInput(""); setTimeLeft(selectedExam.duration); setIsActive(false); setIsFinished(false); }} className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-sm hover:shadow">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={startTest} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition transform border border-indigo-700">
                <Play className="w-5 h-5 fill-current" /> {localTestCount === 0 ? "Start Free Trial" : "Start Mock Test"}
              </button>
            </div>
          </div>
          
          {/* Reference Passage (Auto-Scrolling) */}
          <div className="mb-8 p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-200 dark:border-slate-800 h-64 overflow-y-auto scroll-smooth custom-scrollbar relative">
            {renderPassage()}
          </div>
          
          {/* Typing Input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            disabled={isFinished}
            className="w-full h-48 p-6 font-mono text-2xl leading-relaxed rounded-2xl bg-white dark:bg-[#0B1120] border-2 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none resize-none transition-all placeholder:text-slate-400 shadow-inner"
            placeholder={isActive ? "Type exactly as written above..." : "Click the blue 'Start Mock Test' button to begin..."}
          />
        </div>
      </main>

      {/* --- EMAIL AUTH MODAL (Fixes the Google Error) --- */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-10 rounded-3xl max-w-md w-full text-center shadow-2xl relative">
            <Mail className="w-14 h-14 text-blue-600 mx-auto mb-6" />
            <h3 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">Secure Login</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Enter your email to receive an instant, password-free login link.</p>
            
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 mb-6">
                <input 
                    type="email" 
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email address" 
                    className="w-full px-5 py-4 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button type="submit" className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-lg transition transform hover:-translate-y-0.5">
                    Send Magic Link
                </button>
            </form>

            {authStatus && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2 text-left text-sm">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{authStatus}</span>
                </div>
            )}

            <button onClick={() => { setShowAuthModal(false); setAuthStatus(""); }} className="w-full py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                Close
            </button>
          </div>
        </div>
      )}

      {/* --- PAYWALL MODAL --- */}
      {showPaywall && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-10 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <Lock className="w-14 h-14 text-amber-500 mx-auto mb-6" />
            <h3 className="text-3xl font-black mb-3 text-slate-900 dark:text-white">Premium Locked</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Unlock all 10 official long-form exam passages, multiple exam modes, and secure your spot on the global leaderboard.</p>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 mb-8 border border-slate-200 dark:border-slate-700">
                <div className="text-5xl font-black text-blue-600 mb-2">₹{SITE_CONFIG.pricing.amountINR}</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">One-Time Lifetime Access</div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button onClick={handlePayment} className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-lg shadow-lg hover:-translate-y-0.5 transition transform border border-orange-600">
                {user ? "Pay via UPI / Card" : "Sign In to Upgrade"}
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