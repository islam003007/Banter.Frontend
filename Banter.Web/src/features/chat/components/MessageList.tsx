import { useMemo, type RefObject } from 'react';
import { ChevronUp, Loader2 } from 'lucide-react';
import { errorMessage } from '../../../lib/api/errors';
import type { ChatMessage, RealtimeState } from '../../../lib/api/contracts';
import { SignalMeter } from '../../../components/ui/SignalMeter';
import { ErrorState } from '../../../components/ui/PageState';
import { ChatSkeleton } from './ChatSkeleton';
import { MessageRow } from './MessageRow';
import { groupMessages } from '../model/timeline';

interface MessageListProps {
  status: 'pending' | 'error' | 'success';
  messages: ChatMessage[];
  currentUserId?: string;
  error: unknown;
  forbidden: boolean;
  onRetry: () => void;
  feedRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  canLoadOlder: boolean;
  isFetchingOlder: boolean;
  onLoadOlder: () => void;
  realtimeState: RealtimeState;
}

export function MessageList({
  status,
  messages,
  currentUserId,
  error,
  forbidden,
  onRetry,
  feedRef,
  onScroll,
  canLoadOlder,
  isFetchingOlder,
  onLoadOlder,
  realtimeState,
}: MessageListProps) {
  const grouped = useMemo(() => groupMessages(messages), [messages]);

  return (
    <div className="chat__feed" ref={feedRef} onScroll={onScroll}>
      {status === 'pending' && <ChatSkeleton />}

      {status === 'error' && (
        <div className="chat__state">
          <p className="chat__state-kicker mono">signal interrupted</p>
          <ErrorState
            title={forbidden ? 'You can’t open this channel.' : 'This channel’s history didn’t load.'}
            message={
              forbidden
                ? 'You may have left this channel, or your account doesn’t have access to it.'
                : errorMessage(error)
            }
            onRetry={forbidden ? undefined : onRetry}
            backTo="/inbox"
            backLabel="Back to inbox"
          />
        </div>
      )}

      {status === 'success' && messages.length === 0 && (
        <div className="chat__state chat__state--empty">
          <span className="chat__state-signal mono">
            <SignalMeter state={realtimeState} bars={5} />
            quiet channel
          </span>
          <h2>A channel with nothing on it yet.</h2>
          <p>Send the first line. It lands in the history and crosses to the other side live.</p>
        </div>
      )}

      {messages.length > 0 && (
        <div className="feed">
          <div className="feed__start">
            {canLoadOlder ? (
              <button
                type="button"
                className="load-older"
                onClick={onLoadOlder}
                disabled={isFetchingOlder}
              >
                {isFetchingOlder ? (
                  <Loader2 className="spin" size={15} aria-hidden="true" />
                ) : (
                  <ChevronUp size={15} aria-hidden="true" />
                )}
                {isFetchingOlder ? 'Loading older messages' : 'Load older messages'}
              </button>
            ) : (
              <span className="mono">start of this channel</span>
            )}
          </div>

          {grouped.map((node) =>
            node.type === 'day' ? (
              <div className="day-divider" key={node.key}>
                <span className="day-divider__label mono">
                  <span className="day-divider__bars" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  {node.label}
                </span>
              </div>
            ) : (
              <MessageRow
                key={node.key}
                message={node.message}
                continuation={node.continuation}
                mine={node.message.userId === currentUserId}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
