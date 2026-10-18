import type { CompanyContext, Conversation, RankedConversation } from "./types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function containsPhrase(text: string, phrase: string): boolean {
  return (` ${text} `).includes(` ${phrase} `);
}

/** Baseline v1: pure, clock-independent, and intentionally lexical. */
export function rankConversations(
  conversations: readonly Conversation[],
  company: CompanyContext,
  referenceTime: string,
): RankedConversation[] {
  const now = Date.parse(referenceTime);
  if (!Number.isFinite(now)) throw new Error("Invalid ranking reference time");
  const topics = [...new Set(company.topics.map(normalize).filter(Boolean))];

  return conversations.map((conversation) => {
    const text = normalize(conversation.text);
    const matches = topics.filter((topic) => containsPhrase(text, topic));
    const relevant = matches.length > 0;
    const asksForHelp = ["how do", "how can", "looking for", "recommend", "any advice", "struggling"].some(
      (phrase) => containsPhrase(text, phrase),
    );
    const ageDays = (now - Date.parse(conversation.publishedAt)) / 86_400_000;
    const recency = Number.isFinite(ageDays) && ageDays >= 0
      ? ageDays <= 7 ? 20 : ageDays <= 30 ? 10 : 0
      : 0;
    const reasons = [
      { label: relevant ? `Topic matches: ${matches.join(", ")}` : "No matching company topics", points: Math.min(matches.length, 3) * 20 },
      { label: relevant && asksForHelp ? "Explicit help or recommendation request" : "No relevant help-request signal", points: relevant && asksForHelp ? 20 : 0 },
      { label: relevant ? "Recency: 0–7 days +20; 8–30 days +10; otherwise +0" : "Recency excluded without topic relevance", points: relevant ? recency : 0 },
    ];
    return { conversation, score: reasons.reduce((sum, reason) => sum + reason.points, 0), reasons };
  }).sort((a, b) => b.score - a.score || (a.conversation.id < b.conversation.id ? -1 : a.conversation.id > b.conversation.id ? 1 : 0));
}
