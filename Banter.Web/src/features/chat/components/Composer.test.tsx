import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Composer } from './Composer';

function Harness({
  initialDraft = '',
  sending = false,
  ready = true,
  inputDisabled = false,
  error = null,
  typingBot = null,
  onSend = vi.fn(),
}: {
  initialDraft?: string;
  sending?: boolean;
  ready?: boolean;
  inputDisabled?: boolean;
  error?: string | null;
  typingBot?: string | null;
  onSend?: (content: string) => void;
}) {
  const [draft, setDraft] = useState(initialDraft);
  return (
    <Composer
      title="Mohamed"
      draft={draft}
      onDraftChange={setDraft}
      onSend={onSend}
      sending={sending}
      ready={ready}
      inputDisabled={inputDisabled}
      error={error}
      typingBot={typingBot}
      realtimeState="connected"
      onRetryRealtime={vi.fn()}
    />
  );
}

describe('Chat composer', () => {
  it('sends a trimmed message on Enter and clears the draft', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: 'Message Mohamed' });

    await user.type(textarea, '  hello  {Enter}');

    expect(onSend).toHaveBeenCalledWith('hello');
    expect(textarea).toHaveValue('');
  });

  it('inserts a newline on Shift+Enter without sending', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: 'Message Mohamed' });

    await user.type(textarea, 'first{Shift>}{Enter}{/Shift}second');

    expect(onSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('first\nsecond');
  });

  it('disables transmit for blank drafts and while the history is not ready', () => {
    const { rerender } = render(<Harness initialDraft="   " />);
    expect(screen.getByRole('button', { name: 'Transmit message' })).toBeDisabled();

    rerender(<Harness initialDraft="hello" ready={false} />);
    expect(screen.getByRole('button', { name: 'Transmit message' })).toBeDisabled();
  });

  it('does not send twice while a message is pending', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<Harness initialDraft="hello" sending onSend={onSend} />);

    await user.type(screen.getByRole('textbox', { name: 'Message Mohamed' }), '{Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('shows send errors and disabled input states', () => {
    render(<Harness error="Banter did not answer." inputDisabled />);

    expect(screen.getByRole('alert')).toHaveTextContent('Banter did not answer.');
    expect(screen.getByRole('textbox', { name: 'Message Mohamed' })).toBeDisabled();
  });

  it('shows the bot typing indicator and the disconnect banner', () => {
    render(
      <Composer
        title="Ada"
        draft=""
        onDraftChange={vi.fn()}
        onSend={vi.fn()}
        sending={false}
        ready
        inputDisabled={false}
        error={null}
        typingBot="Ada"
        realtimeState="disconnected"
        onRetryRealtime={vi.fn()}
      />,
    );

    expect(screen.getByText(/is typing/)).toBeInTheDocument();
    expect(screen.getByText(/Live updates are paused/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reconnect/ })).toBeInTheDocument();
  });
});
