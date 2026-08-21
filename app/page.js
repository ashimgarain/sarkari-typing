"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Script from "next/script";
import confetti from "canvas-confetti";
import { createClient } from "@supabase/supabase-js";

import {
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Clock3,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  Fingerprint,
  Fullscreen,
  Gauge,
  GraduationCap,
  Keyboard,
  Lock,
  LogOut,
  Maximize2,
  Moon,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  TimerReset,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";

import { PASSAGES } from "./data/passages";

/* =========================================================
   CONFIGURATION
========================================================= */

const SITE_CONFIG = {
  pricing: {
    amountINR: 50,
  },

  /*
    Two free test attempts.
  */
  freeTrialsAllowed: 2,

  /*
    First two passages are available during the
    free trial period.
  */
  freePassageCount: 2,

  features: {
    xpMultiplier: 10,
  },

  fossTypingSite: {
    name: "GuerillaType",
    url: "https://guerillatype.com/",
  },

  examModes: [
    {
      id: "practice",
      name: "1-Min Quick Practice",
      duration: 60,
    },
    {
      id: "ssc",
      name: "SSC CGL (DEST)",
      duration: 900,
    },
    {
      id: "bank",
      name: "Banking Mains",
      duration: 600,
    },
    {
      id: "railway",
      name: "Railway NTPC",
      duration: 600,
    },
    {
      id: "psc",
      name: "State PSC / Police",
      duration: 600,
    },
  ],
};

/* =========================================================
   SUPABASE
========================================================= */

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

/* =========================================================
   HELPERS
========================================================= */

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);

  const remainingSeconds =
    seconds % 60;

  return `${minutes}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function calculateStats(
  reference,
  typed,
  elapsedSeconds
) {
  const elapsedMinutes = Math.max(
    elapsedSeconds / 60,
    1 / 60
  );

  let correctChars = 0;

  for (
    let i = 0;
    i < typed.length;
    i++
  ) {
    if (typed[i] === reference[i]) {
      correctChars++;
    }
  }

  const typedChars = typed.length;

  const grossWpm = Math.round(
    (typedChars / 5) /
      elapsedMinutes
  );

  const netWpm = Math.max(
    0,
    Math.round(
      (correctChars / 5) /
        elapsedMinutes
    )
  );

  const accuracy =
    typedChars > 0
      ? Math.round(
          (correctChars /
            typedChars) *
            100
        )
      : 100;

  return {
    grossWpm,
    netWpm,
    accuracy,
    typedChars,
    correctChars,
  };
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SupremeTypingPortal() {
  /* -------------------------------------------------------
     THEME
  ------------------------------------------------------- */

  const [theme, setTheme] = useState(() => {
  if (typeof window === "undefined") {
    return "dark";
  }

  const savedTheme =
    localStorage.getItem("sarkari_theme");

  return savedTheme === "light" ||
    savedTheme === "dark"
    ? savedTheme
    : "dark";
});
  /* -------------------------------------------------------
     AUTH
  ------------------------------------------------------- */

  const [user, setUser] =
    useState(null);

  const [profile, setProfile] =
    useState({
      is_premium: false,
      total_xp: 0,
    });

  const [authMode, setAuthMode] =
    useState("login");

  const [authEmail, setAuthEmail] =
    useState("");

  const [authPassword, setAuthPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [authError, setAuthError] =
    useState("");

  const [authLoading, setAuthLoading] =
    useState(false);

  /* -------------------------------------------------------
     FREE TRIAL
  ------------------------------------------------------- */

  const [freeTestsUsed, setFreeTestsUsed] =
  useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    const saved =
      Number(
        localStorage.getItem(
          "sarkari_free_tests_used"
        ) || "0"
      );

    return Math.min(
      saved,
      SITE_CONFIG.freeTrialsAllowed
    );
  });

  /* -------------------------------------------------------
     EXAM
  ------------------------------------------------------- */

  const [selectedExam, setSelectedExam] =
    useState(
      SITE_CONFIG.examModes[0]
    );

  const [passageIndex, setPassageIndex] =
    useState(0);

  const [input, setInput] =
    useState("");

  const [timeLeft, setTimeLeft] =
    useState(
      SITE_CONFIG.examModes[0]
        .duration
    );

  const [isActive, setIsActive] =
    useState(false);

  const [isFinished, setIsFinished] =
    useState(false);

  /* -------------------------------------------------------
     EXAM SIMULATION
  ------------------------------------------------------- */

  const [strictExamMode, setStrictExamMode] =
    useState(false);

  const [countdown, setCountdown] =
    useState(0);

  /* -------------------------------------------------------
     MODALS
  ------------------------------------------------------- */

  const [showPaywall, setShowPaywall] =
    useState(false);

  const [showAuthModal, setShowAuthModal] =
    useState(false);

  const [showLeaderboard, setShowLeaderboard] =
    useState(false);

  const [showTutorial, setShowTutorial] =
    useState(false);

  /* -------------------------------------------------------
     LEADERBOARD
  ------------------------------------------------------- */

  const [leaderboard, setLeaderboard] =
    useState([]);

  /* -------------------------------------------------------
     PAYMENT
  ------------------------------------------------------- */

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  /* -------------------------------------------------------
     RESULT
  ------------------------------------------------------- */

  const [lastResult, setLastResult] =
    useState(null);

  /* -------------------------------------------------------
     REFS
  ------------------------------------------------------- */

  const inputRef = useRef(null);

  /* Container used for line-aware internal scrolling of the reference text. */
  const passageContainerRef = useRef(null);

  /* The exact character currently being typed. */
  const activeCharRef = useRef(null);

  const countdownTimerRef = useRef(null);

  /* -------------------------------------------------------
     CURRENT PASSAGE
  ------------------------------------------------------- */

  const currentPassage =
    PASSAGES[passageIndex];

    /* ========================================================
   PROFILE
======================================================== */

const refreshProfile = useCallback(async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!error && data) {
    setProfile(data);
  }
}, []);
  /* ========================================================
     INITIALIZATION
  ======================================================== */
useEffect(() => {
  const loadSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      setUser(session.user);

      await refreshProfile(
        session.user.id
      );
    }
  };

  loadSession();

  const {
    data: { subscription },
  } =
    supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(
          session?.user || null
        );

        if (session?.user) {
          await refreshProfile(
            session.user.id
          );
        } else {
          setProfile({
            is_premium: false,
            total_xp: 0,
          });
        }
      }
    );

  return () =>
    subscription.unsubscribe();
}, [refreshProfile]);
 
  /* ========================================================
     APPLY THEME TO <html>
  ======================================================== */

  useEffect(() => {
    localStorage.setItem(
      "sarkari_theme",
      theme
    );

    const root =
      document.documentElement;

    root.classList.toggle(
      "dark",
      theme === "dark"
    );

    root.style.colorScheme =
      theme === "dark"
        ? "dark"
        : "light";
  }, [theme]);

  /* ========================================================
     REFERENCE WINDOW SCROLLING
  ======================================================== */

  useEffect(() => {
    const container = passageContainerRef.current;
    if (!container) return;

    container.scrollTop = 0;
  }, [passageIndex]);

  useEffect(() => {
    const container = passageContainerRef.current;
    const activeChar = activeCharRef.current;

    if (!container || !activeChar || !isActive) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const charRect = activeChar.getBoundingClientRect();

    /*
      Keep the current character inside a comfortable middle band
      rather than continuously scrolling on every keystroke. This
      produces a much calmer typing experience on fast keyboards.
    */
    const safeTop =
      containerRect.top +
      container.clientHeight * 0.30;

    const safeBottom =
      containerRect.top +
      container.clientHeight * 0.70;

    if (charRect.top < safeTop) {
      const distance =
        charRect.top - safeTop;

      container.scrollBy({
        top: distance,
        behavior: "smooth",
      });
    } else if (charRect.bottom > safeBottom) {
      const distance =
        charRect.bottom - safeBottom;

      container.scrollBy({
        top: distance,
        behavior: "smooth",
      });
    }
  }, [input, isActive, passageIndex]);

  /* ========================================================
     PROFILE
  ======================================================== */


  /* ========================================================
     THEME
  ======================================================== */

  const toggleTheme = () => {
    setTheme(
      (current) =>
        current === "dark"
          ? "light"
          : "dark"
    );
  };

  /* ========================================================
     EXAM MODE
  ======================================================== */

  const handleExamChange = (
    event
  ) => {
    if (isActive) return;

    const mode =
      SITE_CONFIG.examModes.find(
        (item) =>
          item.id ===
          event.target.value
      );

    if (!mode) return;

    setSelectedExam(mode);

    setTimeLeft(
      mode.duration
    );

    setInput("");

    setIsFinished(false);

    setLastResult(null);
  };

  /* ========================================================
     PASSAGE ACCESS
  ======================================================== */

  const isPassageLocked =
    (index) =>
      !profile.is_premium &&
      index >=
        SITE_CONFIG.freePassageCount;

  const attemptPassageSelection =
    (index) => {
      if (isActive) return;

      if (
        isPassageLocked(index)
      ) {
        setShowPaywall(true);
        return;
      }

      if (
        !profile.is_premium &&
        freeTestsUsed >=
          SITE_CONFIG.freeTrialsAllowed
      ) {
        setShowPaywall(true);
        return;
      }

      setPassageIndex(index);

      setInput("");

      setTimeLeft(
        selectedExam.duration
      );

      setIsFinished(false);

      setLastResult(null);
    };

  /* ========================================================
     COUNTDOWN
  ======================================================== */

  const beginTypingSession =
    () => {
      setInput("");

      setTimeLeft(
        selectedExam.duration
      );

      setIsFinished(false);

      setLastResult(null);

      setIsActive(true);

      setCountdown(0);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    };

  const startTest = async () => {
    if (!profile.is_premium) {
      if (
        freeTestsUsed >=
        SITE_CONFIG.freeTrialsAllowed
      ) {
        setShowPaywall(true);
        return;
      }

      if (
        passageIndex >=
        SITE_CONFIG.freePassageCount
      ) {
        setShowPaywall(true);
        return;
      }
    }

    if (
      strictExamMode
    ) {
      if (
        document.fullscreenEnabled &&
        !document.fullscreenElement
      ) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {
          /*
            Fullscreen failure must not prevent
            the actual test from starting.
          */
        }
      }

      setCountdown(5);

      let current = 5;

      countdownTimerRef.current =
        setInterval(() => {
          current -= 1;

          setCountdown(
            current
          );

          if (
            current <= 0
          ) {
            clearInterval(
              countdownTimerRef.current
            );

            countdownTimerRef.current =
              null;

            beginTypingSession();
          }
        }, 1000);

      return;
    }

    beginTypingSession();
  };

  /* ========================================================
     RESET
  ======================================================== */

  const resetTest = () => {
    if (countdownTimerRef.current) {
      clearInterval(
        countdownTimerRef.current
      );

      countdownTimerRef.current =
        null;
    }

    setCountdown(0);

    setInput("");

    setTimeLeft(
      selectedExam.duration
    );

    setIsActive(false);

    setIsFinished(false);

    setLastResult(null);
  };

  /* ========================================================
     TIMER
  ======================================================== */

  /* ========================================================
     FINISH TEST
  ======================================================== */

const finishTest = useCallback(
  async () => {
    if (!isActive) {
      return;
    }

    setIsActive(false);
    setIsFinished(true);

    const elapsedSeconds =
      selectedExam.duration - timeLeft;

    const stats = calculateStats(
      currentPassage.text,
      input,
      Math.max(elapsedSeconds, 1)
    );

    setLastResult(stats);

    /*
      Free users consume one test.
      Premium users are unlimited.
    */
    if (!profile.is_premium) {
      const nextCount = Math.min(
        freeTestsUsed + 1,
        SITE_CONFIG.freeTrialsAllowed
      );

      setFreeTestsUsed(nextCount);

      localStorage.setItem(
        "sarkari_free_tests_used",
        String(nextCount)
      );
    }

    /*
      Accuracy celebration.
    */
    if (stats.accuracy > 90) {
      confetti({
        particleCount: 170,
        spread: 90,
        origin: {
          y: 0.65,
        },
      });
    }

    /*
      Preserve your existing database behaviour.
      We are NOT changing your payment system here.
    */
    if (user) {
      await supabase.from("test_results").insert({
        user_id: user.id,
        net_wpm: stats.netWpm,
        accuracy: stats.accuracy,
        xp_earned: 0,
      });

      setTimeout(() => {
        refreshProfile(user.id);
      }, 800);
    }

    /*
      Exit fullscreen after exam simulation.
    */
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore fullscreen exit failure.
      }
    }
  },
  [
    isActive,
    selectedExam.duration,
    currentPassage.text,
    timeLeft,
    input,
    profile.is_premium,
    freeTestsUsed,
    user,
    refreshProfile,
  ]
);

  /* ========================================================
     TYPING INPUT
  ======================================================== */

  const handleInput = (event) => {
    if (!isActive || isFinished) {
      return;
    }

    const value = event.target.value;

    if (value.length > currentPassage.text.length) {
      return;
    }

    setInput(value);
  };

  /* ========================================================
     LIVE STATS
  ======================================================== */

  const calculateLiveStats = () => {
    const elapsedSeconds =
      selectedExam.duration - timeLeft;

    return calculateStats(
      currentPassage.text,
      input,
      Math.max(elapsedSeconds, 1)
    );
  };

  const liveStats = calculateLiveStats();

  /* ========================================================
     PASSAGE RENDERING
  ======================================================== */

  const renderPassage = () => {
    return currentPassage.text
      .split("")
      .map((character, index) => {
        const hasBeenTyped =
          index < input.length;

        const isCurrent =
          index === input.length;

        let className =
          "text-slate-400 dark:text-slate-500";

        if (hasBeenTyped) {
          if (input[index] === character) {
            className =
              "text-emerald-600 dark:text-emerald-400 font-semibold";
          } else {
            className =
              "rounded-sm bg-red-100 text-red-600 underline decoration-red-500 decoration-2 dark:bg-red-500/20 dark:text-red-400";
          }
        }

        if (isCurrent && isActive) {
          className =
            "rounded-sm bg-blue-100 text-blue-700 underline decoration-2 decoration-blue-500 underline-offset-4 dark:bg-blue-500/20 dark:text-blue-300";
        }

        return (
          <span
            key={`char-${index}`}
            ref={
              isCurrent
                ? activeCharRef
                : null
            }
            className={`transition-colors duration-75 ${className}`}
          >
            {character}
          </span>
        );
      });
  };

  /* ========================================================
     AUTH
  ======================================================== */

  const handleAuthSubmit =
    async (event) => {
      event.preventDefault();

      setAuthError("");

      setAuthLoading(true);

      try {
        if (
          authMode ===
          "signup"
        ) {
          const {
            error,
          } =
            await supabase.auth.signUp(
              {
                email:
                  authEmail.trim(),
                password:
                  authPassword,
              }
            );

          if (error) {
            throw error;
          }

          setAuthError(
            "Account created successfully. Check your email if confirmation is enabled."
          );

          setTimeout(
            () =>
              setShowAuthModal(
                false
              ),
            1500
          );
        } else {
          const {
            error,
          } =
            await supabase.auth.signInWithPassword(
              {
                email:
                  authEmail.trim(),
                password:
                  authPassword,
              }
            );

          if (error) {
            throw error;
          }

          setShowAuthModal(
            false
          );
        }
      } catch (error) {
        setAuthError(
          error?.message ||
            "Authentication failed."
        );
      } finally {
        setAuthLoading(
          false
        );
      }
    };

  const handleGoogleLogin =
    async () => {
      setAuthLoading(true);

      const {
        error,
      } =
        await supabase.auth.signInWithOAuth(
          {
            provider: "google",
            options: {
              redirectTo:
                `${window.location.origin}/auth/callback`,
            },
          }
        );

      if (error) {
        setAuthError(
          error.message
        );

        setAuthLoading(
          false
        );
      }
    };

  const handleLogout =
    async () => {
      await supabase.auth.signOut();

      setUser(null);

      setProfile({
        is_premium: false,
        total_xp: 0,
      });
    };

  /* ========================================================
     PAYMENT
  ======================================================== */

  const handlePayment =
    async () => {
      if (!user) {
        setShowPaywall(
          false
        );

        setAuthMode(
          "login"
        );

        setShowAuthModal(
          true
        );

        return;
      }

      setPaymentLoading(
        true
      );

      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        if (!session) {
          throw new Error(
            "Please log in again."
          );
        }

        /*
          IMPORTANT:
          Keep this exactly compatible with
          your existing working API.
        */
        const res =
          await fetch(
            "/api/create-order",
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            }
          );

        const order =
          await res.json();

        if (!res.ok) {
          throw new Error(
            order.error ||
              "Order creation failed."
          );
        }

        const options = {
          key:
            process.env
              .NEXT_PUBLIC_RAZORPAY_KEY_ID,

          amount:
            order.amount,

          currency:
            "INR",

          name:
            "SarkariType Pro",

          description:
            "Lifetime Premium Access",

          order_id:
            order.id,

          handler:
            async (
              response
            ) => {
              const verifyRes =
                await fetch(
                  "/api/verify-payment",
                  {
                    method:
                      "POST",

                    headers: {
                      "Content-Type":
                        "application/json",

                      Authorization:
                        `Bearer ${session.access_token}`,
                    },

                    body:
                      JSON.stringify(
                        response
                      ),
                  }
                );

              const result =
                await verifyRes.json();

              if (
                result.success
              ) {
                setShowPaywall(
                  false
                );

                await refreshProfile(
                  user.id
                );

                alert(
                  "Payment Successful! Lifetime Premium access granted."
                );
              } else {
                alert(
                  "Payment verification failed. Please contact support."
                );
              }
            },

          prefill: {
            email:
              user?.email,
          },

          theme: {
            color:
              "#2563EB",
          },
        };

        new window.Razorpay(
          options
        ).open();
      } catch (error) {
        alert(
          error?.message ||
            "Payment could not be started."
        );
      } finally {
        setPaymentLoading(
          false
        );
      }
    };

  /* ========================================================
     LEADERBOARD
  ======================================================== */

  const fetchLeaderboard =
    async () => {
      setShowLeaderboard(
        true
      );

      const {
        data,
      } =
        await supabase
          .from("leaderboard")
          .select("*")
          .limit(10);

      setLeaderboard(
        data || []
      );
    };

  /* ========================================================
     TUTORIAL
  ======================================================== */

  const openTutorial =
    () => {
      if (
        !profile.is_premium
      ) {
        setShowPaywall(
          true
        );

        return;
      }

      setShowTutorial(
        true
      );
    };

  /* ========================================================
     FOSS RESOURCE
  ======================================================== */

  const openFossTutor =
    () => {
      if (
        !profile.is_premium
      ) {
        setShowPaywall(
          true
        );

        return;
      }

      window.open(
        SITE_CONFIG
          .fossTypingSite
          .url,
        "_blank",
        "noopener,noreferrer"
      );
    };

  /* ========================================================
     RENDER
  ======================================================== */

  const isDark =
    theme === "dark";

  const trialRemaining =
    Math.max(
      SITE_CONFIG.freeTrialsAllowed -
        freeTestsUsed,
      0
    );

  const progress =
    currentPassage.text
      .length > 0
      ? Math.min(
          100,
          (input.length /
            currentPassage.text.length) *
            100
        )
      : 0;

  return (
    <div
      className={
        isDark ? "dark" : ""
      }
    >
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors duration-200 dark:bg-[#0B1120] dark:text-slate-100">
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-[#0B1120]/90 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                <Keyboard className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight">
                  <span className="text-blue-600">
                    Sarkari
                  </span>
                  <span className="dark:text-white">
                    Type
                  </span>{" "}
                  <span className="text-amber-500">
                    Pro
                  </span>
                </h1>

                <p className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:block">
                  Government Exam Typing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setStrictExamMode(
                    !strictExamMode
                  )
                }
                disabled={isActive}
                title="Exam simulation mode"
                className={`hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition sm:flex ${
                  strictExamMode
                    ? "border-red-500 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <Fullscreen className="h-4 w-4" />
                {strictExamMode
                  ? "Exam Sim ON"
                  : "Exam Sim"}
              </button>

              <button
                onClick={
                  fetchLeaderboard
                }
                className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black dark:bg-slate-800"
              >
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="hidden sm:inline">
                  Leaderboard
                </span>
              </button>

              <button
                onClick={
                  toggleTheme
                }
                title={
                  isDark
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 transition hover:scale-105 dark:border-slate-700 dark:bg-slate-800"
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-amber-400" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-600" />
                )}
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden items-center gap-1 rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 sm:flex">
                    <Award className="h-4 w-4" />
                    {profile.total_xp ||
                      0}{" "}
                    XP
                  </div>

                  {!profile.is_premium && (
                    <button
                      onClick={() =>
                        setShowPaywall(
                          true
                        )
                      }
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-black text-white shadow-md"
                    >
                      ₹50 Pro
                    </button>
                  )}

                  <button
                    onClick={
                      handleLogout
                    }
                    title="Logout"
                    className="rounded-xl bg-slate-100 p-2.5 transition hover:text-red-500 dark:bg-slate-800"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode(
                      "login"
                    );
                    setShowAuthModal(
                      true
                    );
                  }}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* =====================================================
            MAIN
        ===================================================== */}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {/* HERO */}

          <section className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-white shadow-2xl sm:p-8">
            <div className="max-w-4xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest">
                <Sparkles className="h-4 w-4" />
                SarkariType Pro v2
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
                Train like the real exam.
              </h2>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-blue-50 sm:text-base">
                20 progressively harder typing passages,
                strict exam simulation, professional
                statistics and competitive XP.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
                <span className="rounded-xl bg-white/10 px-3 py-2">
                  5 Easy
                </span>

                <span className="rounded-xl bg-white/10 px-3 py-2">
                  10 Moderate
                </span>

                <span className="rounded-xl bg-white/10 px-3 py-2">
                  5 Hard
                </span>

                <span className="rounded-xl bg-white/10 px-3 py-2">
                  2 Free Tests
                </span>
              </div>
            </div>
          </section>

          {/* TOOLBAR */}

          <section className="mb-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 md:col-span-2">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                <Activity className="h-4 w-4 text-blue-500" />
                Exam Mode
              </div>

              <div className="relative">
                <select
                  value={
                    selectedExam.id
                  }
                  onChange={
                    handleExamChange
                  }
                  disabled={
                    isActive
                  }
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-10 text-sm font-black outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  {SITE_CONFIG.examModes.map(
                    (
                      mode
                    ) => (
                      <option
                        key={
                          mode.id
                        }
                        value={
                          mode.id
                        }
                      >
                        {
                          mode.name
                        }{" "}
                        (
                        {Math.floor(
                          mode.duration /
                            60
                        )}{" "}
                        min)
                      </option>
                    )
                  )}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <button
              onClick={
                openTutorial
              }
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="rounded-xl bg-blue-500/10 p-3">
                <Fingerprint className="h-5 w-5 text-blue-500" />
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-black">
                  Finger Placement
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                </div>

                <div className="text-xs font-semibold text-slate-500">
                  Touch-typing tutorial
                </div>
              </div>
            </button>

            <button
              onClick={
                openFossTutor
              }
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-500 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <BookOpen className="h-5 w-5 text-emerald-500" />
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-black">
                  FOSS Typing Tutor
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                </div>

                <div className="text-xs font-semibold text-slate-500">
                  No-login external practice
                </div>
              </div>
            </button>
          </section>

          {/* EXAM SIM MOBILE BUTTON */}

          <div className="mb-5 sm:hidden">
            <button
              onClick={() =>
                setStrictExamMode(
                  !strictExamMode
                )
              }
              disabled={isActive}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black ${
                strictExamMode
                  ? "border-red-500 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <Fullscreen className="h-4 w-4" />

              {strictExamMode
                ? "Strict Exam Simulation: ON"
                : "Enable Strict Exam Simulation"}
            </button>
          </div>

          {/* FREE TRIAL STATUS */}

          <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                Free Practice
              </div>

              <div className="mt-1 text-sm font-black">
                {profile.is_premium
                  ? "Lifetime Premium Active"
                  : `${freeTestsUsed}/${SITE_CONFIG.freeTrialsAllowed} free tests used`}
              </div>
            </div>

            {!profile.is_premium && (
              <button
                onClick={() =>
                  setShowPaywall(
                    true
                  )
                }
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-black text-white"
              >
                Unlock Unlimited Tests — ₹50
              </button>
            )}
          </section>

          {/* METRICS */}

          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              icon={Clock3}
              label="Time Left"
              value={formatTime(
                timeLeft
              )}
              danger={
                isActive &&
                timeLeft <
                  60
              }
            />

            <MetricCard
              icon={Gauge}
              label="Net WPM"
              value={
                strictExamMode &&
                isActive
                  ? "—"
                  : liveStats.nwpm
              }
            />

            <MetricCard
              icon={Zap}
              label="Accuracy"
              value={
                strictExamMode &&
                isActive
                  ? "—"
                  : `${liveStats.acc}%`
              }
              success={
                liveStats.acc >=
                90
              }
            />

            <MetricCard
              icon={Keyboard}
              label="Gross WPM"
              value={
                strictExamMode &&
                isActive
                  ? "—"
                  : liveStats.gwpm
              }
            />
          </section>

          {/* PASSAGES */}

          <section className="mb-5">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h3 className="text-lg font-black">
                  Passage Library
                </h3>

                <p className="text-xs font-semibold text-slate-500">
                  Easy → Moderate → Hard
                </p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-3">
              {PASSAGES.map(
                (
                  passage,
                  index
                ) => {
                  const locked =
                    isPassageLocked(
                      index
                    );

                  return (
                    <button
                      key={
                        passage.id
                      }
                      onClick={() =>
                        attemptPassageSelection(
                          index
                        )
                      }
                      className={`min-w-[150px] rounded-xl border px-3 py-3 text-left transition ${
                        passageIndex ===
                        index
                          ? "border-blue-600 bg-blue-600 text-white shadow-lg"
                          : locked
                          ? "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900"
                          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">
                          P{passage.id}
                        </span>

                        {locked ? (
                          <Lock className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                      </div>

                      <div className="mt-2 text-[11px] font-black">
                        {passage.difficulty}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* TYPING CONSOLE */}

          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900/80">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl font-black">
                      {
                        selectedExam.name
                      }
                    </span>

                    {strictExamMode && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        Strict Exam
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {
                      currentPassage.title
                    }
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <span>
                      {
                        currentPassage.category
                      }
                    </span>

                    <span>•</span>

                    <span>
                      Difficulty:{" "}
                      {
                        currentPassage.difficulty
                      }
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={
                      resetTest
                    }
                    disabled={
                      isActive
                    }
                    title="Reset test"
                    className="rounded-xl border border-slate-200 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>

                  <button
                    onClick={
                      startTest
                    }
                    disabled={
                      isActive ||
                      countdown >
                        0
                    }
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50"
                  >
                    <Play className="h-4 w-4 fill-current" />

                    {countdown >
                    0
                      ? `Get Ready ${countdown}`
                      : isFinished
                      ? "Retake Test"
                      : "Start Test"}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-1 bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            {/* REFERENCE + TYPING AREA */}

            <div className="p-5 sm:p-8">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:text-xs">
                  <Keyboard className="h-4 w-4 text-blue-500" />
                  Reference Passage
                </div>

                <div className="text-[10px] font-black text-slate-400 sm:text-xs">
                  {input.length} / {currentPassage.text.length} chars
                </div>
              </div>

              <div
                ref={passageContainerRef}
                className="relative mb-5 h-[210px] overflow-y-auto overflow-x-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-7 font-mono text-[17px] leading-[2] tracking-wide shadow-inner scroll-smooth dark:border-slate-800 dark:bg-[#070b14] sm:h-[230px] sm:px-7 sm:text-[18px]"
              >
                <div className="mx-auto max-w-5xl">
                  {renderPassage()}
                </div>

                <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-50 to-transparent dark:from-[#070b14]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 to-transparent dark:from-[#070b14]" />
              </div>

              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:text-xs">
                  <Zap className="h-4 w-4 text-emerald-500" />
                  Typing Area
                </div>

                <div className="text-[10px] font-bold text-slate-400 sm:text-xs">
                  Accuracy-first training
                </div>
              </div>

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                maxLength={currentPassage.text.length}
                disabled={!isActive || isFinished}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                autoComplete="off"
                className="h-48 w-full resize-none rounded-2xl border-2 border-slate-200 bg-white p-6 font-mono text-lg leading-8 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-[#070b14] dark:text-white dark:placeholder:text-slate-600"
                placeholder={
                  isActive
                    ? "Type exactly as shown above..."
                    : countdown > 0
                    ? "Prepare yourself..."
                    : isFinished
                    ? "Test finished. Click Retake Test to try again."
                    : "Click Start Test to begin..."
                }
              />

              {/* RESULT */}

              {isFinished &&
                lastResult && (
                  <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <ResultBox
                      label="Net WPM"
                      value={
                        lastResult.netWpm
                      }
                    />

                    <ResultBox
                      label="Accuracy"
                      value={`${lastResult.accuracy}%`}
                    />

                    <ResultBox
                      label="Gross WPM"
                      value={
                        lastResult.grossWpm
                      }
                    />

                    <ResultBox
                      label="Characters"
                      value={
                        lastResult.typedChars
                      }
                    />
                  </div>
                )}

              {/* TRAINING ADVICE */}

              <div className="mt-5 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4 text-xs font-semibold leading-6 text-slate-500">
                <strong className="text-blue-600 dark:text-blue-400">
                  Training rule:
                </strong>{" "}
                Aim for 95%+ accuracy first, then gradually
                increase speed. The final five passages are
                deliberately designed to challenge punctuation,
                numerals, capitalisation and formatting.
              </div>
            </div>
          </section>
        </main>

        {/* =====================================================
            AUTH MODAL
        ===================================================== */}

        {showAuthModal && (
          <Modal
            onClose={() =>
              setShowAuthModal(
                false
              )
            }
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
                <User className="h-7 w-7 text-white" />
              </div>

              <h2 className="text-2xl font-black">
                {authMode ===
                "login"
                  ? "Welcome Back"
                  : "Create Account"}
              </h2>
            </div>

            <div className="mb-5 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
              <button
                onClick={() => {
                  setAuthMode(
                    "login"
                  );
                  setAuthError("");
                }}
                className={`flex-1 rounded-lg py-2.5 text-sm font-black ${
                  authMode ===
                  "login"
                    ? "bg-blue-600 text-white"
                    : "text-slate-500"
                }`}
              >
                Log In
              </button>

              <button
                onClick={() => {
                  setAuthMode(
                    "signup"
                  );
                  setAuthError("");
                }}
                className={`flex-1 rounded-lg py-2.5 text-sm font-black ${
                  authMode ===
                  "signup"
                    ? "bg-blue-600 text-white"
                    : "text-slate-500"
                }`}
              >
                Create Account
              </button>
            </div>

            <form
              onSubmit={
                handleAuthSubmit
              }
              className="space-y-3"
            >
              <input
                type="email"
                required
                value={
                  authEmail
                }
                onChange={(e) =>
                  setAuthEmail(
                    e.target.value
                  )
                }
                placeholder="Email Address"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
              />

              <div className="relative">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  minLength={
                    6
                  }
                  required
                  value={
                    authPassword
                  }
                  onChange={(e) =>
                    setAuthPassword(
                      e.target.value
                    )
                  }
                  placeholder="Password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 font-bold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff />
                  ) : (
                    <Eye />
                  )}
                </button>
              </div>

              {authError && (
                <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {authError}
                </div>
              )}

              <button
                disabled={
                  authLoading
                }
                className="w-full rounded-xl bg-blue-600 py-4 font-black text-white disabled:opacity-50"
              >
                {authLoading
                  ? "Processing..."
                  : authMode ===
                    "login"
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-xs font-black text-slate-500">
                OR
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <button
              onClick={
                handleGoogleLogin
              }
              className="w-full rounded-xl border border-slate-300 py-3.5 font-black dark:border-slate-700"
            >
              Continue with Google
            </button>
          </Modal>
        )}

        {/* =====================================================
            PAYWALL
        ===================================================== */}

        {showPaywall && (
          <Modal
            onClose={() =>
              setShowPaywall(
                false
              )
            }
          >
            <div className="text-center">
              <Crown className="mx-auto mb-5 h-14 w-14 text-amber-500" />

              <h2 className="text-3xl font-black">
                Unlock Pro
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                Get unlimited typing tests, all 20
                passages, the finger-placement tutorial
                and the curated FOSS learning resource.
              </p>

              <div className="my-6 rounded-2xl bg-slate-50 p-6 dark:bg-slate-950">
                <div className="text-5xl font-black text-amber-500">
                  ₹50
                </div>

                <div className="mt-1 text-xs font-black uppercase tracking-widest text-slate-500">
                  Lifetime Access
                </div>
              </div>

              <div className="mb-6 space-y-2 text-left text-sm font-bold">
                {[
                  "All 20 passages",
                  "Unlimited mock tests",
                  "Strict exam simulation",
                  "Finger placement tutorial",
                  "FOSS typing tutor link",
                  "XP + leaderboard",
                ].map(
                  (feature) => (
                    <div
                      key={
                        feature
                      }
                      className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950"
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />

                      {
                        feature
                      }
                    </div>
                  )
                )}
              </div>

              <button
                onClick={
                  handlePayment
                }
                disabled={
                  paymentLoading
                }
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-4 font-black text-white shadow-lg disabled:opacity-50"
              >
                {paymentLoading
                  ? "Connecting..."
                  : user
                  ? "Pay ₹50 — Unlock Lifetime"
                  : "Sign In to Upgrade"}
              </button>
            </div>
          </Modal>
        )}

        {/* =====================================================
            FINGER TUTORIAL
        ===================================================== */}

        {showTutorial && (
          <Modal
            wide
            onClose={() =>
              setShowTutorial(
                false
              )
            }
          >
            <div className="mb-5 flex items-center gap-3">
              <Fingerprint className="h-7 w-7 text-blue-500" />

              <div>
                <h2 className="text-2xl font-black">
                  Correct Finger Placement
                </h2>

                <p className="text-sm font-semibold text-slate-500">
                  Standard QWERTY touch-typing position
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-5">
              <KeyboardRow
                keys={[
                  ["Q", "LP"],
                  ["W", "LR"],
                  ["E", "LM"],
                  ["R", "LI"],
                  ["T", "LI"],
                  ["Y", "RI"],
                  ["U", "RI"],
                  ["I", "RM"],
                  ["O", "RR"],
                  ["P", "RP"],
                ]}
              />

              <KeyboardRow
                keys={[
                  ["A", "LP"],
                  ["S", "LR"],
                  ["D", "LM"],
                  ["F", "LI"],
                  ["G", "LI"],
                  ["H", "RI"],
                  ["J", "RI"],
                  ["K", "RM"],
                  ["L", "RR"],
                  [";", "RP"],
                ]}
              />

              <KeyboardRow
                keys={[
                  ["Z", "LP"],
                  ["X", "LR"],
                  ["C", "LM"],
                  ["V", "LI"],
                  ["B", "LI"],
                  ["N", "RI"],
                  ["M", "RI"],
                  [",", "RM"],
                  [".", "RR"],
                  ["/", "RP"],
                ]}
              />
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-950">
              <h3 className="mb-3 font-black">
                Home Row
              </h3>

              <p className="text-sm font-semibold leading-6 text-slate-500">
                Place the left fingers on{" "}
                <strong>
                  A S D F
                </strong>{" "}
                and the right fingers on{" "}
                <strong>
                  J K L ;
                </strong>
                . The index fingers should rest on F and
                J. These keys normally have small raised
                markers that help you locate the home
                position without looking.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-5 text-sm font-semibold leading-6 text-slate-500">
              <strong className="text-blue-600">
                Practice principle:
              </strong>{" "}
              Keep your eyes on the screen, use the assigned
              finger consistently, and avoid looking down at
              the keyboard.
            </div>
          </Modal>
        )}

        {/* =====================================================
            LEADERBOARD
        ===================================================== */}

        {showLeaderboard && (
          <Modal
            onClose={() =>
              setShowLeaderboard(
                false
              )
            }
          >
            <div className="mb-6 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-amber-500" />

              <div>
                <h2 className="text-2xl font-black">
                  Global Top 10
                </h2>

                <p className="text-sm font-semibold text-slate-500">
                  Highest XP performers
                </p>
              </div>
            </div>

            {leaderboard.length ===
            0 ? (
              <p className="py-8 text-center text-sm font-bold text-slate-500">
                No scores available yet.
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map(
                  (
                    player,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 font-black text-slate-400">
                          {index +
                            1}
                        </span>

                        <span className="font-black">
                          {player.full_name ||
                            "Aspirant"}
                        </span>
                      </div>

                      <span className="font-black text-amber-500">
                        {player.total_xp ||
                          0}{" "}
                        XP
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function MetricCard({
  icon: Icon,
  label,
  value,
  danger,
  success,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {label}
        </span>

        <Icon className="h-4 w-4 text-blue-500" />
      </div>

      <div
        className={`mt-2 font-mono text-3xl font-black ${
          danger
            ? "text-red-500"
            : success
            ? "text-emerald-500"
            : "text-blue-500"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ResultBox({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </div>

      <div className="mt-1 text-2xl font-black">
        {value}
      </div>
    </div>
  );
}

function Modal({
  children,
  onClose,
  wide = false,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 ${
          wide
            ? "max-w-3xl"
            : "max-w-lg"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {children}
      </div>
    </div>
  );
}

function KeyboardRow({
  keys,
}) {
  return (
    <div className="grid grid-cols-10 gap-1.5">
      {keys.map(
        ([key, finger]) => (
          <div
            key={`${key}-${finger}`}
            className={`rounded-lg p-2 text-center text-xs font-black ${
              finger.startsWith(
                "L"
              )
                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            }`}
          >
            <div className="text-sm">
              {key}
            </div>

            <div className="mt-1 text-[8px] opacity-70">
              {finger}
            </div>
          </div>
        )
      )}
    </div>
  );
}