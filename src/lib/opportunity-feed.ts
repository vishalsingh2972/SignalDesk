import { rankPosts } from "./ranking";
import type { BrandProfile, Decision, Recommendation, SocialPost } from "./types";

export type DecisionFilter = "all" | Decision;
export type OpportunitySort = "priority" | "score";
export interface Opportunity {
  post: SocialPost;
  recommendation: Recommendation;
  rank: number;
}
export type OpportunityFeed =
  | { status: "ready"; opportunities: Opportunity[] }
  | { status: "error"; message: string };

/** Presentation adapter only: preserve the scorer's ordering, decisions, and evidence. */
export function buildOpportunityFeed(
  brand: BrandProfile | undefined,
  posts: readonly SocialPost[],
  referenceTime: string,
): OpportunityFeed {
  if (!brand) return { status: "error", message: "No company context is available. Reload the page to try again." };
  try {
    const byId = new Map(posts.map((post) => [post.id, post]));
    const opportunities = rankPosts(brand, posts, referenceTime).map((recommendation, index) => {
      const post = byId.get(recommendation.postId);
      if (!post) throw new Error("Ranked post is missing from the feed");
      return { post, recommendation, rank: index + 1 };
    });
    return { status: "ready", opportunities };
  } catch {
    return { status: "error", message: "We couldn’t rank these conversations. The company context or sample data may be invalid. Choose another company or reload to try again." };
  }
}

export function filterOpportunities(opportunities: readonly Opportunity[], filter: DecisionFilter): Opportunity[] {
  return opportunities.filter(({ recommendation }) => filter === "all" || recommendation.decision === filter);
}

const decisionPriority: Record<Decision, number> = { recommend: 0, review: 1, skip: 2 };

/** Presentation order only; scores, decisions, evidence, and raw score ranks stay intact. */
export function sortOpportunities(opportunities: readonly Opportunity[], mode: OpportunitySort): Opportunity[] {
  return [...opportunities].sort((a, b) => {
    const group = mode === "priority"
      ? decisionPriority[a.recommendation.decision] - decisionPriority[b.recommendation.decision]
      : 0;
    const score = b.recommendation.score - a.recommendation.score;
    const aId = a.recommendation.postId;
    const bId = b.recommendation.postId;
    return group || score || (aId < bId ? -1 : aId > bId ? 1 : 0);
  });
}
