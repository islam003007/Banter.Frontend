import type { ChatMessage } from '../../../lib/api/contracts';
import { resolveIsBot } from '../../../lib/bots';
import { formatClock, formatLongDate } from '../../../lib/format';
import { BotBadge } from '../../../components/ui/BotBadge';
import { Monogram } from '../../../components/ui/Monogram';
import { isPendingMessage } from '../model/timeline';

export function MessageRow({
  message,
  continuation,
  mine,
}: {
  message: ChatMessage;
  continuation: boolean;
  mine: boolean;
}) {
  const pending = isPendingMessage(message);
  const time = formatClock(message.createdAt);
  const isBot = resolveIsBot(message.isBot, message.displayName);

  if (mine) {
    return (
      <article className={`message message--mine ${continuation ? 'is-continuation' : ''}`.trim()}>
        <div className="message__own-meta mono">
          <span className="message__uplink">
            <span className="message__uplink-wave" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            uplink
          </span>
          {pending && <span className="message__sending">sending</span>}
          <time dateTime={message.createdAt} title={formatLongDate(message.createdAt)}>
            {time}
          </time>
        </div>
        <p className={`message__own-body ${pending ? 'is-pending' : ''}`.trim()}>
          {message.content}
        </p>
      </article>
    );
  }

  return (
    <article
      className={`message message--theirs ${continuation ? 'is-continuation' : ''}`.trim()}
      aria-label={`${message.displayName}${isBot ? ', AI teammate' : ''} at ${time}`}
    >
      <div className="message__avatar">
        {!continuation && (
          <Monogram name={message.displayName} src={message.profilePictureUrl} size="sm" />
        )}
      </div>
      <div className="message__body">
        {!continuation && (
          <header className="message__meta">
            <span className="message__name">{message.displayName}</span>
            {isBot && <BotBadge />}
            <time dateTime={message.createdAt} title={formatLongDate(message.createdAt)}>
              {time}
            </time>
          </header>
        )}
        <p className="message__text">{message.content}</p>
      </div>
    </article>
  );
}
