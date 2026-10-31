import { describe, expect, it } from "vitest";
import { brands, referenceTime } from "../data/sample";
import { RecommendationSchema } from "./schemas";
import { rankPosts, RANKING_VERSION, scorePost } from "./ranking";
import type { BrandProfile, SocialPost } from "./types";

const [voice, security] = brands;
const example = (overrides: Partial<SocialPost> = {}): SocialPost => ({
  id: "unit-a", platform: "x-style", provenance: "synthetic", author: "fictional_unit_test",
  text: "How do voice agents handle speech recognition latency?", publishedAt: referenceTime,
  syntheticEngagement: "low", scenarioTags: ["unit-test"], ...overrides,
});
const score = (post: SocialPost, brand: BrandProfile = voice) => scorePost(brand, post, referenceTime);

describe("rules-v2 scoring (independent unit examples, not held-out labels)", () => {
  it("evaluates the same post differently for different brands", () => {
    const post = example();
    expect(score(post, voice)).toMatchObject({ decision: "recommend", score: 100 });
    expect(score(post, security)).toMatchObject({ decision: "skip", score: 0, matchedTopics: [] });
  });
  it("matches normalized phrases and counts a topic only once across aliases", () => {
    const result = score(example({ text: "ASR, speech-to-text and speech recognition." }));
    expect(result.matchedTopics).toEqual(["speech-recognition"]);
    expect(result.score).toBe(45);
  });
  it("matches word boundaries rather than substrings", () => {
    expect(score(example({ text: "Our transcriptions and disaster recovery are unrelated." })).score).toBe(0);
  });
  it("applies a brand exclusion despite a positive relevance score", () => {
    const result = score(example({ text: "How do voice APIs help voice acting auditions?" }));
    expect(result.decision).toBe("skip");
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.exclusions).toContain("brand_exclusion:voice acting auditions");
  });
  it("respects an author opt-out for both brands", () => {
    for (const brand of brands) {
      const result = score(example({ text: "Voice agents and prompt injection: no vendor replies." }), brand);
      expect(result.decision).toBe("skip");
      expect(result.exclusions).toContain("author_opt_out");
    }
  });
  it("gives exclusions precedence over risk flags and the recommendation threshold", () => {
    const result = score(example({ text: "How do voice agents handle an alleged breach? No vendor replies." }));
    expect(result.score).toBe(65);
    expect(result.exclusions).toContain("author_opt_out");
    expect(result.riskFlags).toContain("security_controversy");
    expect(result.decision).toBe("skip");
  });
  it("does not change scoring evidence when an identical post and brand have different IDs", () => {
    const original = score(example());
    const renamed = score(example({ id: "opaque-unseen-id" }), { ...voice, id: "another-brand-id" });
    expect(renamed).toEqual({ ...original, postId: "opaque-unseen-id", brandId: "another-brand-id" });
  });
  it("skips a viral irrelevant post and ignores engagement when relevant", () => {
    expect(score(example({ text: "Looking for snacks for a party.", syntheticEngagement: "viral" }))).toMatchObject({ score: 0, decision: "skip" });
    const low = score(example());
    expect(score(example({ syntheticEngagement: "viral" }))).toEqual(low);
  });
  it.each(["", "   ", "!!!"])("skips empty normalized text %j", (text) => {
    expect(score(example({ text }))).toMatchObject({ score: 0, decision: "skip", exclusions: ["empty_text", "no_topic_match"] });
  });
  it("routes security controversy to review even with high points", () => {
    const result = score(example({ text: "How do we assess an alleged prompt injection breach with data leakage?" }), security);
    expect(result).toMatchObject({ decision: "review", score: 90, riskFlags: ["security_controversy"] });
  });
  it("flags uncertainty and negated need instead of recommending", () => {
    expect(score(example({ text: "Maybe voice agents help, but we do not need another voice API." })))
      .toMatchObject({ decision: "review", riskFlags: ["ambiguous_intent"] });
  });
  it("penalizes announcements and marked repetition without reading scenario tags", () => {
    const result = score(example({ text: "Launching a voice API. Looking for speech recognition latency advice.", repetitiveOf: "unit-original" }));
    expect(result.score).toBe(55);
    expect(result.decision).toBe("review");
    expect(result.riskFlags).toEqual(["product_announcement", "repetitive"]);
    expect(score(example({ scenarioTags: ["security-controversy", "product-announcement"] }))).toEqual(score(example()));
  });
  it.each([[0, 45], [7, 45], [7.5, 35], [30, 35], [31, 25], [-1, 25]])("scores age %s days", (days, expected) => {
    const publishedAt = new Date(Date.parse(referenceTime) - days * 86_400_000).toISOString();
    const result = score(example({ text: "speech recognition", publishedAt }));
    expect(result.score).toBe(expected);
    if (days < 0) expect(result.riskFlags).toContain("future_timestamp");
  });
  it("enforces the recommend threshold at 60", () => {
    expect(score(example({ text: "Voice agents implementation notes." })).score).toBe(55);
    expect(score(example({ text: "Voice agents implementation notes." })).decision).toBe("review");
    expect(score(example({ text: "Looking for voice agents." }))).toMatchObject({ score: 65, decision: "recommend" });
  });
  it("rejects invalid timestamps and duplicate brand topic IDs at the runtime boundary", () => {
    expect(() => score(example({ publishedAt: "invalid" }))).toThrow();
    expect(() => scorePost(voice, example(), "invalid")).toThrow();
    expect(() => score(example(), { ...voice, topics: [voice.topics[0], voice.topics[0]] })).toThrow();
  });
  it("keeps breakdown totals equal to scores and validates recommendation output", () => {
    const result = score(example());
    expect(result.score).toBe(result.reasons.reduce((total, reason) => total + reason.points, 0));
    expect(result.rankingVersion).toBe(RANKING_VERSION);
    expect(RecommendationSchema.safeParse(result).success).toBe(true);
  });
  it("records a floor adjustment when combined penalties exceed the points", () => {
    const result = score(example({ text: "Launching a voice API.", publishedAt: "2026-01-01T00:00:00Z", repetitiveOf: "unit-original" }));
    expect(result).toMatchObject({ score: 0, decision: "review" });
    expect(result.reasons.find((reason) => reason.rule === "score_clamp")?.points).toBe(20);
    expect(result.reasons.reduce((sum, reason) => sum + reason.points, 0)).toBe(0);
  });
  it("is deterministic, has stable ID tie ordering, and does not mutate frozen inputs", () => {
    const postA = Object.freeze(example({ id: "unit-a" }));
    const postB = Object.freeze(example({ id: "unit-b" }));
    const input = Object.freeze([postB, postA]);
    const before = JSON.stringify({ voice, input });
    const ranked = rankPosts(voice, input, referenceTime);
    expect(ranked.map((r) => r.postId)).toEqual(["unit-a", "unit-b"]);
    expect(rankPosts(voice, [postA, postB], referenceTime)).toEqual(ranked);
    expect(rankPosts(voice, input, referenceTime)).toEqual(ranked);
    expect(JSON.stringify({ voice, input })).toBe(before);
  });
  it("supports empty batches and rejects duplicate IDs", () => {
    expect(rankPosts(voice, [], referenceTime)).toEqual([]);
    expect(() => rankPosts(voice, [example(), example()], referenceTime)).toThrow("Duplicate post ID");
  });
});
