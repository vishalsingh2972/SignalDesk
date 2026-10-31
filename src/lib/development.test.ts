import { expect, it } from "vitest";
import { brands, getPosts, referenceTime, splitManifest } from "../data/sample";
import { rankPosts } from "./ranking";
import { RecommendationSchema } from "./schemas";

it("runs every development pair without importing annotations or scoring held-out posts", () => {
  const development = getPosts("development");
  const results = brands.flatMap((brand) => rankPosts(brand, development, referenceTime));
  expect(results).toHaveLength(40);
  for (const result of results) {
    expect(splitManifest.development).toContain(result.postId);
    expect(splitManifest.test).not.toContain(result.postId);
    expect(RecommendationSchema.safeParse(result).success).toBe(true);
    expect(result.score).toBe(result.reasons.reduce((total, reason) => total + reason.points, 0));
  }
  if (process.env.SIGNALDESK_PRINT_DEV === "1") {
    console.table(results.map(({ brandId, postId, decision, score }) => ({ brandId, postId, decision, score })));
    const examples = results.filter((result) => result.postId === "post-01" || (result.brandId === "securestack" && result.postId === "post-09"));
    console.log("Three actual development outputs (not quality metrics):\n" + JSON.stringify(examples, null, 2));
  }
});
