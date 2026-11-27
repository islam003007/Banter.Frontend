import { useMemo } from 'react';
import { PanelLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useRail } from '../../layouts/RailContext';
import { formatThreadTime } from '../../lib/format';
import { TransmissionBand } from '../../components/ui/TransmissionBand';
import { useInbox } from '../conversation/hooks/useInbox';
import { buildInboxSummary } from './model/inboxSummary';
import { WelcomeHero } from './components/WelcomeHero';
import { OperatorDesk } from './components/OperatorDesk';
import { RecentTransmissions } from './components/RecentTransmissions';
import { BOTS_ENABLED } from '../../lib/bots';

export function InboxPage() {
  const { user } = useAuth();
  const { drawerOpen, openDrawer } = useRail();
  const inbox = useInbox();
  const conversations = inbox.data?.conversations ?? [];
  const summary = useMemo(() => buildInboxSummary(conversations), [conversations]);
  const latestSignal = summary.latest
    ? formatThreadTime(summary.latest.lastMessageCreatedAt)
    : '';

  return (
    <section className="welcome" aria-labelledby="welcome-heading">
      <TransmissionBand
        context="banter"
        detail={
          inbox.isSuccess
            ? `${conversations.length} channels${
                summary.unreadTotal > 0 ? ` · ${summary.unreadTotal} unread` : ' · all read'
              }`
            : 'reading the desk'
        }
        className="transmission--welcome"
      />

      <div className="welcome__top">
        <p className="welcome__kicker mono">
          banter <span aria-hidden="true">/</span> live channels
        </p>
        <div className="welcome__top-right">
          <button
            type="button"
            className="rail-trigger"
            onClick={openDrawer}
            aria-expanded={drawerOpen}
            aria-controls="conversation-rail"
          >
            <PanelLeft size={15} aria-hidden="true" />
            Channels
          </button>
          <p className="welcome__date mono">
            {new Intl.DateTimeFormat('en', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(new Date())}
          </p>
        </div>
      </div>

      <div className={`welcome__hero${BOTS_ENABLED ? '' : ' welcome__hero--solo'}`}>
        <WelcomeHero
          displayName={user?.displayName}
          isPending={inbox.isPending}
          unreadTotal={summary.unreadTotal}
          channelsCount={conversations.length}
          liveNow={summary.liveNow}
          latest={summary.latest}
        />
        {BOTS_ENABLED && <OperatorDesk botThreads={summary.botThreads} />}
      </div>

      <RecentTransmissions
        isPending={inbox.isPending}
        isError={inbox.isError}
        isSuccess={inbox.isSuccess}
        error={inbox.error}
        onRetry={() => void inbox.refetch()}
        threads={summary.pickupThreads}
        latestSignal={latestSignal}
      />

      <footer className="welcome__footer mono">
        <span>demo workspace · sample data only</span>
        <span>channels · new messages arrive live</span>
      </footer>
    </section>
  );
}
