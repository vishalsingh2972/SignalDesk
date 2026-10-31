"use client";

import { useMemo, useState } from "react";
import { buildOpportunityFeed, filterOpportunities, sortOpportunities } from "../lib/opportunity-feed";
import type { DecisionFilter, OpportunitySort } from "../lib/opportunity-feed";
import type { BrandProfile, SocialPost } from "../lib/types";
import OpportunityCard, { decisionLabels, topicLabel } from "./opportunity-card";

interface DashboardProps {
  brands: BrandProfile[];
  posts: SocialPost[];
  referenceTime: string;
}

const filters: DecisionFilter[] = ["all", "recommend", "review", "skip"];

export default function Dashboard({ brands, posts, referenceTime }: DashboardProps) {
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id ?? "");
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("all");
  const [sortMode, setSortMode] = useState<OpportunitySort>("priority");
  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId);
  const feed = useMemo(
    () => buildOpportunityFeed(selectedBrand, posts, referenceTime),
    [selectedBrand, posts, referenceTime],
  );
  const opportunities = feed.status === "ready" ? feed.opportunities : [];
  const visible = filterOpportunities(sortOpportunities(opportunities, sortMode), decisionFilter);
  const counts = {
    all: opportunities.length,
    recommend: opportunities.filter(({ recommendation }) => recommendation.decision === "recommend").length,
    review: opportunities.filter(({ recommendation }) => recommendation.decision === "review").length,
    skip: opportunities.filter(({ recommendation }) => recommendation.decision === "skip").length,
  };

  return (
    <>
      <a className="skip-link" href="#opportunity-feed">Skip to opportunities</a>
      <header className="app-header">
        <div className="header-inner">
          <div className="wordmark"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>SignalDesk<span className="wordmark-dot">.</span></div>
          <span className="header-divider" aria-hidden="true" />
          <span className="header-section">Conversation workspace</span>
          <span className="local-label">Local prototype</span>
        </div>
      </header>

      <main className="dashboard-shell">
        <p className="prototype-notice">Day 1 rules-based prototype — synthetic data; no LLM involved.</p>
        <div className="page-intro">
          <p className="eyebrow">Opportunity inbox</p>
          <h1>Find conversations worth joining.</h1>
          <p>Start with relevance. Understand the context. Decide where you can help.</p>
        </div>

        <div className="dashboard-grid">
          <aside className="context-column" aria-label="Company context and ranking guide">
            <section className="context-card" aria-labelledby="context-heading">
              <div className="context-heading-row"><h2 id="context-heading">Client context</h2><span className="sample-label">Fictional</span></div>
              <label className="field-label selector-label" htmlFor="company-selector">Selected company</label>
              <select id="company-selector" value={selectedBrandId} disabled={brands.length === 0} onChange={(event) => setSelectedBrandId(event.target.value)}>
                {brands.length === 0 && <option value="">No companies available</option>}
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
              {selectedBrand ? <div className="context-fields" key={selectedBrand.id}>
                <div><h3 className="field-label">Company positioning</h3><p>{selectedBrand.description}</p></div>
                <div><h3 className="field-label">Target audience</h3><p>{selectedBrand.audience}</p></div>
                <div><h3 className="field-label">Priority topics</h3><ul className="chip-list">{selectedBrand.topics.map((topic) => <li className="topic-chip" key={topic.id}>{topicLabel(topic.id)}</li>)}</ul></div>
                <div><h3 className="field-label">Excluded topics</h3>{selectedBrand.exclusionPhrases.length > 0
                  ? <ul className="excluded-topics">{selectedBrand.exclusionPhrases.map((phrase) => <li key={phrase}>{phrase}</li>)}</ul>
                  : <p>No company-specific exclusions.</p>}</div>
              </div> : <p className="muted-copy">Company details are unavailable.</p>}
            </section>

            <section className="scoring-guide" aria-labelledby="scoring-heading">
              <h2 id="scoring-heading">A score is a starting point.</h2>
              <p>Topic matches, useful discussion signals, and recency contribute rule points. Popularity adds no points.</p>
              <p>Exclusions force Skip. Risk flags require Review. Always read the evidence before engaging.</p>
              <div className="reference-date"><span className="field-label">Fixed scoring reference</span><time dateTime={referenceTime}>{referenceTime.slice(0, 10)} · 12:00 UTC</time></div>
            </section>
          </aside>

          <section className="feed-column" id="opportunity-feed" aria-labelledby="feed-heading" tabIndex={-1}>
            <div className="feed-heading-row"><div><p className="eyebrow">Ranked for {selectedBrand?.name ?? "your company"}</p><h2 id="feed-heading">Opportunity feed</h2></div><span className="dataset-label">Development samples</span></div>
            <div className="decision-filters" role="group" aria-label="Filter by recommendation decision">
              {filters.map((filter) => <button key={filter} type="button" aria-pressed={decisionFilter === filter} disabled={feed.status === "error"}
                className={`filter-button ${decisionFilter === filter ? "filter-active" : ""}`} onClick={() => setDecisionFilter(filter)}>
                {filter === "all" ? "All" : decisionLabels[filter]}<span className="filter-count">{counts[filter]}</span>
              </button>)}
            </div>
            <div className="feed-status-row">
              <p role="status" aria-live="polite">{feed.status === "error" ? "Rankings unavailable" : `Showing ${visible.length} of ${opportunities.length} conversations`}</p>
              <div className="sort-control"><label htmlFor="opportunity-sort">Sort by</label>
                <select id="opportunity-sort" value={sortMode} disabled={feed.status === "error"} onChange={(event) => {
                  const mode = event.target.value;
                  if (mode === "priority" || mode === "score") setSortMode(mode);
                }}>
                  <option value="priority">Opportunity priority</option>
                  <option value="score">Raw heuristic score</option>
                </select>
              </div>
            </div>
            <p className="sort-description">{sortMode === "priority"
              ? "Recommend first, then Review, then Skip. Highest heuristic score within each decision."
              : "Highest heuristic score first, regardless of decision. Excluded posts can appear above Review posts."}</p>
            {feed.status === "error" ? <div className="feed-state error-state" role="alert">
              <span className="state-symbol" aria-hidden="true">!</span><h3>Rankings are unavailable</h3><p>{feed.message}</p><button className="secondary-button" type="button" onClick={() => window.location.reload()}>Reload dashboard</button>
            </div> : opportunities.length === 0 ? <div className="feed-state">
              <span className="state-symbol" aria-hidden="true">—</span><h3>No conversations loaded</h3><p>There are no development samples to rank for this company. Add sample posts to start reviewing opportunities.</p>
            </div> : visible.length === 0 ? <div className="feed-state">
              <span className="state-symbol" aria-hidden="true">—</span><h3>No {decisionFilter === "all" ? "matching" : decisionLabels[decisionFilter].toLowerCase()} opportunities</h3><p>No conversations match this decision for {selectedBrand?.name}. Try another filter or company.</p><button className="secondary-button" type="button" onClick={() => setDecisionFilter("all")}>Show all conversations</button>
            </div> : <ol className="opportunity-list">{visible.map((opportunity) => <li key={`${selectedBrandId}/${opportunity.post.id}`}><OpportunityCard opportunity={opportunity} /></li>)}</ol>}
            <p className="feed-footnote">Ranked from seeded development posts. Engagement categories are fictional; scores are not measured outcomes. Final engagement decisions stay with you.</p>
          </section>
        </div>
        <footer className="app-footer"><span>SignalDesk · Make the conversation useful.</span><span>Human review before engagement</span></footer>
      </main>
    </>
  );
}
