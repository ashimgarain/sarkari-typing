"use client";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import confetti from "canvas-confetti";
import { createClient } from "@supabase/supabase-js";
import { Award, Lock, Moon, Sun, Play, RotateCcw, Activity, ChevronDown, User, LogOut, Trophy, Eye, EyeOff } from "lucide-react";

// --- 1. CONFIGURATION ---
const SITE_CONFIG = {
  pricing: { amountINR: 50 },
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
  { id: 5, text: "Universal access to high-quality public healthcare and elementary education forms the bedrock of human capital development in any aspiring global superpower. The persistent disparity between urban and rural medical infrastructure requires a radical restructuring of primary health centers and the incentivization of rural medical postings. Preventative healthcare initiatives, focusing on maternal nutrition, sanitation, and immunization, yield the highest socio-economic returns on investment. Simultaneously, the educational curriculum must be overhauled to prioritize critical thinking, vocational skills, and digital literacy over rote memorization. Empowering the youth through equitable access to these fundamental social services is the only guaranteed pathway to capitalizing on the nation's demographic dividend." },
  { id: 6, text: "The architectural framework of international trade relies heavily on multilateral agreements and transparent tariff regulations. Domestic industries must continuously innovate to maintain competitiveness in global markets dominated by rapid technological obsolescence. Strategic state investments in multimodal logistics infrastructure, including dedicated freight corridors and modernized port terminals, significantly reduce transit times and operational costs. Furthermore, the harmonization of intellectual property laws with international standards attracts foreign direct investment and fosters a domestic culture of scientific research. A robust dispute resolution mechanism within the national commercial courts ensures that international investors retain confidence in the domestic legal system, thereby accelerating cross-border economic integration." },
  { id: 7, text: "Municipal governance and urban planning dictate the quality of life for a rapidly expanding metropolitan population. The unregulated proliferation of informal settlements poses severe public health risks and strains existing civic amenities. Administrators must prioritize the development of integrated public transit networks to alleviate traffic congestion and reduce vehicular emissions. Efficient solid waste management, anchored by source segregation and decentralized processing units, is critical for urban sanitation. In addition, the implementation of smart city technologies, utilizing real-time data analytics, allows municipal corporations to optimize resource allocation, monitor air quality, and respond rapidly to civic grievances in densely populated urban agglomerations." },
  { id: 8, text: "The transition toward a digitized economy mandates the establishment of a robust cybersecurity infrastructure to protect critical national assets. Financial institutions, power grids, and healthcare registries are increasingly vulnerable to sophisticated state-sponsored cyber espionage and ransomware attacks. Legislative frameworks must evolve rapidly to mandate stringent data localization norms and mandatory breach reporting protocols. Promoting indigenous capabilities in cryptographic research and hardware manufacturing reduces dependence on vulnerable foreign supply chains. Citizens must also be educated on digital hygiene to prevent widespread financial fraud, ensuring that the digital transformation of the economy does not compromise individual privacy or national security." },
  { id: 9, text: "Agricultural resilience in the face of climate change requires a fundamental paradigm shift from input-intensive farming to sustainable agroecological practices. The over-reliance on chemical fertilizers has degraded soil fertility and contaminated critical groundwater reserves. Providing farmers with localized meteorological data and promoting drought-resistant crop varieties can significantly mitigate the economic impact of erratic monsoon patterns. Moreover, strengthening post-harvest infrastructure, including decentralized cold storage facilities and efficient market linkages, ensures that farmers receive remunerative prices for their produce. Cooperative farming models and access to institutional credit remain essential tools for empowering marginalized agricultural laborers and securing the national food supply." },
  { id: 10, text: "The successful implementation of any progressive public policy relies entirely upon an efficient, transparent, and politically neutral civil service. Bureaucratic inertia and procedural complexities frequently delay the execution of critical infrastructure projects, leading to massive cost overruns. Emphasizing continuous professional training, performance-based appraisals, and the lateral entry of domain experts can significantly enhance administrative capacity. Furthermore, leveraging e-governance platforms eliminates intermediaries, thereby reducing systemic corruption and ensuring that the benefits of welfare schemes reach the intended beneficiaries directly. Ultimately, good governance is measured by its responsiveness to the most vulnerable sections of society." }
];

// --- 3. SUPABASE INITIALIZATION ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 4. MAIN COMPONENT ---
export default function SupremeTypingPortal() {
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ is_premium: false, total_xp: 0 });

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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  // Leaderboard Data
  const [leaderboard, setLeaderboard] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

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
    // Explicitly check for light mode override
    if (localStorage.getItem("theme") === "light") {
      setTheme("light");
    }

    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        refreshProfile(session.user.id);
      }
    };
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) refreshProfile(session.user.id);
      else setProfile({ is_premium: false, total_xp: 0 });
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

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

  // --- AUTH METHODS ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        setAuthError("Account created! You are now logged in.");
        setTimeout(() => setShowAuthModal(false), 1500);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        setShowAuthModal(false);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  // --- EXAM LOGIC ---
  const handleExamChange = (e) => {
    if (isActive) return;
    const mode = SITE_CONFIG.examModes.find(m => m.id === e.target.value);
    setSelectedExam(mode);
    setTimeLeft(mode.duration);
  };

  const attemptPassageSelection = (idx) => {
    if (isActive) return;
    // FIX 2: Explicitly lock passages 2-10 if not premium. Passage 1 (idx 0) is always allowed.
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
    // FIX 2: Ensure the Start button only checks if the current passage is locked. 
    // Passage 1 is permanently free for all exam modes.
    if (!profile.is_premium && passageIndex > 0) {
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
    if (e.target.value.length <= currentPassage.length) {
      setInput(e.target.value);
    }
  };

  const calculateLiveStats = () => {
    const elapsedMins = Math.max((selectedExam.duration - timeLeft) / 60, 1 / 60);
    const typedChars = input.length;
    let correctChars = 0;
    
    for (let i = 0; i < typedChars; i++) {
      if (input[i] === currentPassage[i]) correctChars++;
    }
    
    const grossWpm = Math.round((typedChars / 5) / elapsedMins) || 0;
    const netWpm = Math.max(0, Math.round((correctChars / 5) / elapsedMins));
    const acc = typedChars > 0 ? Math.max(0, Math.round((correctChars / typedChars) * 100)) : 100;
    
    return { gwpm: grossWpm, nwpm: netWpm, acc, correctChars };
  };

  const finishTest = async () => {
    setIsActive(false);
    setIsFinished(true);

    const stats = calculateLiveStats();
    if (stats.acc > 90) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

    if (user) {
      await supabase.from("test_results").insert({ 
        user_id: user.id, 
        net_wpm: stats.nwpm, 
        accuracy: stats.acc, 
        xp_earned: 0 
      });
      setTimeout(() => refreshProfile(user.id), 1000); 
    } else {
      setTimeout(() => alert(`Time's Up!\nNet WPM: ${stats.nwpm}\nAccuracy:${stats.acc}%\n\nLog in or create an account to save your scores!`), 500);
    }
  };

  // --- CHARACTER-LEVEL HIGHLIGHTING ---
  const renderPassage = () => {
    return currentPassage.split('').map((char, index) => {
      let className = "text-slate-400 dark:text-slate-500 transition-colors"; 
      if (index < input.length) {
        className = input[index] === char 
          ? "text-emerald-600 dark:text-emerald-400 font-bold" 
          : "text-red-500 bg-red-100 dark:bg-red-500/20 underline decoration-red-500";
      } else if (index === input.length && isActive) {
        className = "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 underline decoration-2 underline-offset-4"; 
      }
      return (
        <span key={index} ref={index === input.length ? activeWordRef : null} className={className}>
          {char}
        </span>
      );
    });
  };

  // --- RAZORPAY PAYMENT ---
  const handlePayment = async () => {
    if (!user) {
      setShowPaywall(false);
      setShowAuthModal(true);
      return;
    }
    setPaymentLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please log in again.");

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "SarkariType Pro",
        description: "Lifetime Premium Access",
        order_id: order.id,
        handler: async (response) => {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}` 
            },
            body: JSON.stringify({ ...response })
          });
          const result = await verifyRes.json();
          if (result.success) {
            setShowPaywall(false);
            refreshProfile(user.id);
            alert("Payment Successful! Lifetime access granted.");
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: { email: user?.email },
        theme: { color: "#2563EB" },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      alert(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  // --- LEADERBOARD ---
  const fetchLeaderboard = async () => {
    setShowLeaderboard(true);
    const { data } = await supabase.from("leaderboard").select("*").limit(10);
    setLeaderboard(data || []);
  };

  const liveStats = calculateLiveStats();

  // FIX 1: The 'dark' class wrapper ensures Light Mode fully strips the dark styles regardless of Windows settings.
  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 min-h-screen font-sans transition-colors duration-200">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-500">Sarkari<span className="text-slate-800 dark:text-white">Type</span> <span className="text-amber-500 text-lg">Pro</span></h1>
          
          <div className="flex gap-4 items-center">
            <button onClick={fetchLeaderboard} className="flex items-center gap-2 text-sm font-bold bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard
            </button>
            
            <button onClick={toggleTheme} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 shadow-sm">
              {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
            </button>
            
            {user ? (
              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1 bg-amber-100 dark:bg-amber-500/10 px-4 py-2 rounded-full border border-amber-300 dark:border-amber-500/20 shadow-sm">
                  <Award className="w-5 h-5"/> {profile.total_xp} XP
                </span>
                {!profile.is_premium && (
                  <button onClick={() => setShowPaywall(true)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-5 py-2 rounded-full text-sm shadow-md hover:scale-105 transition transform border border-amber-600">
                    Unlock Pro
                  </button>
                )}
                <button onClick={() => supabase.auth.signOut()} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:text-red-500 transition border border-slate-200 dark:border-slate-700 shadow-sm">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={() => { setAuthMode("login"); setShowAuthModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold shadow-md transition">
                Sign In
              </button>
            )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 mt-4">
          {/* EXAM MODE MENU */}
          <div className="flex justify-between items-center mb-8 bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-bold">Select Exam Mode:</h2>
              </div>
              <div className="relative">
                  <select value={selectedExam.id} onChange={handleExamChange} disabled={isActive} className="appearance-none bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold py-3 pl-5 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-inner disabled:opacity-50 text-slate-800 dark:text-slate-100">
                      {SITE_CONFIG.examModes.map(mode => (
                          <option key={mode.id} value={mode.id}>{mode.name} ({Math.floor(mode.duration / 60)} Mins)</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>
          </div>

          {/* LIVE METRICS */}
          <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center transform hover:scale-105 transition">
                  <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Time Left</span>
                  <span className={`text-4xl font-black font-mono ${timeLeft < 60 && isActive ? 'text-red-500 animate-pulse' : 'text-blue-600 dark:text-blue-400'}`}>
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </span>
              </div>
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center transform hover:scale-105 transition">
                  <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Net WPM</span>
                  <span className="text-4xl font-black font-mono">{liveStats.nwpm}</span>
              </div>
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center transform hover:scale-105 transition">
                  <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Accuracy</span>
                  <span className={`text-4xl font-black font-mono ${liveStats.acc < 90 ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{liveStats.acc}%</span>
              </div>
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center transform hover:scale-105 transition">
                  <span className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Gross WPM</span>
                  <span className="text-4xl font-black font-mono">{liveStats.gwpm}</span>
              </div>
          </div>

          {/* PASSAGE PILLS */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-4 custom-scrollbar">
            {PASSAGES.map((p, idx) => {
              const isLocked = idx > 0 && !profile.is_premium;
              return (
                  <button 
                  key={p.id} onClick={() => attemptPassageSelection(idx)}
                  className={`px-6 py-3 rounded-xl text-sm font-black whitespace-nowrap transition-all flex items-center gap-2 ${
                      passageIndex === idx 
                      ? "bg-blue-600 text-white scale-105 shadow-md border-blue-700" 
                      : isLocked ? "bg-slate-200 dark:bg-slate-900/50 text-slate-400 border border-slate-300 dark:border-slate-800"
                      : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700"
                  }`}
                  >
                  Passage {p.id} {isLocked ? <Lock className="w-4 h-4"/> : ""}
                  </button>
              );
            })}
          </div>

          {/* TYPING CONSOLE */}
          <div className="bg-white dark:bg-slate-800/80 p-8 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="flex flex-col">
                  <span className="text-xl font-black">{selectedExam.name} Evaluation</span>
                  <span className="text-sm font-bold text-slate-500">Official Format • Anti-Cheat Length Lock</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setInput(""); setTimeLeft(selectedExam.duration); setIsActive(false); setIsFinished(false); }} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl transition hover:shadow border border-slate-200 dark:border-slate-600">
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button onClick={startTest} disabled={isActive} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-xl flex items-center gap-2 shadow-lg hover:-translate-y-0.5 transition disabled:opacity-50">
                  <Play className="w-5 h-5 fill-current" /> {passageIndex === 0 && !profile.is_premium ? "Start Free Test" : isFinished ? "Retake Test" : "Start Mock Test"}
                </button>
              </div>
            </div>
            
            {/* Reference Text */}
            <div className="mb-8 p-6 bg-slate-50 dark:bg-[#070b14] rounded-2xl border border-slate-200 dark:border-slate-800 h-64 overflow-y-auto font-mono text-xl leading-[2.5] tracking-wide relative scroll-smooth shadow-inner">
              {renderPassage()}
            </div>
            
            {/* Input Area */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              disabled={isFinished || (!isActive && input.length === 0)}
              maxLength={currentPassage.length}
              className="w-full h-48 p-6 font-mono text-xl leading-relaxed rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-300 dark:border-slate-700 focus:border-blue-500 outline-none resize-none shadow-inner"
              placeholder={isActive ? "Type exactly as written above..." : "Click 'Start Test' to unlock keyboard..."}
            />
          </div>
        </main>

        {/* --- AUTH MODAL --- */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
              <button onClick={() => setShowAuthModal(false)} className="absolute right-4 top-4 text-slate-500 hover:text-slate-800 dark:hover:text-white">✕</button>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-6">
                <button onClick={() => { setAuthMode("login"); setAuthError(""); }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm ${authMode === "login" ? "bg-blue-600 text-white" : "text-slate-500"}`}>Log In</button>
                <button onClick={() => { setAuthMode("signup"); setAuthError(""); }} className={`flex-1 py-2.5 rounded-lg font-bold text-sm ${authMode === "signup" ? "bg-blue-600 text-white" : "text-slate-500"}`}>Create Account</button>
              </div>

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 mb-4">
                <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email Address" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-xl font-bold outline-none border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"/>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password (min. 6 char)" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-xl font-bold outline-none border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-500">{showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>
                </div>
                {authError && <div className={`text-sm font-bold p-3 rounded-lg ${authError.includes("Success") || authError.includes("created") ? "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30" : "text-red-500 bg-red-100 dark:bg-red-900/30"}`}>{authError}</div>}
                <button type="submit" disabled={authLoading} className="w-full py-4 rounded-xl bg-blue-600 text-white font-black text-lg disabled:opacity-50">{authLoading ? "Processing..." : authMode === "login" ? "Sign In" : "Register"}</button>
              </form>

              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs font-bold text-slate-500">OR</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <button onClick={handleGoogleLogin} className="w-full py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold flex justify-center items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.22a4.46 4.46 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.93-4.18 2.93-7.4z"/><path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.74 9.74 0 0 0 12 21.5z"/><path fill="#FBBC05" d="M6.54 13.59A5.86 5.86 0 0 1 6.23 12c0-.55.1-1.09.31-1.59V7.89H3.3A9.49 9.49 0 0 0 2.25 12c0 1.53.36 2.98 1.05 4.11l3.24-2.52z"/><path fill="#EA4335" d="M12 6.38c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.42 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.52c.77-2.31 2.92-4.03 5.46-4.03z"/></svg>
                Continue with Google
              </button>
            </div>
          </div>
        )}

        {/* --- LEADERBOARD MODAL --- */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
              <button onClick={() => setShowLeaderboard(false)} className="absolute right-4 top-4 text-slate-500 hover:text-slate-800 dark:hover:text-white">✕</button>
              <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-8 h-8 text-amber-500" />
                  <h3 className="text-2xl font-black">Global Top 10</h3>
              </div>
              {leaderboard.length === 0 ? <p className="text-slate-500 font-bold text-center py-4">Loading scores...</p> : 
              <div className="space-y-3">
                  {leaderboard.map((player, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                              <span className="font-black text-slate-400 w-4">{index + 1}</span>
                              <span className="font-bold">{player.full_name || "Aspirant"} {player.is_premium && <Lock className="w-3 h-3 inline text-amber-500"/>}</span>
                          </div>
                          <span className="font-black text-amber-500">{player.total_xp} XP</span>
                      </div>
                  ))}
              </div>}
            </div>
          </div>
        )}

        {/* --- PAYWALL MODAL --- */}
        {showPaywall && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-10 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
              <Lock className="w-14 h-14 text-amber-500 mx-auto mb-6" />
              <h3 className="text-3xl font-black mb-3">Premium Locked</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Unlock Passages 2-10 and secure your spot on the global leaderboard with full access.</p>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 mb-8 border border-slate-200 dark:border-slate-700">
                  <div className="text-5xl font-black text-blue-600 mb-2">₹{SITE_CONFIG.pricing.amountINR}</div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">One-Time Lifetime Access</div>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handlePayment} disabled={paymentLoading} className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-lg shadow-lg hover:-translate-y-0.5 transition disabled:opacity-50">
                  {paymentLoading ? "Connecting Securely..." : user ? "Pay via UPI / Card" : "Log In to Upgrade"}
                </button>
                <button onClick={() => setShowPaywall(false)} className="w-full py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}