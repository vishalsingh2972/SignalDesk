import type { CompanyContext, Conversation } from "../lib/types";

export const referenceTime = "2026-10-19T12:00:00.000Z";

export const company: CompanyContext = {
  name: "TraceKit (fictional)",
  description: "Developer tooling that helps small engineering teams debug APIs and understand application failures.",
  topics: ["api", "debugging", "observability"],
};

export const conversations: readonly Conversation[] = [
  { id: "sample-01", source: "synthetic", author: "Sample founder", publishedAt: "2026-10-18T12:00:00Z", text: "How do small teams approach API debugging and observability without a dedicated platform engineer?" },
  { id: "sample-02", source: "synthetic", author: "Sample engineer", publishedAt: "2026-10-16T12:00:00Z", text: "Looking for advice on debugging intermittent API failures in our staging environment." },
  { id: "sample-03", source: "synthetic", author: "Sample maintainer", publishedAt: "2026-10-05T12:00:00Z", text: "We wrote up our observability lessons after moving to a smaller engineering team." },
  { id: "sample-04", source: "synthetic", author: "Sample developer", publishedAt: "2026-08-01T12:00:00Z", text: "Can anyone recommend an API testing workflow? Our old setup is hard to maintain." },
  { id: "sample-05", source: "synthetic", author: "Sample designer", publishedAt: "2026-10-19T10:00:00Z", text: "Looking for a good coffee grinder for the studio. Any advice?" },
  { id: "sample-06", source: "synthetic", author: "Sample team lead", publishedAt: "2026-10-17T12:00:00Z", text: "We do not need another observability tool. Our current setup works well." },
];
