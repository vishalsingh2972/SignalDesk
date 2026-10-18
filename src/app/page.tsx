import { company, conversations, referenceTime } from "@/data/sample";
import { rankConversations } from "@/lib/ranking";

export default function Home() {
  const ranked = rankConversations(conversations, company, referenceTime);
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-10">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <span className="text-xl font-bold tracking-tight">SignalDesk<span className="text-teal-700">.</span></span>
        <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm text-teal-900">Day 1 · Local baseline</span>
      </header>
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal-800">Conversation discovery</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Find a useful place to contribute.</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">Review conversations ranked by transparent rules. Start with relevance, understand the evidence, and decide whether you can help.</p>
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold">Company context</h2>
          <p className="mt-4 font-semibold">{company.name}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{company.description}</p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Company topics">{company.topics.map((topic) => <li key={topic} className="rounded-md bg-slate-100 px-2 py-1 text-sm">{topic}</li>)}</ul>
          <hr className="my-6 border-slate-200" />
          <h2 className="font-bold">How scoring works</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Topics: up to 60 points. Help request: 20. Recency: up to 20. Help and recency require a topic match.</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">Fixed reference: {referenceTime.slice(0, 10)}, 12:00 UTC. Scores are rule totals, not probabilities.</p>
        </aside>
        <section aria-labelledby="rankings-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 id="rankings-heading" className="text-xl font-bold">Ranked opportunities</h2><span className="text-sm text-slate-600">{ranked.length} synthetic examples</span></div>
          <p className="mb-5 text-sm text-slate-600">All authors and conversations below are fictional. Review manually; keyword matches can miss intent and negation.</p>
          <ol className="space-y-4">
            {ranked.map(({ conversation, score, reasons }, index) => (
              <li key={conversation.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">#{index + 1} · Synthetic sample</p><h3 className="mt-2 font-semibold">{conversation.author}</h3><time className="text-sm text-slate-500" dateTime={conversation.publishedAt}>{conversation.publishedAt.slice(0, 10)}</time></div>
                  <span className="whitespace-nowrap rounded-lg bg-teal-50 px-3 py-2 text-lg font-bold text-teal-900" aria-label={`${score} out of 100 rule points`}>{score}<span className="text-xs font-normal"> / 100</span></span>
                </div>
                <p className="my-4 leading-7">{conversation.text}</p>
                <details className="border-t border-slate-100 pt-3"><summary className="text-sm font-semibold text-teal-800">Why this score?</summary><ul className="mt-3 space-y-2 text-sm text-slate-600">{reasons.map((reason) => <li key={reason.label}><strong className="text-slate-800">+{reason.points}</strong> · {reason.label}</li>)}</ul></details>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <footer className="mt-10 text-sm text-slate-500">Human judgment comes next. No live feeds, generated replies, or posting integrations.</footer>
    </main>
  );
}
