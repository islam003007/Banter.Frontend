import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PanelRightClose, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { useAuth } from '../auth/AuthProvider';
import { useConversationDetail } from '../conversation/hooks/useConversationDetail';
import { Monogram } from '../../components/ui/Monogram';
import { useFocusTrap } from './hooks/useFocusTrap';
import { detailsChannelType, resolveDetailsIdentity } from './model/details';
import { ParticipantsSection } from './components/ParticipantsSection';
import { LeaveChannelSection } from './components/LeaveChannelSection';

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

  const detailQuery = useConversationDetail(conversationId, { enabled: open });
  const identity = resolveDetailsIdentity({
    detail: detailQuery.data,
    fallbackName,
    fallbackIsGroup,
    currentUserId: user?.id,
  });

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

  useFocusTrap({
    active: open,
    onClose,
    containerRef: dialogRef,
    initialFocusRef: closeRef,
  });

  if (!open) return null;

  const type = detailsChannelType(identity);

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
          <span className="mono">channel details</span>
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
            <Monogram name={identity.displayName} group={identity.isGroup} size="lg" />
            <div>
              <h2 id="details-title">{identity.displayName}</h2>
              <p className="mono">
                {type}
                {detailQuery.data &&
                  ` · ${identity.participants.length} ${
                    identity.participants.length === 1 ? 'person' : 'people'
                  }`}
              </p>
            </div>
          </div>

          <ParticipantsSection
            participants={identity.participants}
            currentUserId={user?.id}
            detailLoaded={Boolean(detailQuery.data)}
            status={detailQuery.status}
            error={detailQuery.error}
            onlineCount={identity.onlineCount}
          />

          <section className="details-section details-section--thread" aria-labelledby="thread-heading">
            <div className="details-section__header">
              <h3 id="thread-heading">Channel</h3>
            </div>
            <dl className="details-facts">
              <div>
                <dt className="mono">type</dt>
                <dd>{type}</dd>
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

          <LeaveChannelSection
            isGroup={identity.isGroup}
            displayName={identity.displayName}
            pending={leave.isPending}
            error={leave.error}
            hasError={leave.isError}
            onLeave={() => leave.mutate()}
          />

          <div className="details-drawer__signature">
            <Users size={16} aria-hidden="true" />
            <span className="mono">banter / night signal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
