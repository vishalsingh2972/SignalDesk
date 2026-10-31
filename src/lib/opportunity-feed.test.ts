import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Dashboard from "../components/dashboard";
import { brands, getPosts, referenceTime, splitManifest } from "../data/sample";
import { buildOpportunityFeed, filterOpportunities, sortOpportunities } from "./opportunity-feed";
import type { DecisionFilter, OpportunitySort } from "./opportunity-feed";

const development = getPosts("development");

describe("dashboard data and filters", () => {
  it("changes the same post's result for the selected brand, using real scorer output", () => {
    const voice = buildOpportunityFeed(brands[0], development, referenceTime);
    const security = buildOpportunityFeed(brands[1], development, referenceTime);
    expect(voice.status).toBe("ready");
    expect(security.status).toBe("ready");
    if (voice.status !== "ready" || security.status !== "ready") throw new Error("Expected ready feeds");
    expect(voice.opportunities.find((item) => item.post.id === "post-01")?.recommendation)
      .toMatchObject({ brandId: "voicestack-ai", score: 100, decision: "recommend" });
    expect(security.opportunities.find((item) => item.post.id === "post-01")?.recommendation)
      .toMatchObject({ brandId: "securestack", score: 0, decision: "skip" });
  });

  for (const brand of brands) {
    it.each<DecisionFilter>(["all", "recommend", "review", "skip"])(`${brand.name}: filters %s without changing ranking order or evidence`, (filter) => {
      const feed = buildOpportunityFeed(brand, development, referenceTime);
      if (feed.status !== "ready") throw new Error("Expected a ready feed");
      const filtered = filterOpportunities(feed.opportunities, filter);
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((item) => filter === "all" || item.recommendation.decision === filter)).toBe(true);
      expect(filtered.map((item) => item.rank)).toEqual(filtered.map((item) => item.rank).sort((a, b) => a - b));
      expect(filtered.every((item) => item.recommendation.brandId === brand.id)).toBe(true);
      expect(filtered.every((item) => item.post.id === item.recommendation.postId)).toBe(true);
      expect(filtered.every((item) => !splitManifest.test.includes(item.post.id))).toBe(true);
      if (filter === "all") expect(filtered).toHaveLength(20);
    });
  }

  it("renders an empty source state without inventing opportunities", () => {
    expect(buildOpportunityFeed(brands[0], [], referenceTime)).toEqual({ status: "ready", opportunities: [] });
    const html = renderToStaticMarkup(createElement(Dashboard, { brands, posts: [], referenceTime }));
    expect(html).toContain("No conversations loaded");
    expect(html).toContain("Showing 0 of 0 conversations");
    expect(html).not.toContain('data-post-id=');
  });

  it("returns an empty filtered list when no decisions match", () => {
    const feed = buildOpportunityFeed(brands[0], [development[0]], referenceTime);
    if (feed.status !== "ready") throw new Error("Expected a ready feed");
    expect(filterOpportunities(feed.opportunities, "review")).toEqual([]);
    expect(filterOpportunities(feed.opportunities, "all")).toHaveLength(1);
  });

  it("renders a recoverable error for invalid posts and duplicate IDs", () => {
    const invalid = [{ ...development[0], publishedAt: "invalid" }];
    expect(buildOpportunityFeed(brands[0], invalid, referenceTime).status).toBe("error");
    expect(buildOpportunityFeed(brands[0], [development[0], development[0]], referenceTime).status).toBe("error");
    const html = renderToStaticMarkup(createElement(Dashboard, { brands, posts: invalid, referenceTime }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Rankings are unavailable");
    expect(html).toContain("Reload dashboard");
    expect(html).not.toContain('data-post-id=');
  });

  it("handles missing company context without crashing", () => {
    const html = renderToStaticMarkup(createElement(Dashboard, { brands: [], posts: development, referenceTime }));
    expect(html).toContain("No companies available");
    expect(html).toContain("Rankings are unavailable");
  });

  it("labels scores and synthetic engagement honestly in the rendered cards", () => {
    const html = renderToStaticMarkup(createElement(Dashboard, { brands, posts: [development[0]], referenceTime }));
    expect(html).toContain("Day 1 rules-based prototype — synthetic data; no LLM involved.");
    expect(html).toContain("Heuristic score");
    expect(html).toContain("Synthetic engagement");
    expect(html).toContain("Illustrative category · not measured");
    expect(html).toContain("Rule points, not a probability");
  });
});

describe("presentation sort modes (scoring semantics stay unchanged)", () => {
  for (const brand of brands) {
    it.each<OpportunitySort>(["priority", "score"])(`${brand.name}: sorts by %s without mutating score evidence`, (mode) => {
      const feed = buildOpportunityFeed(brand, development, referenceTime);
      if (feed.status !== "ready") throw new Error("Expected a ready feed");
      const input = Object.freeze([...feed.opportunities].reverse());
      const before = JSON.stringify(input);
      const sorted = sortOpportunities(input, mode);
      expect(JSON.stringify(input)).toBe(before);
      expect(sorted).toHaveLength(20);
      expect(sorted.map((item) => item.post.id).sort()).toEqual(input.map((item) => item.post.id).sort());
      for (const item of sorted) expect(item).toBe(input.find((original) => original.post.id === item.post.id));
      expect(sortOpportunities(sorted, mode)).toEqual(sorted);
      if (mode === "score") {
        expect(sorted).toEqual(feed.opportunities);
      } else {
        const groups = [...new Set(sorted.map((item) => item.recommendation.decision))];
        expect(groups).toEqual(["recommend", "review", "skip"]);
        for (const decision of groups) {
          const scores = sorted.filter((item) => item.recommendation.decision === decision).map((item) => item.recommendation.score);
          expect(scores).toEqual([...scores].sort((a, b) => b - a));
        }
      }
    });
  }

  it("moves the excluded score-55 post below review candidates only in priority mode", () => {
    const feed = buildOpportunityFeed(brands[0], development, referenceTime);
    if (feed.status !== "ready") throw new Error("Expected a ready feed");
    const excluded = feed.opportunities.find((item) => item.post.id === "post-10");
    const review = feed.opportunities.find((item) => item.post.id === "post-08");
    expect(excluded?.recommendation).toMatchObject({ score: 55, decision: "skip", exclusions: ["author_opt_out"] });
    expect(review?.recommendation).toMatchObject({ score: 45, decision: "review" });
    const raw = sortOpportunities(feed.opportunities, "score");
    const priority = sortOpportunities(feed.opportunities, "priority");
    expect(raw.indexOf(excluded!)).toBeLessThan(raw.indexOf(review!));
    expect(priority.indexOf(excluded!)).toBeGreaterThan(priority.indexOf(review!));
  });

  it("breaks equal-score ties by ID independently of source order", () => {
    const feed = buildOpportunityFeed(brands[0], development, referenceTime);
    if (feed.status !== "ready") throw new Error("Expected a ready feed");
    const ties = feed.opportunities.filter((item) => item.recommendation.score === 0);
    const expectedIds = ties.map((item) => item.post.id).sort();
    for (const mode of ["priority", "score"] as const) {
      expect(sortOpportunities([...ties].reverse(), mode).map((item) => item.post.id)).toEqual(expectedIds);
    }
  });

  it("keeps decision filters correct in both sort modes", () => {
    for (const brand of brands) {
      const feed = buildOpportunityFeed(brand, development, referenceTime);
      if (feed.status !== "ready") throw new Error("Expected a ready feed");
      for (const mode of ["priority", "score"] as const) {
        const sorted = sortOpportunities(feed.opportunities, mode);
        for (const filter of ["all", "recommend", "review", "skip"] as const) {
          const filtered = filterOpportunities(sorted, filter);
          expect(filtered.every((item) => filter === "all" || item.recommendation.decision === filter)).toBe(true);
          const indices = filtered.map((item) => sorted.indexOf(item));
          expect(indices).toEqual([...indices].sort((a, b) => a - b));
        }
      }
    }
  });

  it("handles an empty list in either sort mode", () => {
    expect(sortOpportunities([], "priority")).toEqual([]);
    expect(sortOpportunities([], "score")).toEqual([]);
  });

  it("renders a clearly labeled priority default and raw-rank labels", () => {
    const html = renderToStaticMarkup(createElement(Dashboard, { brands, posts: development, referenceTime }));
    expect(html).toContain('<option value="priority" selected="">Opportunity priority</option>');
    expect(html).toContain("Raw heuristic score");
    expect(html).toContain("Raw score rank #");
    const postIds = [...html.matchAll(/data-post-id="([^"]+)"/g)].map((match) => match[1]);
    expect(postIds.indexOf("post-10")).toBeGreaterThan(postIds.indexOf("post-08"));
  });
});
