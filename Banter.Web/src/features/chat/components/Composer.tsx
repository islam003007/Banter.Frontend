import { useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowUp, RefreshCw, WifiOff } from 'lucide-react';
import type { RealtimeState } from '../../../lib/api/contracts';

export const MESSAGE_LIMIT = 2000;

interface ComposerProps {
  title: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (content: string) => void;
  sending: boolean;
  ready: boolean;
  inputDisabled: boolean;
  error: string | null;
  typingBot: string | null;
  realtimeState: RealtimeState;
  onRetryRealtime: () => void;
}

export function Composer({
  title,
  draft,
  onDraftChange,
  onSend,
  sending,
  ready,
  inputDisabled,
  error,
  typingBot,
  realtimeState,
  onRetryRealtime,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }, [draft]);

  const send = () => {
    const content = draft.trim();
    if (!content || sending || !ready) return;
    onSend(content);
    onDraftChange('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="chat__composer-wrap">
      {typingBot && (
        <div className="bot-thinking" role="status">
          <span className="bot-thinking__signal" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>{typingBot}</strong> is typing…
          </span>
        </div>
      )}

      {realtimeState === 'disconnected' && (
        <div className="realtime-banner" role="status">
          <WifiOff size={15} aria-hidden="true" />
          <span>Live updates are paused. You can still send; reconnect to catch up.</span>
          <button type="button" className="text-button" onClick={onRetryRealtime}>
            <RefreshCw size={13} aria-hidden="true" />
            Reconnect
          </button>
        </div>
      )}

      {error && (
        <p className="composer__error" role="alert">
          {error}
        </p>
      )}

      <form className="composer" onSubmit={handleSubmit}>
        <div className="composer__field">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={MESSAGE_LIMIT}
            placeholder={`Write to ${title || 'the thread'}`}
            aria-label={`Message ${title || 'the thread'}`}
            aria-describedby="composer-hint"
            disabled={inputDisabled}
          />
          <div className="composer__foot">
            <span className="composer__mode mono" aria-hidden="true">
              <span className="composer__wave">
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
              TX
            </span>
            <span className="composer__hint mono" id="composer-hint">
              enter transmits · shift + enter breaks the line
            </span>
            <span
              className={`composer__count mono ${
                draft.length > MESSAGE_LIMIT - 200 ? 'is-near' : ''
              }`.trim()}
            >
              {draft.length > MESSAGE_LIMIT - 200 ? `${draft.length}/${MESSAGE_LIMIT}` : ''}
            </span>
            <button
              type="submit"
              className="send-button"
              disabled={!draft.trim() || !ready}
              aria-label="Transmit message"
            >
              <span>Transmit</span>
              <ArrowUp size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>
      <div className="composer__note">
        <span className="mono">
          {realtimeState === 'connected'
            ? 'messages arrive live'
            : realtimeState === 'connecting' || realtimeState === 'reconnecting'
              ? 'restoring the live connection'
              : 'live updates paused — send still works'}
        </span>
      </div>
    </div>
  );
}
