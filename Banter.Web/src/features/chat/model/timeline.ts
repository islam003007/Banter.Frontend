import type { ChatMessage, MessagesPage } from '../../../lib/api/contracts';
import { dayKey, formatDayLabel, isWithinMinutes, parseDate } from '../../../lib/format';

export type TimelineNode =
  | { type: 'day'; key: string; label: string }
  | { type: 'message'; key: string; message: ChatMessage; continuation: boolean };

export function isPendingMessage(message: ChatMessage): boolean {
  return message.id.startsWith('pending-');
}

export function flattenMessages(pages: MessagesPage[] | undefined): ChatMessage[] {
  if (!pages) return [];
  const seen = new Set<string>();
  const all: ChatMessage[] = [];
  for (const page of pages) {
    for (const message of page.messages) {
      if (seen.has(message.id)) continue;
      seen.add(message.id);
      all.push(message);
    }
  }
  return all.sort((left, right) => {
    const leftTime = parseDate(left.createdAt)?.getTime() ?? 0;
    const rightTime = parseDate(right.createdAt)?.getTime() ?? 0;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return left.id.localeCompare(right.id);
  });
}

export function latestRealMessage(messages: ChatMessage[]): ChatMessage | undefined {
  return [...messages].reverse().find((message) => !isPendingMessage(message));
}

export function groupMessages(messages: ChatMessage[]): TimelineNode[] {
  const nodes: TimelineNode[] = [];
  let lastDay = '';
  let previous: ChatMessage | null = null;

  for (const message of messages) {
    const key = dayKey(message.createdAt);
    if (key !== lastDay) {
      nodes.push({ type: 'day', key: `day-${key}`, label: formatDayLabel(message.createdAt) });
      lastDay = key;
      previous = null;
    }

    const continuation =
      Boolean(previous) &&
      previous?.userId === message.userId &&
      isWithinMinutes(previous?.createdAt, message.createdAt, 5);

    nodes.push({ type: 'message', key: message.id, message, continuation });
    previous = message;
  }

  return nodes;
}
