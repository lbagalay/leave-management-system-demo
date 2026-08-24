export function PageLoading() {
  return (
    <div className="dashboard-page loading-page" aria-busy="true" aria-label="Loading workspace">
      <div className="skeleton-line skeleton-kicker" />
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-subtitle" />
      <div className="skeleton-panel" />
      <div className="skeleton-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="skeleton-card" key={index} />
        ))}
      </div>
      <span className="sr-only">Loading your leave management workspace…</span>
    </div>
  );
}
