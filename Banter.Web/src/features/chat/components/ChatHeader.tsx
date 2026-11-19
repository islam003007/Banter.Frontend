import { Info, PanelLeft } from 'lucide-react';
import type { ConversationParticipant } from '../../../lib/api/contracts';
import { BotBadge } from '../../../components/ui/BotBadge';
import { Monogram, PresenceDot } from '../../../components/ui/Monogram';

interface ChatHeaderProps {
  title: string;
  channelIndex: string | null;
  channelKind: string;
  isGroup: boolean;
  isBotConversation: boolean;
  online: boolean;
  onlineCount: number;
  participants: ConversationParticipant[];
  drawerOpen: boolean;
  detailsOpen: boolean;
  onOpenDrawer: () => void;
  onOpenDetails: () => void;
}

export function ChatHeader({
  title,
  channelIndex,
  channelKind,
  isGroup,
  isBotConversation,
  online,
  onlineCount,
  participants,
  drawerOpen,
  detailsOpen,
  onOpenDrawer,
  onOpenDetails,
}: ChatHeaderProps) {
  return (
    <header className="chat__header">
      <button
        type="button"
        className="icon-button chat__rail-toggle"
        onClick={onOpenDrawer}
        aria-label="Open channels"
        aria-expanded={drawerOpen}
        aria-controls="conversation-rail"
      >
        <PanelLeft size={20} aria-hidden="true" />
      </button>

      <div className="chat__identity">
        <Monogram name={title} group={isGroup} size="lg" className="chat__title-monogram" />
        <div className="chat__identity-copy">
          <p className="chat__channel-label mono">
            {channelIndex && <span className="chat__channel-code">CH {channelIndex}</span>}
            <span>{channelKind}</span>
          </p>
          <h1 id="chat-title">{title || 'Conversation'}</h1>
          <p className="chat__subtitle mono">
            {isGroup ? (
              <>
                <span>
                  {participants.length > 0 ? `${participants.length} people` : 'group channel'}
                </span>
                {onlineCount > 0 && (
                  <>
                    <span className="chat__dot" aria-hidden="true" />
                    <span>{onlineCount} online now</span>
                  </>
                )}
              </>
            ) : isBotConversation ? (
              <>
                <BotBadge />
                <span>AI teammate</span>
                <span className="chat__dot" aria-hidden="true" />
                <span>direct wire</span>
              </>
            ) : (
              <>
                <PresenceDot online={online} label={online ? 'Online' : 'Offline'} />
                <span>{online ? 'online' : 'away'}</span>
                <span className="chat__dot" aria-hidden="true" />
                <span>direct wire</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="chat__header-actions">
        {participants.length > 0 && (
          <div className="chat__participants" aria-label={`${participants.length} participants`}>
            <span className="chat__participant-stack" aria-hidden="true">
              {participants.slice(0, 4).map((participant) => (
                <Monogram
                  key={participant.userId}
                  name={participant.displayName}
                  src={participant.profilePictureUrl}
                  size="xs"
                />
              ))}
              {participants.length > 4 && (
                <span className="chat__participant-more mono">+{participants.length - 4}</span>
              )}
            </span>
            <span className="mono chat__participant-label">{participants.length} in channel</span>
          </div>
        )}

        <button
          type="button"
          className="details-button"
          onClick={onOpenDetails}
          aria-haspopup="dialog"
          aria-expanded={detailsOpen}
          aria-label="Channel details"
        >
          <span>Details</span>
          <Info size={17} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
