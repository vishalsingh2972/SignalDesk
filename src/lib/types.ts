export interface CompanyContext {
  name: string;
  description: string;
  topics: readonly string[];
}

export interface Conversation {
  id: string;
  author: string;
  text: string;
  publishedAt: string;
  source: "synthetic";
}

export interface ScoreReason {
  label: string;
  points: number;
}

export interface RankedConversation {
  conversation: Conversation;
  score: number;
  reasons: ScoreReason[];
}
