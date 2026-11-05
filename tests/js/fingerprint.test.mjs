import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";

const F = createRequire(import.meta.url)("../../omarchy/arzaroth.veil/FingerprintModel.js");

describe("retryDelayMs", () => {
  test("a clean streak retries at the swipe interval", () => {
    expect(F.retryDelayMs(0)).toBe(F.MATCH_RETRY_MS);
    expect(F.retryDelayMs(-1)).toBe(F.MATCH_RETRY_MS);
  });
  test("backs off exponentially from the base", () => {
    expect(F.retryDelayMs(1)).toBe(F.ERROR_RETRY_BASE_MS);
    expect(F.retryDelayMs(2)).toBe(2 * F.ERROR_RETRY_BASE_MS);
    expect(F.retryDelayMs(3)).toBe(4 * F.ERROR_RETRY_BASE_MS);
  });
  test("stops at the cap", () => expect(F.retryDelayMs(30)).toBe(F.ERROR_RETRY_CAP_MS));
});

describe("shouldNudge", () => {
  const now = 1_000_000;
  test("never at the swipe interval", () => {
    expect(F.shouldNudge(now, 0, 0, F.MATCH_RETRY_MS)).toBe(false);
  });
  test("not again inside the cooldown", () => {
    expect(F.shouldNudge(now, now - 100, 0, 1000)).toBe(false);
  });
  test("after the cooldown on a short backoff", () => {
    expect(F.shouldNudge(now, now - F.NUDGE_COOLDOWN_MS, 0, 1000)).toBe(true);
  });
  test("a backward clock step does not count as a finished cooldown", () => {
    expect(F.shouldNudge(now, now + 5000, 0, 1000)).toBe(true);
  });
  test("at the cap, only once fprintd has had its idle window", () => {
    const cap = F.ERROR_RETRY_CAP_MS;
    expect(F.shouldNudge(now, 0, now - 1000, cap)).toBe(false);
    expect(F.shouldNudge(now, 0, now - F.IDLE_CLEAR_MS, cap)).toBe(true);
    expect(F.shouldNudge(now, 0, now + 1000, cap)).toBe(false);
  });
});

describe("classifyProbe", () => {
  test("an enrolled finger list is yes", () => expect(F.classifyProbe("Fingerprints for user x:\n - #0: right-index-finger")).toBe("yes"));
  test("no and no fingers are no", () => {
    expect(F.classifyProbe(" no \n")).toBe("no");
    expect(F.classifyProbe("User x has no fingers enrolled for Goodix")).toBe("no");
  });
  test("anything else is unknown", () => {
    expect(F.classifyProbe("")).toBe("unknown");
    expect(F.classifyProbe(undefined)).toBe("unknown");
    expect(F.classifyProbe("No devices available")).toBe("unknown");
  });
});

describe("streaks", () => {
  test("a usable attempt resets the streak", () => expect(F.nextStreak(4, true, false)).toBe(0));
  test("a miss in the resume grace stays at the first tier", () => expect(F.nextStreak(4, false, true)).toBe(1));
  test("a miss otherwise grows the streak", () => expect(F.nextStreak(4, false, false)).toBe(5));
  test("unavailable from the threshold on", () => {
    expect(F.isUnavailable(F.UNAVAILABLE_AFTER - 1)).toBe(false);
    expect(F.isUnavailable(F.UNAVAILABLE_AFTER)).toBe(true);
  });
});

describe("sleep and resume", () => {
  test("a gap past the expected tick plus the slack is a sleep", () => {
    expect(F.spannedSleep(1000 + F.SLEEP_GAP_MS, 1000)).toBe(false);
    expect(F.spannedSleep(1001 + F.SLEEP_GAP_MS, 1000)).toBe(true);
  });
  test("the resume grace runs from the resume for its window", () => {
    const at = 50_000;
    expect(F.inResumeGrace(at, 0)).toBe(false);
    expect(F.inResumeGrace(at, at)).toBe(true);
    expect(F.inResumeGrace(at + F.RESUME_GRACE_MS, at)).toBe(false);
    expect(F.inResumeGrace(at - 1, at)).toBe(false);
  });
  test("the reach timeout and the fprintd idle window stay ordered", () => {
    expect(F.FPRINTD_IDLE_EXIT_MS).toBeLessThan(F.ERROR_RETRY_CAP_MS);
    expect(F.REACH_TIMEOUT_MS).toBeGreaterThan(F.FAST_ERROR_MS);
  });
});
