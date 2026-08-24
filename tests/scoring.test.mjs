import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateStats,
  calculateXp,
  calculateReadiness,
  getWeakKeysFromResults,
  stableDateHash,
} from "../lib/scoring.mjs";
import { PASSAGES, getDailyChallenge } from "../lib/passages.mjs";
import { SITE_CONFIG, getLevelInfo } from "../lib/site-config.mjs";

test("exact typing produces 100% accuracy", () => {
  const result = calculateStats("hello world", "hello world", 60);
  assert.equal(result.accuracy, 100);
  assert.equal(result.correctChars, 11);
  assert.equal(result.incorrectChars, 0);
  assert.equal(result.grossWpm, result.netWpm);
});

test("mistakes are counted against expected keys", () => {
  const result = calculateStats("abc def", "abx def", 60);
  assert.equal(result.incorrectChars, 1);
  assert.equal(result.mistakeMap.c, 1);
});

test("XP is bounded and rewards stronger performance", () => {
  const weak = calculateXp({ netWpm: 15, accuracy: 80, typedChars: 120 }, 60, "Easy");
  const strong = calculateXp({ netWpm: 45, accuracy: 98, typedChars: 300 }, 600, "Hard");
  assert.ok(strong > weak);
  assert.ok(strong <= 250);
});

test("readiness is always within 0..100", () => {
  const readiness = calculateReadiness([
    { net_wpm: 40, accuracy: 97, duration_seconds: 600 },
    { net_wpm: 38, accuracy: 96, duration_seconds: 600 },
  ]);
  for (const value of Object.values(readiness)) assert.ok(value >= 0 && value <= 100);
});

test("weak key aggregation combines recent results", () => {
  const keys = getWeakKeysFromResults([
    { mistake_map: { A: 2, SPACE: 1 } },
    { mistake_map: { A: 3, B: 2 } },
  ]);
  assert.deepEqual(keys[0], { key: "A", count: 5 });
});

test("V5 ships at least 100 original practice passages with only first two free", () => {
  assert.ok(PASSAGES.length >= 100);
  assert.equal(PASSAGES[0].isPremium, false);
  assert.equal(PASSAGES[1].isPremium, false);
  assert.ok(PASSAGES.slice(2).every((passage) => passage.isPremium === true));
});

test("daily challenge selection is deterministic for a date", () => {
  const a = getDailyChallenge(PASSAGES, "2026-08-23");
  const b = getDailyChallenge(PASSAGES, "2026-08-23");
  assert.equal(a.id, b.id);
  assert.equal(stableDateHash("2026-08-23"), stableDateHash("2026-08-23"));
});

test("referral price is exactly a 20% discount from regular price", () => {
  const expected = SITE_CONFIG.pricing.regularINR * (1 - SITE_CONFIG.pricing.referralDiscountPercent / 100);
  assert.equal(SITE_CONFIG.pricing.referralINR, expected);
  assert.equal(SITE_CONFIG.pricing.regularINR, 50);
  assert.equal(SITE_CONFIG.pricing.referralINR, 40);
});

test("level function is monotonic for sample XP values", () => {
  const levels = [0, 100, 400, 900, 2500].map((xp) => getLevelInfo(xp).level);
  for (let i = 1; i < levels.length; i += 1) assert.ok(levels[i] >= levels[i - 1]);
});
