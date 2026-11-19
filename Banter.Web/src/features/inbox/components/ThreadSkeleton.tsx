export function ThreadSkeleton() {
  return (
    <div className="welcome-thread welcome-thread--skeleton" aria-hidden="true">
      <span className="welcome-thread__skeleton-line welcome-thread__skeleton-line--name" />
      <span className="welcome-thread__skeleton-line welcome-thread__skeleton-line--meta" />
      <span className="welcome-thread__skeleton-line" />
      <span className="welcome-thread__skeleton-line welcome-thread__skeleton-line--short" />
    </div>
  );
}
