import Dashboard from "@/components/dashboard";
import { brands, getPosts, referenceTime } from "@/data/sample";

export default function Home() {
  return <Dashboard brands={brands} posts={getPosts("development")} referenceTime={referenceTime} />;
}
