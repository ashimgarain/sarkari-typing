V5 automated helper tests
=========================

These tests use Node's built-in test runner and do not add a package dependency.
From the project root after copying the V5 files:

  node --test tests/scoring.test.mjs

Then still run the normal project gates:

  npm run lint
  npm run build

The Node tests validate core scoring, XP bounds, readiness bounds, weak-key aggregation,
passage/free-tier invariants, deterministic daily challenge selection, referral pricing,
and XP-level progression.
