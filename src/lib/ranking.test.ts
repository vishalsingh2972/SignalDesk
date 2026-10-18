import { describe, expect, it } from "vitest";
import { rankConversations } from "./ranking";
import { company, conversations, referenceTime } from "../data/sample";
import type { Conversation } from "./types";

const example = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: "a", author: "Test", source: "synthetic", text: "How do I debug an API?",
  publishedAt: referenceTime, ...overrides,
});
const score = (item: Conversation) => rankConversations([item], company, referenceTime)[0];

describe("baseline ranking", () => {
  it("ranks the seeded examples with a reproducible breakdown", () => {
    const result = rankConversations(conversations, company, referenceTime);
    expect(result.map((item) => item.score)).toEqual([100, 80, 40, 40, 30, 0]);
    expect(result[0].conversation.id).toBe("sample-01");
    for (const item of result) expect(item.score).toBe(item.reasons.reduce((n, reason) => n + reason.points, 0));
  });
  it("does not reward unrelated requests or substring matches", () => {
    expect(score(example({ text: "Looking for capital advice?" })).score).toBe(0);
  });
  it("normalizes case and punctuation and deduplicates topics", () => {
    const result = rankConversations([example({ text: "API!" })], { ...company, topics: ["API", " api ", ""] }, referenceTime);
    expect(result[0].score).toBe(40);
  });
  it.each([[0, 40], [7, 40], [8, 30], [30, 30], [31, 20], [-1, 20]])("handles age %s days", (days, expected) => {
    const publishedAt = new Date(Date.parse(referenceTime) - days * 86_400_000).toISOString();
    expect(score(example({ text: "API", publishedAt })).score).toBe(expected);
  });
  it("gives no recency credit to invalid dates", () => {
    expect(score(example({ text: "API", publishedAt: "invalid" })).score).toBe(20);
  });
  it("rejects an invalid reference clock", () => {
    expect(() => rankConversations([], company, "invalid")).toThrow("Invalid ranking reference time");
  });
  it("breaks ties by ID without mutating inputs", () => {
    const input = Object.freeze([Object.freeze(example({ id: "b" })), Object.freeze(example({ id: "a" }))]);
    expect(rankConversations(input, company, referenceTime).map((r) => r.conversation.id)).toEqual(["a", "b"]);
    expect(input.map((r) => r.id)).toEqual(["b", "a"]);
  });
  it("handles empty input and empty context", () => {
    expect(rankConversations([], company, referenceTime)).toEqual([]);
    expect(rankConversations([example()], { ...company, topics: [] }, referenceTime)[0].score).toBe(0);
  });
  it("caps the score at 100 even with more than three topic matches", () => {
    expect(rankConversations([example({ text: "How do API debugging observability logs work?" })], { ...company, topics: ["api", "debugging", "observability", "logs"] }, referenceTime)[0].score).toBe(100);
  });
});
