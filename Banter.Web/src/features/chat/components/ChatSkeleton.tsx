export function ChatSkeleton() {
  return (
    <div className="chat-skeleton" role="status" aria-label="Loading messages">
      <div className="chat-skeleton__status mono">
        <span className="chat-skeleton__signal" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        opening channel
      </div>
      {Array.from({ length: 6 }).map((_, index) => (
        <div className={`chat-skeleton__row ${index % 3 === 2 ? 'is-own' : ''}`.trim()} key={index}>
          <span className="chat-skeleton__avatar" />
          <span className="chat-skeleton__body">
            <span className="chat-skeleton__line chat-skeleton__line--short" />
            <span className="chat-skeleton__line" />
            <span className="chat-skeleton__line" />
          </span>
        </div>
      ))}
    </div>
  );
}
