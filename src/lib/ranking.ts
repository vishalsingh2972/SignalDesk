import { z } from "zod";
import { BrandProfileSchema, RecommendationSchema, SocialPostSchema } from "./schemas";
import type { BrandProfile, Decision, Recommendation, RiskFlag, SocialPost } from "./types";

export const RANKING_VERSION = "rules-v2.0.0";
export const WEIGHTS = Object.freeze({ topic: 25, maxTopics: 2, help: 20, discussion: 10,
  recent: 20, older: 10, announcement: -20, repetitive: -25, recommend: 60, review: 25 });

const HELP = ["how do", "how can", "looking for", "any advice", "recommend", "struggling"];
const DISCUSSION = ["benchmark", "benchmark notes", "architecture", "implementation", "debugging", "latency", "redaction", "tradeoffs"];
const OPT_OUT = ["do not contact me", "no vendor replies", "no promotion"];
const CONTROVERSY = ["unverified", "alleged", "breach", "leaked", "controversy"];
const AMBIGUITY = ["maybe", "not sure", "do not need", "no longer need"];
const ANNOUNCEMENT = ["launching", "we shipped", "product announcement"];

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function hasPhrase(text: string, phrase: string): boolean {
  const normalized = normalize(phrase);
  return normalized.length > 0 && ` ${text} `.includes(` ${normalized} `);
}

function matchesAny(text: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => hasPhrase(text, phrase));
}

/** Pure rules: no fixture IDs, split assignments, labels, network, or wall-clock reads. */
export function scorePost(brandInput: BrandProfile, postInput: SocialPost, referenceTime: string): Recommendation {
  const brand = BrandProfileSchema.parse(brandInput);
  const post = SocialPostSchema.parse(postInput);
  const now = Date.parse(z.iso.datetime().parse(referenceTime));
  const text = normalize(post.text);
  const matchedTopics = brand.topics.filter((topic) => matchesAny(text, topic.phrases)).map((topic) => topic.id);
  const relevant = matchedTopics.length > 0;
  const ageDays = (now - Date.parse(post.publishedAt)) / 86_400_000;
  const exclusions: string[] = [];
  const riskFlags: RiskFlag[] = [];
  const reasons: Recommendation["reasons"] = [];
  const add = (rule: string, points: number, detail: string) => reasons.push({ rule, points, detail });

  if (!text) exclusions.push("empty_text");
  if (matchesAny(text, OPT_OUT)) exclusions.push("author_opt_out");
  for (const phrase of brand.exclusionPhrases) {
    if (hasPhrase(text, phrase)) exclusions.push(`brand_exclusion:${phrase}`);
  }
  if (!relevant) exclusions.push("no_topic_match");

  add("topics", Math.min(matchedTopics.length, WEIGHTS.maxTopics) * WEIGHTS.topic,
    relevant ? `Matched topics: ${matchedTopics.join(", ")}` : "No topic matches; auxiliary points are gated off.");
  add("help_request", relevant && matchesAny(text, HELP) ? WEIGHTS.help : 0, "Help-request phrase check (+20 only with topic relevance).");
  add("technical_discussion", relevant && matchesAny(text, DISCUSSION) ? WEIGHTS.discussion : 0, "Technical-discussion phrase check (+10 only with topic relevance).");
  const recency = ageDays >= 0 && ageDays <= 7 ? WEIGHTS.recent : ageDays > 7 && ageDays <= 30 ? WEIGHTS.older : 0;
  add("recency", relevant ? recency : 0, "Age 0–7 days: +20; >7–30: +10; otherwise +0; requires topic relevance.");

  if (relevant && matchesAny(text, CONTROVERSY)) riskFlags.push("security_controversy");
  if (relevant && matchesAny(text, AMBIGUITY)) riskFlags.push("ambiguous_intent");
  if (ageDays < 0) riskFlags.push("future_timestamp");
  if (relevant && matchesAny(text, ANNOUNCEMENT)) {
    riskFlags.push("product_announcement");
    add("announcement_penalty", WEIGHTS.announcement, "Announcement may offer little opportunity to help.");
  }
  if (relevant && post.repetitiveOf) {
    riskFlags.push("repetitive");
    add("repetition_penalty", WEIGHTS.repetitive, `Marked as a repeat of ${post.repetitiveOf}; inspect context before engaging.`);
  }

  const rawScore = reasons.reduce((sum, reason) => sum + reason.points, 0);
  const score = Math.max(0, Math.min(100, rawScore));
  if (rawScore !== score) add("score_clamp", score - rawScore, "Keep the rule score between 0 and 100.");
  const decision: Decision = exclusions.length > 0 ? "skip"
    : riskFlags.length > 0 ? "review"
    : score >= WEIGHTS.recommend ? "recommend"
    : score >= WEIGHTS.review ? "review" : "skip";
  add("decision", 0, `Decision ${decision}: exclusions override risks; risks override thresholds (recommend >=60, review >=25).`);

  return RecommendationSchema.parse({ brandId: brand.id, postId: post.id, decision, score,
    matchedTopics, reasons, exclusions, riskFlags, rankingVersion: RANKING_VERSION, referenceTime });
}

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Descending score, then code-point ID order; independent of locale and input order. */
export function rankPosts(brand: BrandProfile, posts: readonly SocialPost[], referenceTime: string): Recommendation[] {
  if (new Set(posts.map((post) => post.id)).size !== posts.length) throw new Error("Duplicate post ID");
  return posts.map((post) => scorePost(brand, post, referenceTime))
    .sort((a, b) => b.score - a.score || compareIds(a.postId, b.postId));
}
