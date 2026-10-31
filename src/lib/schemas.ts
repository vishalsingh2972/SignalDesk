import { z } from "zod";

const nonempty = z.string().trim().min(1);
export const DecisionSchema = z.enum(["recommend", "skip", "review"]);
export const SplitSchema = z.enum(["development", "test"]);

export const BrandProfileSchema = z.strictObject({
  id: nonempty,
  name: nonempty,
  fictional: z.literal(true),
  description: nonempty,
  audience: nonempty,
  topics: z.array(z.strictObject({
    id: nonempty,
    phrases: z.array(nonempty).min(1),
  })).min(1).refine((topics) => new Set(topics.map((topic) => topic.id)).size === topics.length, "Topic IDs must be unique"),
  exclusionPhrases: z.array(nonempty),
});

export const SocialPostSchema = z.strictObject({
  id: nonempty,
  platform: z.literal("x-style"),
  provenance: z.literal("synthetic"),
  author: z.string().regex(/^fictional_/),
  text: z.string().max(280), // Empty input is valid data; the scorer must skip it.
  publishedAt: z.iso.datetime(),
  syntheticEngagement: z.enum(["low", "medium", "viral"]),
  scenarioTags: z.array(nonempty).min(1), // Fixture documentation, never scoring signals.
  repetitiveOf: nonempty.optional(), // Observable metadata supplied by ingestion, not a label.
});

export const RiskFlagSchema = z.enum([
  "security_controversy", "ambiguous_intent", "product_announcement",
  "repetitive", "future_timestamp",
]);

export const RecommendationSchema = z.strictObject({
  brandId: nonempty,
  postId: nonempty,
  decision: DecisionSchema,
  score: z.number().int().min(0).max(100),
  matchedTopics: z.array(nonempty),
  reasons: z.array(z.strictObject({ rule: nonempty, points: z.number().int(), detail: nonempty })).min(1),
  exclusions: z.array(nonempty),
  riskFlags: z.array(RiskFlagSchema),
  rankingVersion: nonempty,
  referenceTime: z.iso.datetime(),
});

export const HumanLabelSchema = z.strictObject({
  brandId: nonempty,
  postId: nonempty,
  decision: DecisionSchema,
  reason: nonempty,
  annotationStatus: z.enum(["proposed", "reviewed"]),
});

export const SplitManifestSchema = z.strictObject({
  development: z.array(nonempty),
  test: z.array(nonempty),
});
