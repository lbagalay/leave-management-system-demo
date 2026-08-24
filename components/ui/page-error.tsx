"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

type PageErrorProps = {
  reset: () => void;
};

export function PageError({ reset }: PageErrorProps) {
  return (
    <div className="dashboard-page error-page">
      <section className="error-panel" role="alert">
        <span className="error-panel-icon"><AlertTriangle size={25} /></span>
        <div>
          <p className="section-kicker">Unable to load workspace</p>
          <h1>Something went wrong</h1>
          <p>We could not load this page. No changes were made. Please try again.</p>
          <button className="secondary-button" type="button" onClick={reset}>
            <RotateCcw size={17} />
            Try again
          </button>
        </div>
      </section>
    </div>
  );
}
