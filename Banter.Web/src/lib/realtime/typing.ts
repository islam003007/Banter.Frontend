export const BOT_TYPING_TIMEOUT_MS = 12_000;

export interface BotTypingController {
  show(conversationId: string, botName: string): void;
  clear(conversationId: string): void;
  clearAll(): void;
  snapshot(): Record<string, string>;
  dispose(): void;
}

interface TypingControllerOptions {
  timeoutMs?: number;
  setTimer?: typeof setTimeout;
  clearTimer?: typeof clearTimeout;
}

/**
 * Holds "a bot is typing" state per conversation and expires each entry after
 * a short timeout, so a dropped notification never leaves the indicator on.
 */
export function createBotTypingController(
  onChange: (next: Record<string, string>) => void,
  options: TypingControllerOptions = {},
): BotTypingController {
  const timeoutMs = options.timeoutMs ?? BOT_TYPING_TIMEOUT_MS;
  const setTimer = options.setTimer ?? setTimeout;
  const clearTimer = options.clearTimer ?? clearTimeout;
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let typing: Record<string, string> = {};
  let disposed = false;

  const emit = () => {
    if (!disposed) onChange(typing);
  };

  const clear = (conversationId: string) => {
    const timer = timers.get(conversationId);
    if (timer !== undefined) clearTimer(timer);
    timers.delete(conversationId);
    if (!(conversationId in typing)) return;
    const next = { ...typing };
    delete next[conversationId];
    typing = next;
    emit();
  };

  return {
    show(conversationId, botName) {
      if (disposed) return;
      const existing = timers.get(conversationId);
      if (existing !== undefined) clearTimer(existing);

      if (typing[conversationId] !== botName) {
        typing = { ...typing, [conversationId]: botName };
        emit();
      }

      const timer = setTimer(() => {
        timers.delete(conversationId);
        if (!(conversationId in typing)) return;
        const next = { ...typing };
        delete next[conversationId];
        typing = next;
        emit();
      }, timeoutMs);
      timers.set(conversationId, timer);
    },

    clear,

    clearAll() {
      for (const timer of timers.values()) clearTimer(timer);
      timers.clear();
      if (Object.keys(typing).length === 0) return;
      typing = {};
      emit();
    },

    snapshot() {
      return typing;
    },

    dispose() {
      for (const timer of timers.values()) clearTimer(timer);
      timers.clear();
      typing = {};
      disposed = true;
    },
  };
}

/** Applies a bot typing signal to a controller in the shape the hub sends. */
export function applyBotTypingSignal(
  controller: BotTypingController,
  signal: { conversationId: string; botName: string; active: boolean },
): void {
  if (signal.active) {
    controller.show(signal.conversationId, signal.botName);
    return;
  }
  controller.clear(signal.conversationId);
}
