import { SplitManifestSchema, SocialPostSchema } from "./schemas";
import type { SocialPost, Split, SplitManifest } from "./types";

/** Validate membership by post ID before any scoring. Labels are not involved. */
export function validateSplits(posts: readonly SocialPost[], input: SplitManifest): SplitManifest {
  const manifest = SplitManifestSchema.parse(input);
  const ids = posts.map((post) => SocialPostSchema.parse(post).id);
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate post ID");
  const membership = new Map<string, Split>();
  for (const split of ["development", "test"] as const) {
    for (const id of manifest[split]) {
      if (!ids.includes(id)) throw new Error(`Unknown split post ID: ${id}`);
      if (membership.has(id)) throw new Error(`Repeated or overlapping split post ID: ${id}`);
      membership.set(id, split);
    }
  }
  if (membership.size !== ids.length) throw new Error("Every post needs exactly one split");
  const byId = new Map(posts.map((post) => [post.id, post]));
  for (const post of posts) {
    if (!post.repetitiveOf) continue;
    const original = byId.get(post.repetitiveOf);
    if (!original || original.id === post.id || original.repetitiveOf) {
      throw new Error(`Invalid repetitiveOf root: ${post.id}`);
    }
    if (membership.get(post.id) !== membership.get(original.id)) {
      throw new Error(`Repetitive family crosses splits: ${post.id}`);
    }
  }
  return manifest;
}

export function selectSplit(posts: readonly SocialPost[], manifest: SplitManifest, split: Split): SocialPost[] {
  const validated = validateSplits(posts, manifest);
  const wanted = new Set(validated[split]);
  return posts.filter((post) => wanted.has(post.id));
}
