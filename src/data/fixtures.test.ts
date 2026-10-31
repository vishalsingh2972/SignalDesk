import { describe, expect, it } from "vitest";
import { z } from "zod";
import rawLabels from "./human-labels.json";
import { brands, getPosts, posts, splitManifest } from "./sample";
import { BrandProfileSchema, HumanLabelSchema, RecommendationSchema, SocialPostSchema } from "../lib/schemas";
import { validateSplits } from "../lib/splits";

describe("fixture contracts and isolation (no held-out scoring)", () => {
  it("contains exactly two fictional brands and 30 distinct fictional posts", () => {
    expect(brands.map((brand) => brand.name)).toEqual(["VoiceStack AI", "SecureStack"]);
    expect(new Set(brands.map((brand) => brand.id)).size).toBe(2);
    expect(posts).toHaveLength(30);
    expect(new Set(posts.map((post) => post.id)).size).toBe(30);
    expect(new Set(posts.map((post) => post.text)).size).toBe(30);
    expect(posts.every((post) => post.text.trim().length > 0)).toBe(true);
    expect(brands.every((brand) => BrandProfileSchema.safeParse(brand).success)).toBe(true);
    expect(posts.every((post) => SocialPostSchema.safeParse(post).success)).toBe(true);
  });
  it("covers every brand/post pair exactly once with an editable proposed or reviewed label", () => {
    const labels = z.array(HumanLabelSchema).parse(rawLabels);
    const keys = labels.map((label) => `${label.brandId}/${label.postId}`);
    const expected = brands.flatMap((brand) => posts.map((post) => `${brand.id}/${post.id}`));
    expect(labels).toHaveLength(60);
    expect(new Set(keys).size).toBe(60);
    expect([...keys].sort()).toEqual(expected.sort());
    // Deliberately do not assert decisions against scorer outputs or tune any weights here.
  });
  it("rejects bad domain data rather than silently stripping or coercing it", () => {
    expect(SocialPostSchema.safeParse({ ...posts[0], publishedAt: "yesterday" }).success).toBe(false);
    expect(SocialPostSchema.safeParse({ ...posts[0], author: "real_person" }).success).toBe(false);
    expect(SocialPostSchema.safeParse({ ...posts[0], hiddenLabel: "recommend" }).success).toBe(false);
    expect(HumanLabelSchema.safeParse({ ...rawLabels[0], decision: "yes" }).success).toBe(false);
    expect(HumanLabelSchema.safeParse({ ...rawLabels[0], reason: " " }).success).toBe(false);
    expect(RecommendationSchema.safeParse({ score: 101 }).success).toBe(false);
  });
  it("has a complete disjoint 20/10 split by post ID", () => {
    const development = getPosts("development");
    const test = getPosts("test");
    expect(development).toHaveLength(20);
    expect(test).toHaveLength(10);
    const developmentIds = new Set(development.map((post) => post.id));
    expect(test.every((post) => !developmentIds.has(post.id))).toBe(true);
    expect([...development, ...test].map((post) => post.id).sort()).toEqual(posts.map((post) => post.id).sort());
  });
  it("does not change split assignment when the input order changes", () => {
    expect(validateSplits([...posts].reverse(), splitManifest)).toEqual(splitManifest);
  });
  it("rejects overlap, duplicated IDs, unknown IDs, and missing membership", () => {
    expect(() => validateSplits(posts, { ...splitManifest, test: [...splitManifest.test, "post-01"] })).toThrow("overlapping");
    expect(() => validateSplits(posts, { ...splitManifest, development: [...splitManifest.development, "post-01"] })).toThrow("overlapping");
    expect(() => validateSplits(posts, { ...splitManifest, test: [...splitManifest.test, "unknown"] })).toThrow("Unknown");
    expect(() => validateSplits(posts, { ...splitManifest, development: splitManifest.development.slice(1) })).toThrow("exactly one split");
    expect(() => validateSplits([...posts, posts[0]], splitManifest)).toThrow("Duplicate post ID");
  });
  it("keeps repetitive families together and rejects a cross-split family", () => {
    const moved = { development: splitManifest.development.filter((id) => id !== "post-13"), test: [...splitManifest.test, "post-13"] };
    expect(() => validateSplits(posts, moved)).toThrow("Repetitive family crosses splits");
    for (const post of posts.filter((post) => post.repetitiveOf)) {
      const split = splitManifest.development.includes(post.id) ? "development" : "test";
      expect(splitManifest[split]).toContain(post.repetitiveOf);
    }
  });
  it("rejects missing or cyclic repetition roots", () => {
    expect(() => validateSplits(posts.map((p) => p.id === "post-13" ? { ...p, repetitiveOf: "unknown" } : p), splitManifest)).toThrow("Invalid repetitiveOf root");
    expect(() => validateSplits(posts.map((p) => p.id === "post-12" ? { ...p, repetitiveOf: "post-13" } : p), splitManifest)).toThrow("Invalid repetitiveOf root");
  });
});
