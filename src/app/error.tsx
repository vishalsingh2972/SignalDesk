"use client";

export default function DashboardError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="dashboard-shell">
      <p className="prototype-notice">Day 1 rules-based prototype — synthetic data; no LLM involved.</p>
      <div className="feed-state error-state" role="alert">
        <span className="state-symbol" aria-hidden="true">!</span>
        <h1>SignalDesk couldn’t load</h1>
        <p>The dashboard couldn’t load its sample data. Try again to reload the page.</p>
        <button className="secondary-button" type="button" onClick={() => retry()}>Try again</button>
      </div>
    </main>
  );
}
