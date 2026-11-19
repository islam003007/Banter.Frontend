import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BOT_TYPING_TIMEOUT_MS,
  applyBotTypingSignal,
  createBotTypingController,
} from './typing';

describe('bot typing state', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a bot and expires after the timeout', () => {
    const onChange = vi.fn();
    const controller = createBotTypingController(onChange);

    controller.show('conv-1', 'Ada');
    expect(onChange).toHaveBeenLastCalledWith({ 'conv-1': 'Ada' });
    expect(controller.snapshot()).toEqual({ 'conv-1': 'Ada' });

    vi.advanceTimersByTime(BOT_TYPING_TIMEOUT_MS - 1);
    expect(controller.snapshot()).toEqual({ 'conv-1': 'Ada' });

    vi.advanceTimersByTime(1);
    expect(controller.snapshot()).toEqual({});
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it('resets the expiry when the bot sends another typing signal', () => {
    const controller = createBotTypingController(vi.fn());
    controller.show('conv-1', 'Ada');
    vi.advanceTimersByTime(8_000);
    controller.show('conv-1', 'Ada');
    vi.advanceTimersByTime(8_000);
    expect(controller.snapshot()).toEqual({ 'conv-1': 'Ada' });
    vi.advanceTimersByTime(4_000);
    expect(controller.snapshot()).toEqual({});
  });

  it('clears one conversation and all conversations', () => {
    const controller = createBotTypingController(vi.fn());
    controller.show('conv-1', 'Ada');
    controller.show('conv-2', 'Milo');
    controller.clear('conv-1');
    expect(controller.snapshot()).toEqual({ 'conv-2': 'Milo' });
    controller.clearAll();
    expect(controller.snapshot()).toEqual({});
  });

  it('applies inactive signals as a clear and ignores listeners after dispose', () => {
    const onChange = vi.fn();
    const controller = createBotTypingController(onChange);
    applyBotTypingSignal(controller, { conversationId: 'c', botName: 'Ada', active: true });
    expect(controller.snapshot()).toEqual({ c: 'Ada' });

    applyBotTypingSignal(controller, { conversationId: 'c', botName: 'Ada', active: false });
    expect(controller.snapshot()).toEqual({});

    onChange.mockClear();
    controller.dispose();
    controller.show('c', 'Milo');
    expect(onChange).not.toHaveBeenCalled();
  });
});
