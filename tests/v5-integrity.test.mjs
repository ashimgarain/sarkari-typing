import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PASSAGES } from "../lib/passages.mjs";
import { SITE_CONFIG } from "../lib/site-config.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("V5 passage library contains 140+ passages and 20 original book-summary practices", () => {
  assert.ok(PASSAGES.length >= 140);
  const books = PASSAGES.filter((p) => p.category === "Book Summary");
  assert.ok(books.length >= 20);
  assert.ok(books.every((p) => p.isPremium === true));
  assert.equal(PASSAGES.filter((p) => p.isPremium === false).length, 2);
});

test("appearance system has free basics and multiple Premium palettes", () => {
  const palettes = SITE_CONFIG.appearance.palettes;
  assert.ok(palettes.length >= 6);
  assert.ok(palettes.some((p) => p.premium === false));
  assert.ok(palettes.filter((p) => p.premium === true).length >= 4);
  assert.ok(SITE_CONFIG.appearance.layouts.some((l) => l.id === "minimal" && l.premium));
  assert.equal(SITE_CONFIG.appearance.premiumPreviewMinutes, 5);
});

test("payment creation keeps SarkariType namespace and server-selected referral price", () => {
  const source = read("app/api/create-order/route.js");
  assert.match(source, /receipt:\s*`st_/);
  assert.match(source, /source:\s*"sarkaritype"/);
  assert.match(source, /referred_by/);
  assert.match(source, /referral_discount_used/);
  assert.match(source, /amountPaise/);
});

test("payment verification requires captured payment and timing-safe signature comparison", () => {
  const source = read("app/api/verify-payment/route.js");
  assert.match(source, /timingSafeEqual/);
  assert.match(source, /payment\.status\s*!==\s*"captured"/);
  assert.match(source, /Payment amount mismatch/);
  assert.match(source, /is_premium:\s*true/);
});

test("service role secret is not referenced by client components", () => {
  const componentDir = path.join(root, "components");
  for (const name of fs.readdirSync(componentDir)) {
    const full = path.join(componentDir, name);
    if (!fs.statSync(full).isFile()) continue;
    assert.doesNotMatch(fs.readFileSync(full, "utf8"), /SUPABASE_SERVICE_ROLE_KEY/);
  }
});

test("submit-result performs server-side Premium and free-test enforcement", () => {
  const source = read("app/api/submit-result/route.js");
  assert.match(source, /free_tests_used/);
  assert.match(source, /passage\.isPremium/);
  assert.match(source, /dailyChallengeRequested/);
  assert.match(source, /examMode !== "practice"/);
});

test("migration is additive and contains server-authoritative progress fields", () => {
  const sql = read("SUPABASE_V5_MIGRATION.sql");
  assert.match(sql, /add column if not exists free_tests_used/);
  assert.match(sql, /record_typing_result/);
  assert.match(sql, /FREE_TEST_LIMIT_REACHED/);
  assert.match(sql, /reward_referrer_for_purchase/);
  assert.doesNotMatch(sql, /drop table\s+public\.profiles/i);
  assert.doesNotMatch(sql, /truncate\s+table/i);
});

test("V5 keeps AGLimitless contact links", () => {
  assert.equal(SITE_CONFIG.connect.telegram, "https://t.me/aglimitless_store");
  assert.equal(SITE_CONFIG.connect.blogger, "https://aglimitless-store.blogspot.com");
});
