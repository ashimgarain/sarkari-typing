export function calculateStats(reference, typed, elapsedSeconds) {
  const source = String(reference || "");
  const safeTyped = String(typed || "").slice(0, source.length);
  const seconds = Math.max(1, Number(elapsedSeconds) || 1);
  const elapsedMinutes = seconds / 60;

  let correctChars = 0;
  const mistakeMap = {};

  for (let index = 0; index < safeTyped.length; index += 1) {
    if (safeTyped[index] === source[index]) {
      correctChars += 1;
    } else if (source[index]) {
      const expected = source[index] === " " ? "SPACE" : source[index];
      mistakeMap[expected] = (mistakeMap[expected] || 0) + 1;
    }
  }

  const typedChars = safeTyped.length;
  const incorrectChars = Math.max(0, typedChars - correctChars);
  const grossWpm = Math.max(0, Math.round((typedChars / 5) / elapsedMinutes));
  const netWpm = Math.max(0, Math.round((correctChars / 5) / elapsedMinutes));
  const accuracy = typedChars > 0
    ? Math.max(0, Math.min(100, Math.round((correctChars / typedChars) * 100)))
    : 100;

  return {
    grossWpm,
    netWpm,
    accuracy,
    typedChars,
    correctChars,
    incorrectChars,
    mistakeMap,
  };
}

export function calculateXp(stats, durationSeconds, difficulty = "Easy") {
  const duration = Math.max(0, Number(durationSeconds) || 0);
  if (!stats || stats.typedChars < 20 || duration < 5) return 0;

  const difficultyBonus = {
    Easy: 0,
    Moderate: 10,
    Hard: 20,
  }[difficulty] || 0;

  const accuracyBonus = stats.accuracy >= 100
    ? 35
    : stats.accuracy >= 98
      ? 25
      : stats.accuracy >= 95
        ? 15
        : stats.accuracy >= 90
          ? 5
          : 0;

  const practiceBonus = Math.min(30, Math.floor(duration / 60) * 5);
  const performanceXp = Math.round(stats.netWpm * (stats.accuracy / 100) * 2);

  return Math.max(0, Math.min(250, performanceXp + difficultyBonus + accuracyBonus + practiceBonus));
}

export function getWeakKeysFromResults(results = [], limit = 6) {
  const combined = {};

  for (const result of results || []) {
    const map = result?.mistake_map || result?.mistakeMap || {};
    for (const [key, value] of Object.entries(map)) {
      const count = Math.max(0, Number(value) || 0);
      combined[key] = (combined[key] || 0) + count;
    }
  }

  return Object.entries(combined)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

export function calculateReadiness(results = [], targetWpm = 35, targetAccuracy = 95) {
  const recent = (results || []).slice(0, 20);
  if (!recent.length) {
    return { overall: 0, speed: 0, accuracy: 0, consistency: 0, endurance: 0 };
  }

  const wpms = recent.map((item) => Number(item.net_wpm ?? item.netWpm) || 0);
  const accuracies = recent.map((item) => Number(item.accuracy) || 0);
  const durations = recent.map((item) => Number(item.duration_seconds ?? item.durationSeconds) || 0);

  const avgWpm = wpms.reduce((sum, value) => sum + value, 0) / wpms.length;
  const avgAccuracy = accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length;
  const avgDuration = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  const variance = wpms.reduce((sum, value) => sum + Math.pow(value - avgWpm, 2), 0) / wpms.length;
  const standardDeviation = Math.sqrt(variance);

  const speed = Math.round(Math.min(100, (avgWpm / Math.max(1, targetWpm)) * 100));
  const accuracy = Math.round(Math.min(100, (avgAccuracy / Math.max(1, targetAccuracy)) * 100));
  const consistency = Math.round(Math.max(0, 100 - Math.min(100, standardDeviation * 5)));
  const endurance = Math.round(Math.min(100, (avgDuration / 600) * 100));
  const overall = Math.round(speed * 0.35 + accuracy * 0.35 + consistency * 0.2 + endurance * 0.1);

  return { overall, speed, accuracy, consistency, endurance };
}

export function formatPracticeTime(totalSeconds = 0) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getTodayIstDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function stableDateHash(dateString) {
  let hash = 2166136261;
  for (const char of String(dateString || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}
