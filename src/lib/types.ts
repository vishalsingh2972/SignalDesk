import type { z } from "zod";
import type {
  BrandProfileSchema, SocialPostSchema, RecommendationSchema, HumanLabelSchema,
  DecisionSchema, RiskFlagSchema, SplitSchema, SplitManifestSchema,
} from "./schemas";

// Infer types from runtime contracts so the two cannot drift apart.
export type BrandProfile = z.infer<typeof BrandProfileSchema>;
export type SocialPost = z.infer<typeof SocialPostSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type HumanLabel = z.infer<typeof HumanLabelSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type RiskFlag = z.infer<typeof RiskFlagSchema>;
export type Split = z.infer<typeof SplitSchema>;
export type SplitManifest = z.infer<typeof SplitManifestSchema>;
