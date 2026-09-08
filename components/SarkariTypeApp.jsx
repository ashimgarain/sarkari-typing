"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Script from "next/script";
import confetti from "canvas-confetti";
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Fingerprint,
  Flame,
  Fullscreen,
  Gauge,
  Gift,
  GraduationCap,
  Keyboard,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  Moon,
  Newspaper,
  Palette,
  Play,
  RotateCcw,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import { PASSAGES, getDailyChallenge } from "../lib/passages.mjs";
import { calculateStats, getTodayIstDateString } from "../lib/scoring.mjs";
import { DEFAULT_PROFILE, SITE_CONFIG, getLevelInfo } from "../lib/site-config.mjs";
import Modal from "./Modal";
import FingerGuide from "./FingerGuide";
import ProfileDrawer from "./ProfileDrawer";
import ThemeStudio from "./ThemeStudio";

function MetricCard({ icon: Icon, label, value, accent = "text-violet-500" }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
        <Icon className={`h-4 w-4 ${accent}`} /> {label}
      </div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function formatTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function humanKey(key) {
  if (key === "SPACE") return "Space";
  if (key === "\n") return "Enter";
  return key;
}

export default function SarkariTypeApp() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("sarkari_theme") === "light" ? "light" : "dark";
  });
  const [palette, setPalette] = useState(() => {
    if (typeof window === "undefined") return SITE_CONFIG.appearance.defaultPalette;
    return localStorage.getItem("sarkari_palette") || SITE_CONFIG.appearance.defaultPalette;
  });
  const [layoutMode, setLayoutMode] = useState(() => {
    if (typeof window === "undefined") return SITE_CONFIG.appearance.defaultLayout;
    return localStorage.getItem("sarkari_layout") || SITE_CONFIG.appearance.defaultLayout;
  });
  const [showThemeStudio, setShowThemeStudio] = useState(false);
  const [themeTrialEndsAt, setThemeTrialEndsAt] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("sarkari_theme_trial_end") || "0") || 0;
  });
  const [themeTrialTick, setThemeTrialTick] = useState(() => Date.now());
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profile = profileData?.profile || DEFAULT_PROFILE;

  const [passages, setPassages] = useState(PASSAGES);
  const [selectedPassageId, setSelectedPassageId] = useState(PASSAGES[0]?.id || "P001");
  const [selectedExamId, setSelectedExamId] = useState("practice");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [examFilter, setExamFilter] = useState("All");
  const [skillFilter, setSkillFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dailyChallengeMode, setDailyChallengeMode] = useState(false);

  const selectedExam = SITE_CONFIG.examModes.find((item) => item.id === selectedExamId) || SITE_CONFIG.examModes[0];
  const currentPassage = passages.find((item) => String(item.id) === String(selectedPassageId)) || passages[0] || PASSAGES[0];
  const today = getTodayIstDateString();
  const dailyStatic = useMemo(() => getDailyChallenge(PASSAGES, today), [today]);
  const dailyChallenge = useMemo(
    () => passages.find((item) => String(item.id) === String(dailyStatic?.id)) || dailyStatic,
    [dailyStatic, passages]
  );

  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(selectedExam.duration);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [strictExamMode, setStrictExamMode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [saveNotice, setSaveNotice] = useState("");
  const [completionToast, setCompletionToast] = useState("");
  const [showResultSummary, setShowResultSummary] = useState(false);

  const [freeTestsUsed, setFreeTestsUsed] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Math.min(
      SITE_CONFIG.freeTrialsAllowed,
      Number(localStorage.getItem("sarkari_free_tests_used") || "0") || 0
    );
  });

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [showPaywall, setShowPaywall] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [referralInput, setReferralInput] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [pendingReferral, setPendingReferral] = useState(() => {
    if (typeof window === "undefined") return "";
    const fromUrl = new URLSearchParams(window.location.search).get("ref") || "";
    const existing = localStorage.getItem("sarkari_pending_ref") || "";
    const code = String(fromUrl || existing).trim().toUpperCase();
    if (code) localStorage.setItem("sarkari_pending_ref", code);
    return code;
  });

  const inputRef = useRef(null);
  const passageContainerRef = useRef(null);
  const activeCharRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const mainTimerRef = useRef(null);
  const finishTestRef = useRef(null);
  const finishingRef = useRef(false);
  const startedAtRef = useRef(0);
  const deadlineRef = useRef(0);

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, [supabase]);

  const track = useCallback(async (eventName, metadata = {}) => {
    try {
      const token = await getToken();
      await fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ eventName, metadata }),
      });
    } catch {
      // Analytics must never break the typing experience.
    }
  }, [getToken]);

  const reportError = useCallback(async (context, error, details = {}) => {
    try {
      const token = await getToken();
      await fetch("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          context,
          message: error?.message || String(error || "Unknown error"),
          details,
        }),
      });
    } catch {
      // Error logging must never create another user-facing error.
    }
  }, [getToken]);

  const loadProfile = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setProfileData(null);
      return null;
    }

    setProfileLoading(true);
    try {
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Profile could not be loaded.");
      setProfileData(result);
      const serverFreeUsed = Math.min(
        SITE_CONFIG.freeTrialsAllowed,
        Number(result?.profile?.free_tests_used || 0) || 0
      );
      setFreeTestsUsed(serverFreeUsed);
      localStorage.setItem("sarkari_free_tests_used", String(serverFreeUsed));
      return result;
    } catch (error) {
      console.error("PROFILE LOAD ERROR:", error);
      void reportError("profile_load", error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [getToken, reportError]);

  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem("sarkari_theme", theme);
    localStorage.setItem("sarkari_palette", palette);
    localStorage.setItem("sarkari_layout", layoutMode);
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    root.dataset.palette = palette;
    root.dataset.layout = layoutMode;
  }, [layoutMode, palette, theme]);

  const themeTrialActive =
    !profile.is_premium && themeTrialEndsAt > themeTrialTick;
  const themeTrialRemainingSeconds = Math.max(
    0,
    Math.ceil((themeTrialEndsAt - themeTrialTick) / 1000)
  );

  useEffect(() => {
    if (!authReady || !themeTrialEndsAt || profile.is_premium) return undefined;
    const trialTimer = window.setInterval(() => {
      const now = Date.now();
      setThemeTrialTick(now);
      if (now >= themeTrialEndsAt) {
        const selectedPalette = SITE_CONFIG.appearance.palettes.find((item) => item.id === palette);
        const selectedLayout = SITE_CONFIG.appearance.layouts.find((item) => item.id === layoutMode);
        if (selectedPalette?.premium) setPalette(SITE_CONFIG.appearance.defaultPalette);
        if (selectedLayout?.premium) setLayoutMode(SITE_CONFIG.appearance.defaultLayout);
        window.clearInterval(trialTimer);
      }
    }, 1000);
    return () => window.clearInterval(trialTimer);
  }, [authReady, layoutMode, palette, profile.is_premium, themeTrialEndsAt]);

  const requestPremiumAppearance = useCallback((kind, id) => {
    const collection = kind === "palette"
      ? SITE_CONFIG.appearance.palettes
      : SITE_CONFIG.appearance.layouts;
    const item = collection.find((entry) => entry.id === id);
    if (!item) return;

    const apply = () => {
      if (kind === "palette") setPalette(id);
      else setLayoutMode(id);
    };

    if (!item.premium || profile.is_premium || themeTrialEndsAt > Date.now()) {
      apply();
      return;
    }

    const used = localStorage.getItem("sarkari_theme_trial_used") === "1";
    if (!used) {
      const end = Date.now() + SITE_CONFIG.appearance.premiumPreviewMinutes * 60 * 1000;
      localStorage.setItem("sarkari_theme_trial_used", "1");
      localStorage.setItem("sarkari_theme_trial_end", String(end));
      setThemeTrialEndsAt(end);
      setThemeTrialTick(Date.now());
      apply();
      setProfileNotice(`Premium appearance preview started for ${SITE_CONFIG.appearance.premiumPreviewMinutes} minutes.`);
      return;
    }

    setShowThemeStudio(false);
    setShowPaywall(true);
    setProfileNotice("Premium themes and Minimal Focus are included with Pro.");
  }, [profile.is_premium, themeTrialEndsAt]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(session?.user || null);
      if (session?.user) await loadProfile();
      if (mounted) setAuthReady(true);
    };
    void bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setUser(session?.user || null);
      if (session?.user) {
        await loadProfile();
        if (event === "SIGNED_IN") void track("login");
      } else {
        setProfileData(null);
      }
      if (mounted) setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase, track]);

  useEffect(() => {
    const requestedExam = new URLSearchParams(window.location.search).get("exam");
    if (!requestedExam || !SITE_CONFIG.examModes.some((item) => item.id === requestedExam)) return undefined;
    const timer = window.setTimeout(() => {
      setSelectedExamId(requestedExam);
      const mode = SITE_CONFIG.examModes.find((item) => item.id === requestedExam);
      if (mode) setTimeLeft(mode.duration);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const loadPassages = async () => {
      try {
        const response = await fetch("/api/passages", { cache: "no-store" });
        const result = await response.json();
        if (active && result?.success && Array.isArray(result.passages) && result.passages.length >= 2) {
          setPassages(result.passages);
        }
      } catch (error) {
        console.warn("Using static passage fallback:", error);
      }
    };
    void loadPassages();
    return () => { active = false; };
  }, []);

  const attachReferralCode = useCallback(async (code) => {
    const cleanCode = String(code || "").trim().toUpperCase();
    if (!cleanCode) return false;
    const token = await getToken();
    if (!token) {
      localStorage.setItem("sarkari_pending_ref", cleanCode);
      setPendingReferral(cleanCode);
      return false;
    }

    try {
      const response = await fetch("/api/referral/attach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: cleanCode }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Referral could not be applied.");

      localStorage.removeItem("sarkari_pending_ref");
      setPendingReferral("");
      setProfileNotice(result.attached ? "Referral attached. Your 20% Pro discount is ready." : "Referral was not applied to this account.");
      await loadProfile();
      void track("referral_attached", { attached: result.attached === true });
      return result.attached === true;
    } catch (error) {
      setProfileNotice(error.message);
      void reportError("referral_attach", error);
      return false;
    }
  }, [getToken, loadProfile, reportError, track]);

  useEffect(() => {
    if (!user || !pendingReferral || profile.is_premium || profile.referred_by) return;
    const timer = window.setTimeout(() => {
      void attachReferralCode(pendingReferral);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [attachReferralCode, pendingReferral, profile.is_premium, profile.referred_by, user]);

  const filteredPassages = useMemo(() => passages.filter((passage) => {
    const difficultyOk = difficultyFilter === "All" || passage.difficulty === difficultyFilter;
    const examOk = examFilter === "All" || (passage.examTags || []).includes(examFilter);
    const skillOk = skillFilter === "All" || (passage.skillTags || []).includes(skillFilter);
    const categoryOk = categoryFilter === "All" || passage.category === categoryFilter;
    return difficultyOk && examOk && skillOk && categoryOk;
  }), [categoryFilter, difficultyFilter, examFilter, passages, skillFilter]);

  const isPassageLocked = useCallback((passage) => {
    if (!passage || profile.is_premium) return false;
    return passage.isPremium !== false;
  }, [profile.is_premium]);

  const resetTest = useCallback(async () => {
    if (mainTimerRef.current) {
      window.clearInterval(mainTimerRef.current);
      mainTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    finishingRef.current = false;
    startedAtRef.current = 0;
    deadlineRef.current = 0;
    setCountdown(0);
    setIsActive(false);
    setIsFinished(false);
    setInput("");
    setTimeLeft(selectedExam.duration);
    setLastResult(null);
    setSaveNotice("");
    setCompletionToast("");
    setShowResultSummary(false);
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* no-op */ }
    }
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [selectedExam.duration]);

  const finishTest = useCallback(async ({ finalInput, finalTimeLeft, reason = "manual" } = {}) => {
    if (finishingRef.current) return;
    if (mainTimerRef.current) {
      window.clearInterval(mainTimerRef.current);
      mainTimerRef.current = null;
    }
    finishingRef.current = true;

    const typed = typeof finalInput === "string" ? finalInput : input;
    const remaining = Number.isFinite(Number(finalTimeLeft)) ? Number(finalTimeLeft) : timeLeft;
    const elapsedByDeadline = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : selectedExam.duration - remaining;
    const elapsedSeconds = Math.max(1, Math.min(selectedExam.duration, elapsedByDeadline));
    const localStats = calculateStats(currentPassage.text, typed, elapsedSeconds);

    setIsActive(false);
    setIsFinished(true);
    setLastResult({ ...localStats, xpEarned: 0, dailyBonusXp: 0, mistakeMap: localStats.mistakeMap });
    setShowResultSummary(true);
    setCompletionToast(reason === "time" ? "⏱️ Time is up — your result is ready!" : reason === "complete" ? "✨ Passage complete — great work!" : "✅ Test finished — result ready.");

    if (!profile.is_premium) {
      const nextCount = Math.min(SITE_CONFIG.freeTrialsAllowed, freeTestsUsed + 1);
      setFreeTestsUsed(nextCount);
      localStorage.setItem("sarkari_free_tests_used", String(nextCount));
    }

    if (localStats.accuracy >= 95 && localStats.typedChars >= 20) {
      confetti({ particleCount: 130, spread: 80, origin: { y: 0.68 } });
    }

    if (user) {
      try {
        const token = await getToken();
        if (!token) throw new Error("Your session expired before the result could be saved.");

        const response = await fetch("/api/submit-result", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            passageId: currentPassage.id,
            typedText: typed,
            examMode: selectedExam.id,
            durationSeconds: elapsedSeconds,
            dailyChallenge: dailyChallengeMode,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "Result could not be saved.");

        setLastResult({
          ...result.stats,
          xpEarned: result.xpEarned || 0,
          dailyBonusXp: result.dailyBonusXp || 0,
          mistakeMap: result.stats?.mistakeMap || {},
        });
        await loadProfile();
        setSaveNotice("Saved to your profile.");
        void track("test_completed", {
          netWpm: result.stats?.netWpm || 0,
          accuracy: result.stats?.accuracy || 0,
          difficulty: currentPassage.difficulty,
          dailyChallenge: dailyChallengeMode,
        });
      } catch (error) {
        console.error("RESULT SAVE ERROR:", error);
        setSaveNotice(`Result shown locally, but saving failed: ${error.message}`);
        void reportError("result_save", error, { passageId: currentPassage.id });
      }
    } else {
      setSaveNotice("Sign in to save progress, XP, streaks and achievements.");
    }

    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* no-op */ }
    }

    finishingRef.current = false;
  }, [currentPassage, dailyChallengeMode, freeTestsUsed, getToken, input, loadProfile, profile.is_premium, reportError, selectedExam, timeLeft, track, user]);

  useEffect(() => {
    finishTestRef.current = finishTest;
  }, [finishTest]);

  useEffect(() => {
    if (!isActive) return undefined;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000)
      );
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (mainTimerRef.current) {
          window.clearInterval(mainTimerRef.current);
          mainTimerRef.current = null;
        }
        window.setTimeout(() => {
          void finishTestRef.current?.({
            finalInput: inputRef.current?.value || "",
            finalTimeLeft: 0,
            reason: "time",
          });
        }, 0);
      }
    };

    const timerId = window.setInterval(tick, 250);
    mainTimerRef.current = timerId;

    return () => {
      window.clearInterval(timerId);
      if (mainTimerRef.current === timerId) mainTimerRef.current = null;
    };
  }, [isActive]);

  useEffect(() => {
    const container = passageContainerRef.current;
    const activeChar = activeCharRef.current;
    if (!container || !activeChar || !isActive) return;
    const c = container.getBoundingClientRect();
    const a = activeChar.getBoundingClientRect();
    const safeTop = c.top + container.clientHeight * 0.28;
    const safeBottom = c.top + container.clientHeight * 0.72;
    if (a.top < safeTop) container.scrollBy({ top: a.top - safeTop, behavior: "smooth" });
    else if (a.bottom > safeBottom) container.scrollBy({ top: a.bottom - safeBottom, behavior: "smooth" });
  }, [input, isActive]);

  useEffect(() => {
    if (!strictExamMode || !isActive) return undefined;
    const prevent = (event) => event.preventDefault();
    const shortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && ["a", "c", "v", "x"].includes(event.key.toLowerCase())) event.preventDefault();
    };
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("keydown", shortcut);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("keydown", shortcut);
    };
  }, [isActive, strictExamMode]);

  const beginTyping = useCallback(() => {
    finishingRef.current = false;
    startedAtRef.current = Date.now();
    deadlineRef.current = startedAtRef.current + selectedExam.duration * 1000;
    setInput("");
    setTimeLeft(selectedExam.duration);
    setIsFinished(false);
    setLastResult(null);
    setSaveNotice("");
    setCompletionToast("");
    setIsActive(true);
    setCountdown(0);
    window.setTimeout(() => inputRef.current?.focus(), 80);
    void track(dailyChallengeMode ? "daily_challenge_started" : "test_started", {
      passageId: currentPassage.id,
      examMode: selectedExam.id,
    });
  }, [currentPassage.id, dailyChallengeMode, selectedExam, track]);

  const startTest = useCallback(async () => {
    if (!currentPassage) return;
    const effectiveFreeTestsUsed = user
      ? Number(profile.free_tests_used || 0) || 0
      : freeTestsUsed;
    if (!profile.is_premium && effectiveFreeTestsUsed >= SITE_CONFIG.freeTrialsAllowed) {
      setShowPaywall(true);
      void track("paywall_opened", { reason: "free_limit" });
      return;
    }
    if (isPassageLocked(currentPassage)) {
      setShowPaywall(true);
      void track("paywall_opened", { reason: "locked_passage" });
      return;
    }

    if (strictExamMode) {
      if (!profile.is_premium) {
        setShowPaywall(true);
        void track("paywall_opened", { reason: "strict_exam" });
        return;
      }
      if (document.fullscreenEnabled && !document.fullscreenElement) {
        try { await document.documentElement.requestFullscreen(); } catch { /* fullscreen is optional */ }
      }
      setCountdown(5);
      let current = 5;
      countdownTimerRef.current = window.setInterval(() => {
        current -= 1;
        setCountdown(current);
        if (current <= 0) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          beginTyping();
        }
      }, 1000);
      return;
    }
    beginTyping();
  }, [
    beginTyping,
    currentPassage,
    freeTestsUsed,
    isPassageLocked,
    profile.free_tests_used,
    profile.is_premium,
    strictExamMode,
    track,
    user,
  ]);

  const selectPassage = useCallback((passage, daily = false) => {
    if (isActive || countdown > 0) return;
    if (isPassageLocked(passage) || (daily && !profile.is_premium)) {
      setShowPaywall(true);
      void track("paywall_opened", { reason: daily ? "daily_challenge" : "locked_passage" });
      return;
    }
    setSelectedPassageId(passage.id);
    setDailyChallengeMode(daily);
    setInput("");
    setIsFinished(false);
    setLastResult(null);
    setSaveNotice("");
    setTimeLeft(selectedExam.duration);
    if (passageContainerRef.current) passageContainerRef.current.scrollTop = 0;
  }, [countdown, isActive, isPassageLocked, profile.is_premium, selectedExam.duration, track]);

  const handleInput = (event) => {
    if (!isActive || isFinished) return;
    const value = event.target.value;
    if (value.length > currentPassage.text.length) return;
    setInput(value);
    if (value.length >= currentPassage.text.length) {
      void finishTest({ finalInput: value, reason: "complete" });
    }
  };

  const handleExamChange = (event) => {
    if (isActive || countdown > 0) return;
    const id = event.target.value;
    const mode = SITE_CONFIG.examModes.find((item) => item.id === id);
    if (!mode) return;
    if (!profile.is_premium && id !== "practice") {
      setShowPaywall(true);
      void track("paywall_opened", { reason: "exam_preset", examMode: id });
      return;
    }
    setSelectedExamId(id);
    setTimeLeft(mode.duration);
    setInput("");
    setIsFinished(false);
    setLastResult(null);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: { data: { full_name: authName.trim() || undefined } },
        });
        if (error) throw error;
        setAuthError("Account created. Check your email if confirmation is enabled, then sign in.");
        void track("signup");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
        if (error) throw error;
        setShowAuth(false);
      }
    } catch (error) {
      setAuthError(error?.message || "Authentication failed.");
      void reportError("auth", error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await track("logout");
    await supabase.auth.signOut();
    setUser(null);
    setProfileData(null);
    setShowProfile(false);
  };

  const handlePayment = async () => {
    if (profile.is_premium) {
      setShowPaywall(false);
      return;
    }
    if (!user) {
      setShowPaywall(false);
      setAuthMode("login");
      setShowAuth(true);
      return;
    }

    setPaymentLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const order = await response.json();
      if (!response.ok) throw new Error(order.error || "Order creation failed.");
      if (!window.Razorpay) throw new Error("Razorpay Checkout is still loading. Try again in a moment.");

      void track("checkout_started", { amount: order.amountINR || order.amount / 100 });
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        name: SITE_CONFIG.brand,
        description: order.discountPercent ? "Lifetime Premium · Referral discount" : "Lifetime Premium Access",
        order_id: order.id,
        prefill: { email: user.email || "" },
        theme: { color: "#8b5cf6" },
        handler: async (razorpayResponse) => {
          try {
            const freshToken = await getToken();
            if (!freshToken) throw new Error("Your login session expired. Do not pay again; use Restore Purchase after signing in.");
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${freshToken}`,
              },
              body: JSON.stringify(razorpayResponse),
            });
            const verify = await verifyResponse.json();
            if (!verifyResponse.ok || verify.success !== true || verify.premium !== true) {
              throw new Error(verify.error || "Payment was captured but Premium activation was not confirmed. Do not pay again; use Restore Purchase.");
            }
            setShowPaywall(false);
            await loadProfile();
            setProfileNotice("Payment successful. Lifetime Pro is active.");
            void track("premium_activated", { referralRewarded: verify.referralRewarded === true });
          } catch (error) {
            setProfileNotice(error.message);
            setShowProfile(true);
            void reportError("payment_verify", error);
          }
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.on("payment.failed", (failure) => {
        const message = failure?.error?.description || "Payment failed or was cancelled.";
        setProfileNotice(message);
        void reportError("payment_failed", new Error(message), { code: failure?.error?.code || "" });
      });
      checkout.open();
    } catch (error) {
      setProfileNotice(error.message || "Payment could not be started.");
      setShowProfile(true);
      void reportError("payment_start", error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const restorePurchase = async () => {
    setRestoreLoading(true);
    setProfileNotice("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in first.");
      const response = await fetch("/api/restore-purchase", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "No restorable purchase was found.");
      await loadProfile();
      setProfileNotice("Purchase restored. Lifetime Pro is active.");
    } catch (error) {
      setProfileNotice(error.message);
      void reportError("restore_purchase", error);
    } finally {
      setRestoreLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    setShowLeaderboard(true);
    setLeaderboardLoading(true);
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Leaderboard could not be loaded.");
      setLeaderboard(result.leaderboard || []);
    } catch (error) {
      setLeaderboard([]);
      void reportError("leaderboard", error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const toggleShare = async (enabled) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in first.");
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shareEnabled: enabled }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Sharing setting could not be updated.");
      await loadProfile();
      setProfileNotice(enabled ? "Your progress link is now public." : "Your progress link is now private.");
    } catch (error) {
      setProfileNotice(error.message);
    }
  };

  const copyText = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setProfileNotice("Copied to clipboard.");
    } catch {
      setProfileNotice(value);
    }
  };

  const shareProgress = async () => {
    const url = `${SITE_CONFIG.siteUrl}/progress/${profile.public_slug}`;
    const shareData = {
      title: `${profile.full_name || "My"} SarkariType progress`,
      text: `My SarkariType progress: ${profile.best_net_wpm || 0} WPM, ${profile.best_accuracy || 0}% best accuracy and ${profile.total_xp || 0} XP.`,
      url,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(url);
      setProfileNotice(navigator.share ? "Progress shared." : "Progress link copied.");
      void track("progress_shared");
    } catch (error) {
      if (error?.name !== "AbortError") setProfileNotice("Share was cancelled or unavailable.");
    }
  };

  const shareLatestResult = async () => {
    if (!lastResult) return;
    const referralSuffix = profile.referral_code ? `?ref=${encodeURIComponent(profile.referral_code)}` : "";
    const url = `${SITE_CONFIG.siteUrl}/${referralSuffix}`;
    const text = `I scored ${lastResult.netWpm} Net WPM with ${lastResult.accuracy}% accuracy on SarkariType Pro. Can you beat it?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My SarkariType result", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCompletionToast("Result + challenge link copied!");
      }
      void track("result_shared", { netWpm: lastResult.netWpm, accuracy: lastResult.accuracy });
    } catch (error) {
      if (error?.name !== "AbortError") setCompletionToast("Sharing is unavailable in this browser.");
    }
  };

  const liveElapsed = Math.max(1, selectedExam.duration - timeLeft);
  const liveStats = calculateStats(currentPassage?.text || "", input, liveElapsed);
  const progress = currentPassage?.text?.length ? Math.min(100, (input.length / currentPassage.text.length) * 100) : 0;
  const levelInfo = getLevelInfo(profile.total_xp || 0);
  const referralPrice = profile.referred_by && !profile.referral_discount_used ? SITE_CONFIG.pricing.referralINR : SITE_CONFIG.pricing.regularINR;

  const renderPassage = () => (currentPassage?.text || "").split("").map((character, index) => {
    const typed = index < input.length;
    const current = index === input.length;
    let className = "text-slate-500 dark:text-slate-400";
    if (typed) className = input[index] === character
      ? "text-emerald-600 dark:text-emerald-300 font-semibold"
      : "rounded bg-rose-100 text-rose-600 underline decoration-2 dark:bg-rose-500/15 dark:text-rose-300";
    if (current && isActive) className = "rounded bg-sky-100 text-sky-700 underline decoration-2 underline-offset-4 dark:bg-sky-500/15 dark:text-sky-300";
    return (
      <span key={`${index}-${character}`} ref={current ? activeCharRef : null} className={className}>
        {character}
      </span>
    );
  });

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="st-shell min-h-screen text-slate-800 transition dark:text-slate-100">
        <header className="st-header sticky top-0 z-40 border-b px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 shadow-lg shadow-violet-500/20">
                <Keyboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight">Sarkari<span className="text-violet-600 dark:text-violet-300">Type</span> <span className="text-amber-500">Pro</span></div>
                <div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">V5 · Exam Training</div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowConnect(true)} className="hidden items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:scale-[1.02] dark:bg-emerald-500/10 dark:text-emerald-300 sm:flex">
                <MessageCircle className="h-4 w-4" /> Connect
              </button>
              <button type="button" onClick={loadLeaderboard} className="rounded-2xl bg-amber-50 p-2.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" title="Leaderboard">
                <Trophy className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setShowThemeStudio(true)} className="rounded-2xl bg-fuchsia-50 p-2.5 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300" title="Theme Studio">
                <Palette className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")} className="rounded-2xl bg-sky-50 p-2.5 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" title="Toggle light/dark">
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {user ? (
                <>
                  <button type="button" onClick={() => { setShowProfile(true); void loadProfile(); }} className="flex items-center gap-2 rounded-2xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" title="Profile & progress">
                    <UserRound className="h-5 w-5" />
                    <span className="hidden md:inline">Lv {levelInfo.level}</span>
                  </button>
                  <button type="button" onClick={logout} className="rounded-2xl bg-rose-50 p-2.5 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" title="Sign out">
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => { setAuthMode("login"); setShowAuth(true); }} className="rounded-2xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-violet-500/20">Sign In</button>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <section className={`st-hero relative mb-6 overflow-hidden rounded-[2.2rem] p-6 text-white shadow-2xl sm:p-8 ${layoutMode === "minimal" ? "hidden" : ""}`}>
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="relative max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-widest"><Sparkles className="h-4 w-4" /> Smarter practice, visible progress</div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Train for the exam. Build a streak. Show your progress.</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/90 sm:text-base">140 original exam-style + book-summary practice passages, reliable timer, detailed result analysis, weak-key tracking, daily challenge, XP, achievements, referral rewards and shareable progress.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
                {["140 passages", "2 free tests", "Daily challenge", "Progress dashboard", "₹50 lifetime Pro"].map((item) => <span key={item} className="rounded-xl bg-white/15 px-3 py-2">{item}</span>)}
              </div>
            </div>
          </section>

          {dailyChallenge ? (
            <section className={`mb-5 flex-col gap-3 rounded-3xl border border-amber-200 ${layoutMode === "minimal" ? "hidden" : "flex"} bg-gradient-to-r from-amber-50 to-pink-50 p-4 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-pink-500/10 sm:flex-row sm:items-center sm:justify-between`}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-3 text-amber-500 shadow-sm dark:bg-slate-900"><Flame className="h-6 w-6" /></div>
                <div>
                  <div className="flex items-center gap-2 font-black">Today&apos;s Challenge {profileData?.dailyChallengeCompleted ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}</div>
                  <div className="text-sm font-semibold text-slate-500">{dailyChallenge.title} · +{SITE_CONFIG.dailyChallengeBonusXp} bonus XP on your first saved completion today.</div>
                </div>
              </div>
              <button type="button" onClick={() => selectPassage(dailyChallenge, true)} disabled={isActive || countdown > 0} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{profile.is_premium ? "Start Pro challenge" : "Unlock Daily Challenge"}</button>
            </section>
          ) : null}

          <section className="mb-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 md:col-span-2">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400"><Activity className="h-4 w-4 text-violet-500" /> Exam mode</div>
              <div className="relative">
                <select value={selectedExamId} onChange={handleExamChange} disabled={isActive || countdown > 0} className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-black outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-950">
                  {SITE_CONFIG.examModes.map((mode) => <option key={mode.id} value={mode.id}>{mode.name} ({Math.floor(mode.duration / 60)} min)</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button type="button" onClick={() => profile.is_premium ? setShowTutorial(true) : setShowPaywall(true)} className="flex items-center gap-3 rounded-3xl border border-pink-100 bg-pink-50/80 p-4 text-left transition hover:-translate-y-0.5 dark:border-pink-500/10 dark:bg-pink-500/5">
              <div className="rounded-2xl bg-white p-3 text-pink-500 shadow-sm dark:bg-slate-900"><Fingerprint className="h-5 w-5" /></div>
              <div><div className="flex items-center gap-2 text-sm font-black">Finger Guide <Crown className="h-3.5 w-3.5 text-amber-500" /></div><div className="text-xs font-semibold text-slate-500">Visual touch-typing tutorial</div></div>
            </button>

            <button type="button" onClick={() => profile.is_premium ? window.open(SITE_CONFIG.fossTypingSite.url, "_blank", "noopener,noreferrer") : setShowPaywall(true)} className="flex items-center gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 text-left transition hover:-translate-y-0.5 dark:border-emerald-500/10 dark:bg-emerald-500/5">
              <div className="rounded-2xl bg-white p-3 text-emerald-500 shadow-sm dark:bg-slate-900"><BookOpen className="h-5 w-5" /></div>
              <div><div className="flex items-center gap-2 text-sm font-black">FOSS Tutor <Crown className="h-3.5 w-3.5 text-amber-500" /></div><div className="text-xs font-semibold text-slate-500">Extra no-login training</div></div>
            </button>
          </section>

          <section className={`mb-5 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 ${layoutMode === "minimal" ? "py-3" : ""}`}>
            <div className={`${layoutMode === "minimal" ? "hidden" : "mb-3 flex"} flex-wrap items-center justify-between gap-3`}>
              <div><div className="flex items-center gap-2 font-black"><Filter className="h-4 w-4 text-sky-500" /> Passage Library</div><div className="mt-1 text-xs font-semibold text-slate-400">Filter 140 passages by difficulty, exam, skill and category.</div></div>
              <div className="text-xs font-black text-slate-400">Showing {filteredPassages.length}</div>
            </div>
            <div className={`${layoutMode === "minimal" ? "hidden" : "grid"} gap-2 sm:grid-cols-2 lg:grid-cols-4`}>
              <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)} disabled={isActive} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950">
                {["All", "Easy", "Moderate", "Hard"].map((value) => <option key={value}>{value}</option>)}
              </select>
              <select value={examFilter} onChange={(event) => setExamFilter(event.target.value)} disabled={isActive} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950">
                <option value="All">All exams</option>
                <option value="ssc">SSC</option><option value="chsl">SSC CHSL</option><option value="bank">Banking</option><option value="railway">Railway</option><option value="psc">PSC / Police</option>
              </select>
              <select value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)} disabled={isActive} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950">
                <option value="All">All skills</option>
                <option value="numbers">Numbers</option><option value="punctuation">Punctuation</option><option value="capitalization">Capitals</option><option value="long-words">Long words</option><option value="formal">Formal text</option><option value="symbols">Symbols</option>
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} disabled={isActive} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold dark:border-slate-700 dark:bg-slate-950">
                <option value="All">All categories</option>
                {[...new Set(passages.map((item) => item.category).filter(Boolean))].sort().map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {filteredPassages.slice(0, 140).map((passage) => {
                const locked = isPassageLocked(passage);
                const selected = String(currentPassage?.id) === String(passage.id);
                return (
                  <button key={passage.id} type="button" onClick={() => selectPassage(passage, false)} disabled={isActive || countdown > 0} className={`min-w-[155px] rounded-2xl border p-3 text-left transition ${selected ? "border-violet-500 bg-violet-500 text-white shadow-lg" : locked ? "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900" : "border-slate-200 bg-white hover:border-violet-300 dark:border-slate-800 dark:bg-slate-950"}`}>
                    <div className="flex items-center justify-between text-xs font-black"><span>{passage.id}</span>{locked ? <Lock className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}</div>
                    <div className="mt-2 truncate text-xs font-black">{passage.title}</div>
                    <div className="mt-1 text-[10px] font-bold opacity-75">{passage.difficulty}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard icon={Clock3} label="Time Left" value={formatTime(timeLeft)} accent="text-sky-500" />
            <MetricCard icon={Gauge} label="Net WPM" value={strictExamMode && isActive ? "—" : liveStats.netWpm} accent="text-violet-500" />
            <MetricCard icon={Zap} label="Accuracy" value={strictExamMode && isActive ? "—" : `${liveStats.accuracy}%`} accent="text-emerald-500" />
            <MetricCard icon={Keyboard} label="Gross WPM" value={strictExamMode && isActive ? "—" : liveStats.grossWpm} accent="text-pink-500" />
          </section>

          <section className="overflow-hidden rounded-[2.2rem] border border-white/70 bg-white/90 shadow-xl dark:border-slate-800 dark:bg-slate-900/85">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black">{currentPassage?.title}</h2>
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">{currentPassage?.difficulty}</span>
                  {dailyChallengeMode ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">Daily Challenge</span> : null}
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-400">{currentPassage?.category} · {selectedExam.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { if (!profile.is_premium) { setShowPaywall(true); void track("paywall_opened", { reason: "strict_exam_toggle" }); return; } setStrictExamMode((value) => !value); }} disabled={isActive || countdown > 0} className={`rounded-2xl px-4 py-3 text-xs font-black ${strictExamMode ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"}`}><Fullscreen className="mr-2 inline h-4 w-4" />Exam Sim {!profile.is_premium ? "👑" : ""}</button>
                <button type="button" onClick={resetTest} className="rounded-2xl bg-slate-100 p-3 text-slate-600 transition hover:bg-sky-100 hover:text-sky-600 dark:bg-slate-800 dark:text-slate-300" title="Reset test"><RotateCcw className="h-5 w-5" /></button>
                {isActive ? (
                  <button type="button" onClick={() => void finishTest({ finalInput: inputRef.current?.value || input, finalTimeLeft: timeLeft, reason: "manual" })} className="rounded-2xl bg-emerald-500 px-5 py-3 text-xs font-black text-white shadow-lg">Finish Now</button>
                ) : null}
                <button type="button" onClick={startTest} disabled={isActive || countdown > 0} className="st-primary rounded-2xl px-6 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50"><Play className="mr-2 inline h-4 w-4 fill-current" />{countdown > 0 ? `Get Ready ${countdown}` : isFinished ? "Retake Test" : "Start Test"}</button>
              </div>
            </div>

            <div className="h-1.5 bg-slate-100 dark:bg-slate-800"><div className="h-full bg-gradient-to-r from-violet-500 via-pink-400 to-sky-400 transition-all" style={{ width: `${progress}%` }} /></div>

            <div className="p-5 sm:p-7">
              <div className="mb-2 flex items-center justify-between px-1 text-xs font-black uppercase tracking-widest text-slate-400"><span>Reference Passage</span><span>{input.length}/{currentPassage?.text?.length || 0}</span></div>
              <div ref={passageContainerRef} className="relative mb-5 h-[250px] overflow-y-auto overflow-x-hidden rounded-3xl border-2 border-slate-200 bg-[#fffdfd] px-5 py-7 font-mono text-[22px] font-medium leading-[2.05] tracking-[.02em] shadow-inner scroll-smooth dark:border-slate-800 dark:bg-[#070b14] sm:h-[285px] sm:px-8 sm:text-[24px]">
                <div className="mx-auto max-w-5xl">{renderPassage()}</div>
              </div>

              <div className="mb-2 px-1 text-xs font-black uppercase tracking-widest text-slate-400">Typing Area</div>
              <textarea ref={inputRef} value={input} onChange={handleInput} disabled={!isActive || isFinished} spellCheck={false} autoCorrect="off" autoCapitalize="off" autoComplete="off" maxLength={currentPassage?.text?.length || 0} className="h-52 w-full resize-none rounded-3xl border-2 border-slate-200 bg-white p-6 font-mono text-[20px] leading-9 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-[#070b14] sm:text-[21px]" placeholder={isActive ? "Type exactly as shown above..." : countdown > 0 ? "Prepare yourself..." : isFinished ? "Test finished. Review your result or click Retake Test." : "Click Start Test to begin..."} />

              {lastResult ? (
                <div className="mt-5 rounded-3xl bg-gradient-to-br from-violet-50 via-white to-sky-50 p-5 dark:from-violet-500/10 dark:via-slate-900 dark:to-sky-500/10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><div className="text-xs font-black uppercase tracking-widest text-slate-400">Result</div><div className="mt-1 text-2xl font-black">{lastResult.netWpm} Net WPM · {lastResult.accuracy}% accuracy</div></div>
                    {lastResult.xpEarned || lastResult.dailyBonusXp ? <div className="rounded-2xl bg-amber-100 px-4 py-2 text-sm font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">+{(lastResult.xpEarned || 0) + (lastResult.dailyBonusXp || 0)} XP</div> : null}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <MetricCard icon={Gauge} label="Net WPM" value={lastResult.netWpm} />
                    <MetricCard icon={Keyboard} label="Gross WPM" value={lastResult.grossWpm} accent="text-pink-500" />
                    <MetricCard icon={Award} label="Accuracy" value={`${lastResult.accuracy}%`} accent="text-emerald-500" />
                    <MetricCard icon={Activity} label="Errors" value={lastResult.incorrectChars || 0} accent="text-rose-500" />
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Weak keys in this test</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(lastResult.mistakeMap || {}).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([key, count]) => <span key={key} className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-black text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{humanKey(key)}: {count}</span>)}
                      {!Object.keys(lastResult.mistakeMap || {}).length ? <span className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">No character mistakes 🎉</span> : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
                    <span>{saveNotice}</span>
                    {user ? <button type="button" onClick={() => { setShowProfile(true); void loadProfile(); }} className="rounded-xl bg-white px-3 py-2 font-black text-violet-600 shadow-sm dark:bg-slate-900 dark:text-violet-300">View full progress</button> : null}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className={`mt-6 gap-4 md:grid-cols-3 ${layoutMode === "minimal" ? "hidden" : "grid"}`}>
            <Link href="/learn" className="rounded-3xl bg-lime-50 p-5 transition hover:-translate-y-0.5 dark:bg-lime-500/5"><GraduationCap className="h-6 w-6 text-lime-600" /><div className="mt-3 font-black">Typing Guides</div><div className="mt-1 text-sm font-semibold text-slate-500">Accuracy, 35 WPM, home-row and exam-day guides.</div></Link>
            <Link href="/exams/ssc-cgl-typing-test" className="rounded-3xl bg-sky-50 p-5 transition hover:-translate-y-0.5 dark:bg-sky-500/5"><ShieldCheck className="h-6 w-6 text-sky-600" /><div className="mt-3 font-black">Exam Pages</div><div className="mt-1 text-sm font-semibold text-slate-500">Focused practice pages for SSC, Railway, Banking and PSC.</div></Link>
            <button type="button" onClick={() => setShowConnect(true)} className="rounded-3xl bg-pink-50 p-5 text-left transition hover:-translate-y-0.5 dark:bg-pink-500/5"><Send className="h-6 w-6 text-pink-600" /><div className="mt-3 font-black">Connect with AGLimitless</div><div className="mt-1 text-sm font-semibold text-slate-500">Telegram updates and the AGLimitless Blogger store.</div></button>
          </section>
        </main>

        <footer className={`${layoutMode === "minimal" ? "hidden" : "block"} mx-auto mt-6 max-w-7xl px-4 pb-10 text-center text-xs font-semibold text-slate-400 sm:px-6`}>SarkariType Pro V5 · Original simulated practice passages · Built for deliberate exam preparation.</footer>
      </div>

      {completionToast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-white/70 bg-white/95 px-5 py-3 text-sm font-black text-violet-700 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-violet-300">
          {completionToast}
          <button type="button" onClick={() => setCompletionToast("")} className="ml-3 text-slate-400" aria-label="Dismiss completion message">×</button>
        </div>
      ) : null}

      {showAuth ? (
        <Modal title={authMode === "login" ? "Welcome back" : "Create your account"} onClose={() => setShowAuth(false)}>
          <div className="mb-4 flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-950">
            <button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); }} className={`flex-1 rounded-xl py-2.5 text-sm font-black ${authMode === "login" ? "bg-violet-600 text-white" : "text-slate-500"}`}>Sign in</button>
            <button type="button" onClick={() => { setAuthMode("signup"); setAuthError(""); }} className={`flex-1 rounded-xl py-2.5 text-sm font-black ${authMode === "signup" ? "bg-violet-600 text-white" : "text-slate-500"}`}>Create account</button>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {authMode === "signup" ? <input value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Your name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-950" /> : null}
            <input type="email" required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="Email address" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-bold outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-950" />
            <div className="relative"><input type={showPassword ? "text" : "password"} minLength={6} required value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 font-bold outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-950" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
            {authError ? <div className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">{authError}</div> : null}
            <button disabled={authLoading} className="w-full rounded-2xl bg-violet-600 py-3.5 font-black text-white disabled:opacity-50">{authLoading ? "Processing..." : authMode === "login" ? "Sign in" : "Create account"}</button>
          </form>
          <div className="my-4 text-center text-xs font-black uppercase tracking-widest text-slate-400">or</div>
          <button type="button" onClick={handleGoogleLogin} disabled={authLoading} className="w-full rounded-2xl border border-slate-200 py-3.5 font-black dark:border-slate-700">Continue with Google</button>
        </Modal>
      ) : null}

      {showPaywall ? (
        <Modal title="Unlock SarkariType Pro" onClose={() => setShowPaywall(false)}>
          <div className="text-center">
            <Crown className="mx-auto h-14 w-14 text-amber-500" />
            <div className="mt-4 flex items-end justify-center gap-2"><span className="text-5xl font-black text-violet-600 dark:text-violet-300">₹{referralPrice}</span>{referralPrice < 50 ? <span className="mb-1 text-sm font-black text-slate-400 line-through">₹50</span> : null}</div>
            <div className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">Lifetime access</div>
            {referralPrice < 50 ? <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Gift className="h-4 w-4" /> 20% referral discount applied</div> : null}
            <div className="my-5 space-y-2 text-left text-sm font-bold">
              {["All 140 passages + book summaries", "Unlimited saved tests", "Progress dashboard + charts", "XP, streaks and achievements", "Daily challenge + bonus XP", "Visual finger-placement guide", "Shareable progress report"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950"><CheckCircle2 className="h-5 w-5 text-emerald-500" />{item}</div>)}
            </div>
            <button type="button" onClick={handlePayment} disabled={paymentLoading} className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 font-black text-white shadow-lg disabled:opacity-50">{paymentLoading ? "Connecting..." : user ? `Pay ₹${referralPrice} — Unlock Lifetime` : "Sign in to upgrade"}</button>
            {user && !profile.is_premium ? <button type="button" onClick={restorePurchase} disabled={restoreLoading} className="mt-3 text-sm font-black text-violet-600 dark:text-violet-300">Already paid? Restore Purchase</button> : null}
          </div>
        </Modal>
      ) : null}

      {showProfile ? (
        <Modal title="Your Progress" wide onClose={() => setShowProfile(false)}>
          <ProfileDrawer
            data={profileData}
            loading={profileLoading}
            onRestorePurchase={restorePurchase}
            restoring={restoreLoading}
            referralInput={referralInput}
            setReferralInput={setReferralInput}
            onAttachReferral={() => attachReferralCode(referralInput)}
            onToggleShare={toggleShare}
            onShareProgress={shareProgress}
            onCopy={copyText}
            notice={profileNotice}
          />
        </Modal>
      ) : null}

      {showTutorial ? <Modal title="Finger Placement Visual Guide" wide onClose={() => setShowTutorial(false)}><FingerGuide /></Modal> : null}

      {showLeaderboard ? (
        <Modal title="SarkariType Leaderboard" wide onClose={() => setShowLeaderboard(false)}>
          {leaderboardLoading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div> : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div key={`${entry.rank}-${entry.name}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 font-black text-amber-600 dark:bg-amber-500/10">#{entry.rank}</div><div><div className="font-black">{entry.name} {entry.premium ? "👑" : ""}</div><div className="text-xs font-semibold text-slate-400">{entry.totalTests} tests · 🔥 {entry.streak}</div></div></div>
                  <div className="text-right"><div className="font-black text-violet-600 dark:text-violet-300">{entry.totalXp} XP</div><div className="text-xs font-bold text-slate-400">Best {entry.bestNetWpm} WPM</div></div>
                  {entry.publicSlug ? <Link href={`/progress/${entry.publicSlug}`} className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">View progress</Link> : null}
                </div>
              ))}
              {!leaderboard.length ? <div className="p-8 text-center font-semibold text-slate-400">No ranked results yet.</div> : null}
            </div>
          )}
        </Modal>
      ) : null}



      {showResultSummary && lastResult ? (
        <Modal title="Test Complete 🎉" onClose={() => setShowResultSummary(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={Gauge} label="Net WPM" value={lastResult.netWpm} />
              <MetricCard icon={Keyboard} label="Gross WPM" value={lastResult.grossWpm} accent="text-sky-500" />
              <MetricCard icon={Zap} label="Accuracy" value={`${lastResult.accuracy}%`} accent="text-emerald-500" />
              <MetricCard icon={Award} label="XP Earned" value={`+${(lastResult.xpEarned || 0) + (lastResult.dailyBonusXp || 0)}`} accent="text-amber-500" />
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-slate-950">
              {saveNotice || "Your result is ready."}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setShowResultSummary(false); void resetTest(); }} className="st-primary flex-1 rounded-2xl px-4 py-3 font-black text-white">
                <RotateCcw className="mr-2 inline h-4 w-4" /> Try Again
              </button>
              <button type="button" onClick={shareLatestResult} className="flex-1 rounded-2xl bg-sky-100 px-4 py-3 font-black text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                <Share2 className="mr-2 inline h-4 w-4" /> Share Result
              </button>
              {user ? <button type="button" onClick={() => { setShowResultSummary(false); setShowProfile(true); void loadProfile(); }} className="w-full rounded-2xl bg-violet-100 px-4 py-3 font-black text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">Open Progress Profile</button> : null}
            </div>
          </div>
        </Modal>
      ) : null}


      {showThemeStudio ? (
        <Modal title="Theme Studio" wide onClose={() => setShowThemeStudio(false)}>
          <ThemeStudio
            theme={theme}
            palette={palette}
            layoutMode={layoutMode}
            isPremium={profile.is_premium}
            trialActive={themeTrialActive}
            trialRemainingSeconds={themeTrialRemainingSeconds}
            onThemeChange={setTheme}
            onPaletteChange={(id) => requestPremiumAppearance("palette", id)}
            onLayoutChange={(id) => requestPremiumAppearance("layout", id)}
          />
        </Modal>
      ) : null}

      {showConnect ? (
        <Modal title="Connect with AGLimitless" onClose={() => setShowConnect(false)}>
          <p className="mb-4 text-sm font-semibold leading-6 text-slate-500">Get store updates, study resources and new SarkariType feature announcements.</p>
          <div className="space-y-3">
            <a href={SITE_CONFIG.connect.telegram} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-3xl bg-sky-50 p-4 font-black text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"><span className="flex items-center gap-3"><Send className="h-5 w-5" /> Telegram Channel</span><ExternalLink className="h-4 w-4" /></a>
            <a href={SITE_CONFIG.connect.blogger} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-3xl bg-orange-50 p-4 font-black text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"><span className="flex items-center gap-3"><Newspaper className="h-5 w-5" /> AGLimitless Blogger</span><ExternalLink className="h-4 w-4" /></a>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
