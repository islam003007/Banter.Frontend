import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../../../lib/api/contracts';
import { truncate } from '../../../lib/format';
import { isPendingMessage } from '../model/timeline';

export function useMessageAnnouncements({
  messages,
  conversationId,
  currentUserId,
}: {
  messages: ChatMessage[];
  conversationId: string;
  currentUserId: string | undefined;
}): string {
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const announcedMessageRef = useRef<string | null>(null);
  const announcedConversationRef = useRef<string | null>(null);

  useEffect(() => {
    if (announcedConversationRef.current !== conversationId) {
      announcedConversationRef.current = conversationId;
      announcedMessageRef.current = null;
      setLiveAnnouncement('');
    }

    const latest = messages[messages.length - 1];
    if (!latest) return;
    if (!announcedMessageRef.current) {
      announcedMessageRef.current = latest.id;
      return;
    }
    if (
      latest.id !== announcedMessageRef.current &&
      latest.userId !== currentUserId &&
      !isPendingMessage(latest)
    ) {
      setLiveAnnouncement(
        `New message from ${latest.displayName}: ${truncate(latest.content, 120)}`,
      );
    }
    announcedMessageRef.current = latest.id;
  }, [messages, conversationId, currentUserId]);

  return liveAnnouncement;
}
