import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { InboxConversation } from '../../../lib/api/contracts';
import { BOT_ROSTER } from '../../../lib/bots';
import { BotBadge } from '../../../components/ui/BotBadge';
import { Monogram } from '../../../components/ui/Monogram';
import { PrivateWindowNote } from '../../../components/ui/PrivateWindowNote';
import { unreadLabel } from '../model/inboxSummary';

export function OperatorDesk({
  botThreads,
}: {
  botThreads: Map<string, InboxConversation>;
}) {
  return (
    <aside className="welcome__aside" aria-labelledby="welcome-ai-title">
      <div className="welcome__aside-head">
        <p className="mono">AI desk / 03 operators</p>
        <BotBadge />
      </div>
      <h2 id="welcome-ai-title">The operators on the desk.</h2>
      <p className="welcome__aside-copy">
        Ada, Milo and Nova work the AI desk. Each runs a direct channel with a different way of
        thinking.
      </p>

      <ul className="bot-roster" aria-label="AI operators">
        {BOT_ROSTER.map((bot, index) => {
          const botThread = botThreads.get(bot.name.toLowerCase());
          const href = botThread
            ? `/c/${botThread.conversationId}`
            : `/new?with=${encodeURIComponent(bot.name)}`;
          const action = botThread
            ? `Open your channel with ${bot.name}${
                botThread.unreadCount > 0 ? `, ${botThread.unreadCount} unread` : ''
              }`
            : `Find ${bot.name} to start a direct channel`;
          return (
            <li key={bot.name}>
              <Link to={href} className="bot-roster__item" aria-label={action} title={action}>
                <span className="bot-roster__index mono" aria-hidden="true">
                  AI{String(index + 1).padStart(2, '0')}
                </span>
                <Monogram name={bot.name} size="xs" />
                <span className="bot-roster__text">
                  <span className="bot-roster__name">
                    {bot.name}
                    {botThread && botThread.unreadCount > 0 && (
                      <span
                        className="unread-count"
                        aria-label={`${botThread.unreadCount} unread`}
                      >
                        {unreadLabel(botThread.unreadCount)}
                      </span>
                    )}
                  </span>
                  <span className="bot-roster__persona">{bot.persona}</span>
                </span>
                <ArrowUpRight size={14} className="bot-roster__arrow" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="welcome__aside-foot mono">three operators · direct channels only</p>
      <PrivateWindowNote compact />
    </aside>
  );
}
