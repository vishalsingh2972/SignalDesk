import { z } from "zod";
import rawBrands from "./brands.json";
import rawPosts from "./posts.json";
import rawManifest from "./split-manifest.json";
import { BrandProfileSchema, SocialPostSchema } from "../lib/schemas";
import { selectSplit, validateSplits } from "../lib/splits";
import type { Split } from "../lib/types";

export const referenceTime = "2026-10-27T12:00:00.000Z";
export const brands = z.array(BrandProfileSchema).length(2).parse(rawBrands);
export const posts = z.array(SocialPostSchema).length(30).parse(rawPosts);
export const splitManifest = validateSplits(posts, rawManifest);

export function getPosts(split: Split) {
  return selectSplit(posts, splitManifest, split);
}
