import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, LogOut, PanelRightClose, Users } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { resolveIsBot } from '../lib/bots';
import { queryKeys } from '../lib/queryKeys';
import type { ConversationDetail } from '../lib/types';
import { useAuth } from '../auth/AuthProvider';
import { BotBadge } from './BotBadge';
import { Monogram, PresenceDot } from './Monogram';

interface DetailsDrawerProps {
  conversationId: string;
  fallbackName: string;
  fallbackIsGroup: boolean;
  open: boolean;
  onClose: () => void;
}

export function DetailsDrawer({
  conversationId,
  fallbackName,
  fallbackIsGroup,
  open,
  onClose,
}: DetailsDrawerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const detailQuery = useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: () => api.getConversation(conversationId),
    staleTime: 30_000,
    enabled: open,
    retry: 1,
  });

  const detail: ConversationDetail | undefined = detailQuery.data;
  const isGroup = detail?.isGroup ?? fallbackIsGroup;
  const name = detail?.title ?? detail?.displayName ?? fallbackName;
  const participants = detail?.participants ?? [];
  const otherParticipant = participants.find((participant) => participant.userId !== user?.id);
  const displayName = !isGroup && otherParticipant ? otherParticipant.displayName : name;
  const isBotConversation =
    !isGroup && resolveIsBot(otherParticipant?.isBot ?? detail?.isBot, displayName);
  const onlineCount = participants.filter(
    (participant) =>
      !resolveIsBot(participant.isBot, participant.displayName) && participant.isOnline,
  ).length;

  const leave = useMutation({
    mutationFn: () => api.leaveConversation(conversationId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.conversation(conversationId) });
      queryClient.removeQueries({ queryKey: queryKeys.messages(conversationId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
      onClose();
      navigate('/inbox', { replace: true });
    },
  });

  useEffect(() => {
    if (!open) {
      setConfirmingLeave(false);
      return;
    }

    const previousFocus = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 20);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-layer">
      <button type="button" className="drawer-scrim" aria-label="Close details" onClick={onClose} />
      <div
        className="details-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
        ref={dialogRef}
      >
        <header className="details-drawer__header">
          <span className="mono">thread details</span>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close details"
            ref={closeRef}
          >
            <PanelRightClose size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="details-drawer__scroll">
          <div className="details-title">
            <Monogram name={displayName} group={isGroup} size="lg" />
            <div>
              <h2 id="details-title">{displayName}</h2>
              <p className="mono">
                {isGroup
                  ? 'group thread'
                  : isBotConversation
                    ? 'AI direct thread'
                    : 'direct thread'}
                {detail && ` · ${participants.length} ${participants.length === 1 ? 'person' : 'people'}`}
              </p>
            </div>
          </div>

          <section className="details-section" aria-labelledby="participants-heading">
            <div className="details-section__header">
              <h3 id="participants-heading">People</h3>
              {detail && onlineCount > 0 && (
                <span className="mono details-online">{onlineCount} online</span>
              )}
            </div>

            {detailQuery.isPending && (
              <div className="details-loading" role="status" aria-label="Loading participants">
                <span />
                <span />
                <span />
              </div>
            )}

            {detailQuery.isError && (
              <p className="details-error">
                Participants could not be loaded. {errorMessage(detailQuery.error)}
              </p>
            )}

            {detail && participants.length === 0 && (
              <p className="details-muted">The people in this thread are not available right now.</p>
            )}

            {participants.length > 0 && (
              <ul className="participant-list">
                {participants.map((participant) => {
                  const participantIsBot = resolveIsBot(
                    participant.isBot,
                    participant.displayName,
                  );
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
                            label={`${participant.displayName} is ${participant.isOnline ? 'online' : 'offline'}`}
                          />
                        )}
                      </span>
                      <span className="participant__name">
                        {participant.displayName}
                        {participantIsBot && <BotBadge />}
                        {participant.userId === user?.id && <span className="participant__you mono">you</span>}
                      </span>
                      <span className="participant__state mono">
                        {participantIsBot
                          ? 'AI'
                          : participant.isOnline
                            ? 'online'
                            : 'away'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="details-section details-section--thread" aria-labelledby="thread-heading">
            <div className="details-section__header">
              <h3 id="thread-heading">Thread</h3>
            </div>
            <dl className="details-facts">
              <div>
                <dt className="mono">type</dt>
                <dd>
                  {isGroup
                    ? 'group conversation'
                    : isBotConversation
                      ? 'AI direct message'
                      : 'direct message'}
                </dd>
              </div>
              <div>
                <dt className="mono">live</dt>
                <dd>messages arrive as they are sent</dd>
              </div>
              <div>
                <dt className="mono">history</dt>
                <dd>saved in order</dd>
              </div>
            </dl>
          </section>

          <section className="details-section details-section--leave" aria-labelledby="leave-heading">
            <div className="details-section__header">
              <h3 id="leave-heading">Leave thread</h3>
            </div>
            {!isGroup && (
              <p className="details-muted">
                Direct threads are shared by both people. Leave is only available for group threads.
              </p>
            )}
            {isGroup && (
              <>
                {!confirmingLeave ? (
                  <button
                    type="button"
                    className="button button--outline-danger"
                    onClick={() => setConfirmingLeave(true)}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Leave conversation
                  </button>
                ) : (
                  <div className="leave-confirm">
                    <p>
                      <AlertTriangle size={16} aria-hidden="true" />
                      Leave “{displayName}”? The thread disappears from your inbox.
                    </p>
                    <div className="leave-confirm__actions">
                      <button
                        type="button"
                        className="button button--danger"
                        disabled={leave.isPending}
                        onClick={() => leave.mutate()}
                      >
                        {leave.isPending ? 'Leaving…' : 'Yes, leave'}
                      </button>
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => setConfirmingLeave(false)}
                      >
                        Stay
                      </button>
                    </div>
                  </div>
                )}
                {leave.isError && (
                  <p className="form-error" role="alert">
                    {errorMessage(leave.error)}
                  </p>
                )}
              </>
            )}
          </section>

          <div className="details-drawer__signature">
            <Users size={16} aria-hidden="true" />
            <span className="mono">banter / night signal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
