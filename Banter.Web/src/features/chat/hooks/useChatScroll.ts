import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../../../lib/api/contracts';

interface ScrollAnchor {
  height: number;
  top: number;
}

export function useChatScroll({
  conversationId,
  messages,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  conversationId: string;
  messages: ChatMessage[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
}) {
  const feedRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const initialLoadedRef = useRef(false);
  const restoreRef = useRef<ScrollAnchor | null>(null);
  const previousLastIdRef = useRef<string | null>(null);
  const loadedConversationRef = useRef<string | null>(null);
  const [showJump, setShowJump] = useState(false);

  useEffect(() => {
    atBottomRef.current = true;
    initialLoadedRef.current = false;
    previousLastIdRef.current = null;
    restoreRef.current = null;
    setShowJump(false);
  }, [conversationId]);

  useLayoutEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    if (loadedConversationRef.current !== conversationId) {
      loadedConversationRef.current = conversationId;
      initialLoadedRef.current = false;
      previousLastIdRef.current = null;
      atBottomRef.current = true;
      restoreRef.current = null;
    }

    if (messages.length === 0) return;

    if (!initialLoadedRef.current) {
      feed.scrollTop = feed.scrollHeight;
      initialLoadedRef.current = true;
      previousLastIdRef.current = messages[messages.length - 1].id;
      return;
    }

    if (restoreRef.current) {
      const snapshot = restoreRef.current;
      restoreRef.current = null;
      feed.scrollTop = feed.scrollHeight - snapshot.height + snapshot.top;
      previousLastIdRef.current = messages[messages.length - 1].id;
      return;
    }

    const lastId = messages[messages.length - 1].id;
    if (lastId !== previousLastIdRef.current) {
      previousLastIdRef.current = lastId;
      if (atBottomRef.current) {
        feed.scrollTop = feed.scrollHeight;
        setShowJump(false);
      } else {
        setShowJump(true);
      }
    }
  }, [messages, conversationId]);

  const handleScroll = useCallback(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const distance = feed.scrollHeight - feed.scrollTop - feed.clientHeight;
    atBottomRef.current = distance < 90;
    if (distance < 90) setShowJump(false);
  }, []);

  const loadOlder = useCallback(() => {
    const feed = feedRef.current;
    if (feed) {
      restoreRef.current = { height: feed.scrollHeight, top: feed.scrollTop };
    }
    void fetchNextPage();
  }, [fetchNextPage]);

  const jumpToLatest = useCallback(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    feed.scrollTo({ top: feed.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
    atBottomRef.current = true;
    setShowJump(false);
  }, []);

  const pinToBottom = useCallback(() => {
    atBottomRef.current = true;
    setShowJump(false);
  }, []);

  return {
    feedRef,
    showJump,
    handleScroll,
    loadOlder,
    jumpToLatest,
    pinToBottom,
    canLoadOlder: Boolean(hasNextPage),
    isFetchingOlder: isFetchingNextPage,
  };
}
