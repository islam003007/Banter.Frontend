import type { ConversationParticipant } from '../../../lib/api/contracts';
import { resolveIsBot } from '../../../lib/bots';
import { errorMessage } from '../../../lib/api/errors';
import { BotBadge } from '../../../components/ui/BotBadge';
import { Monogram, PresenceDot } from '../../../components/ui/Monogram';

interface ParticipantsSectionProps {
  participants: ConversationParticipant[];
  currentUserId?: string;
  detailLoaded: boolean;
  status: 'pending' | 'error' | 'success';
  error: unknown;
  onlineCount: number;
}

export function ParticipantsSection({
  participants,
  currentUserId,
  detailLoaded,
  status,
  error,
  onlineCount,
}: ParticipantsSectionProps) {
  return (
    <section className="details-section" aria-labelledby="participants-heading">
      <div className="details-section__header">
        <h3 id="participants-heading">People</h3>
        {detailLoaded && onlineCount > 0 && (
          <span className="mono details-online">{onlineCount} online</span>
        )}
      </div>

      {status === 'pending' && (
        <div className="details-loading" role="status" aria-label="Loading participants">
          <span />
          <span />
          <span />
        </div>
      )}

      {status === 'error' && (
        <p className="details-error">
          We couldn’t load the people in this channel. {errorMessage(error)}
        </p>
      )}

      {detailLoaded && participants.length === 0 && (
        <p className="details-muted">No one is listed in this channel right now.</p>
      )}

      {participants.length > 0 && (
        <ul className="participant-list">
          {participants.map((participant) => {
            const participantIsBot = resolveIsBot(participant.isBot, participant.displayName);
            return (
              <li key={participant.userId} className="participant">
                <span className="participant__avatar">
                  <Monogram
                    name={participant.displayName}
                    src={participant.profilePictureUrl}
                    size="sm"
                  />
                  {!participantIsBot && (
                    <PresenceDot
                      online={participant.isOnline}
                      label={`${participant.displayName} is ${
                        participant.isOnline ? 'online' : 'offline'
                      }`}
                    />
                  )}
                </span>
                <span className="participant__name">
                  {participant.displayName}
                  {participantIsBot && <BotBadge />}
                  {participant.userId === currentUserId && (
                    <span className="participant__you mono">you</span>
                  )}
                </span>
                <span className="participant__state mono">
                  {participantIsBot ? 'AI' : participant.isOnline ? 'online' : 'away'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
