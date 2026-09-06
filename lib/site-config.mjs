export const SITE_CONFIG = {
  brand: "SarkariType Pro",
  version: "5.0",
  siteUrl: "https://typing.aglimitless.in",
  pricing: {
    regularINR: 50,
    referralINR: 40,
    referralDiscountPercent: 20,
  },
  freeTrialsAllowed: 2,
  freePassageCount: 2,
  referralRewardXp: 250,
  dailyChallengeBonusXp: 50,
  appearance: {
    defaultPalette: "pastel",
    defaultLayout: "standard",
    premiumPreviewMinutes: 5,
    palettes: [
      { id: "pastel", name: "Pastel Bliss", description: "Soft violet, pink and sky tones", premium: false },
      { id: "classic", name: "Clean Classic", description: "Neutral, familiar and distraction-light", premium: false },
      { id: "neo", name: "Neo Electric", description: "Modern neon cyan and violet energy", premium: true },
      { id: "aurora", name: "Midnight Aurora", description: "Deep navy with aurora highlights", premium: true },
      { id: "retro", name: "Retro Terminal", description: "Old-school green terminal mood", premium: true },
      { id: "paper", name: "Vintage Paper", description: "Warm paper-and-ink reading style", premium: true },
    ],
    layouts: [
      { id: "standard", name: "Standard", description: "Shows the complete SarkariType experience", premium: false },
      { id: "minimal", name: "Minimal Focus", description: "Keeps only the controls, stats and typing console", premium: true },
    ],
  },
  fossTypingSite: {
    name: "GuerillaType",
    url: "https://guerillatype.com/",
  },
  connect: {
    telegram: "https://t.me/aglimitless_store",
    blogger: "https://aglimitless-store.blogspot.com",
  },
  examModes: [
    { id: "practice", name: "1-Min Quick Practice", duration: 60, targetWpm: 30, targetAccuracy: 95 },
    { id: "ssc", name: "SSC CGL (DEST)", duration: 900, targetWpm: 35, targetAccuracy: 95 },
    { id: "chsl", name: "SSC CHSL Typing", duration: 600, targetWpm: 35, targetAccuracy: 95 },
    { id: "bank", name: "Banking Mains", duration: 600, targetWpm: 35, targetAccuracy: 95 },
    { id: "railway", name: "Railway NTPC", duration: 600, targetWpm: 30, targetAccuracy: 95 },
    { id: "psc", name: "State PSC / Police", duration: 600, targetWpm: 30, targetAccuracy: 95 },
  ],
};

export const DEFAULT_PROFILE = {
  id: null,
  email: null,
  full_name: "",
  is_premium: false,
  total_xp: 0,
  referral_code: null,
  referred_by: null,
  referral_discount_used: false,
  referral_rewarded: false,
  free_tests_used: 0,
  public_slug: null,
  share_enabled: false,
  total_tests: 0,
  total_practice_seconds: 0,
  best_net_wpm: 0,
  best_gross_wpm: 0,
  best_accuracy: 0,
  current_streak: 0,
  longest_streak: 0,
  last_practice_date: null,
  is_admin: false,
};

export function getLevelInfo(totalXp = 0) {
  const xp = Math.max(0, Number(totalXp) || 0);
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  const currentFloor = Math.pow(level - 1, 2) * 100;
  const nextFloor = Math.pow(level, 2) * 100;
  const span = Math.max(1, nextFloor - currentFloor);
  const progress = Math.min(100, Math.max(0, Math.round(((xp - currentFloor) / span) * 100)));

  let title = "Beginner";
  if (level >= 50) title = "Typing Master";
  else if (level >= 30) title = "Exam Ready";
  else if (level >= 20) title = "Speedster";
  else if (level >= 10) title = "Typist";
  else if (level >= 5) title = "Clerk";

  return { level, title, progress, currentFloor, nextFloor };
}
