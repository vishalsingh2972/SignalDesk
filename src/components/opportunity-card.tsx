import type { Opportunity } from "../lib/opportunity-feed";
import type { Decision, RiskFlag } from "../lib/types";

export const decisionLabels: Record<Decision, string> = {
  recommend: "Recommend", review: "Review", skip: "Skip",
};

const riskLabels: Record<RiskFlag, string> = {
  security_controversy: "Security controversy",
  ambiguous_intent: "Ambiguous intent",
  product_announcement: "Product announcement",
  repetitive: "Repetitive post",
  future_timestamp: "Future timestamp",
};

export function topicLabel(topic: string): string {
  return topic.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bAi\b/g, "AI");
}

function exclusionLabel(exclusion: string): string {
  if (exclusion.startsWith("brand_exclusion:")) return `Excluded topic: ${exclusion.slice("brand_exclusion:".length)}`;
  const labels: Record<string, string> = {
    author_opt_out: "Author requested no contact or promotion",
    no_topic_match: "No priority topic match",
    empty_text: "No readable post text",
  };
  return labels[exclusion] ?? exclusion;
}

export default function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const { post, recommendation, rank } = opportunity;
  const name = post.author.replace(/^fictional_/, "").replaceAll("_", " ");
  const initials = name.split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const summary = recommendation.exclusions.length > 0
    ? "An exclusion rule takes precedence over the heuristic score."
    : recommendation.riskFlags.length > 0
      ? "Risk flags require human review, regardless of the heuristic score."
      : recommendation.decision === "recommend"
        ? "Topic relevance and supporting signals meet the recommendation threshold."
        : recommendation.decision === "review"
          ? "Some relevance signals are present; assess whether you can contribute."
          : "The supporting signals fall below the current review threshold.";

  return (
    <article className="opportunity-card" aria-labelledby={`title-${post.id}`} data-post-id={post.id} data-decision={recommendation.decision}>
      <div className="post-card-heading">
        <div className="author-block">
          <span className="author-avatar" aria-hidden="true">{initials}</span>
          <div className="author-copy">
            <h3 id={`title-${post.id}`} className="author-name">{name}</h3>
            <p className="author-handle">@{post.author}</p>
          </div>
        </div>
        <span className={`decision-badge decision-${recommendation.decision}`}>
          <span className="decision-dot" aria-hidden="true" />
          {decisionLabels[recommendation.decision]}
        </span>
      </div>

      <div className="post-provenance">
        <span>Fictional author</span><span aria-hidden="true">·</span>
        <time dateTime={post.publishedAt}>{post.publishedAt.slice(0, 10)}</time>
        <span aria-hidden="true">·</span><span>X-style sample</span>
      </div>
      <p className="post-text">{post.text.trim() || "[Empty sample post]"}</p>

      <div className="engagement-row">
        <span className="engagement-label">Synthetic engagement</span>
        <span className="engagement-category">{post.syntheticEngagement}</span>
        <span className="engagement-note">Illustrative category · not measured</span>
      </div>

      <div className="ranking-panel">
        <div className="score-row">
          <div>
            <p className="field-label">Heuristic score</p>
            <p className="score-value">{recommendation.score}<span> / 100</span></p>
          </div>
          <div className="score-explainer">
            <p className="ranking-summary">{summary}</p>
            <p className="score-note">Rule points, not a probability</p>
          </div>
        </div>
        <div className="evidence-group">
          <p className="field-label">Matched topics</p>
          {recommendation.matchedTopics.length > 0
            ? <ul className="chip-list" aria-label="Matched topics">{recommendation.matchedTopics.map((topic) => <li className="topic-chip" key={topic}>{topicLabel(topic)}</li>)}</ul>
            : <p className="muted-copy">No priority topic matches</p>}
        </div>
        <div className="evidence-group">
          <p className="field-label">Risk flags</p>
          {recommendation.riskFlags.length > 0
            ? <ul className="chip-list" aria-label="Risk flags">{recommendation.riskFlags.map((flag) => <li className="risk-chip" key={flag}>{riskLabels[flag]}</li>)}</ul>
            : <p className="muted-copy">None detected by the rules</p>}
        </div>
        {recommendation.exclusions.length > 0 && <div className="exclusions-block">
          <p className="field-label">Exclusions</p>
          <ul>{recommendation.exclusions.map((exclusion) => <li key={exclusion}>{exclusionLabel(exclusion)}</li>)}</ul>
        </div>}
      </div>

      <details className="ranking-details">
        <summary><span>Why this ranking?</span><span className="details-hint">Score breakdown <span aria-hidden="true">+</span></span></summary>
        <ul className="reason-list">
          {recommendation.reasons.map((reason) => <li key={reason.rule}>
            <span className={reason.points < 0 ? "reason-points negative-points" : "reason-points"}>{reason.points > 0 ? "+" : ""}{reason.points}</span>
            <p>{reason.detail}</p>
          </li>)}
        </ul>
      </details>
      <div className="post-card-footer"><span>Raw score rank #{rank} · {post.id}</span><span>{recommendation.rankingVersion}</span></div>
    </article>
  );
}
