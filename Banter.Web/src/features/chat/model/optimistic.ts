import type { ChatMessage, CurrentUser } from '../../../lib/api/contracts';

export function createOptimisticMessage({
  content,
  user,
  id,
  createdAt,
}: {
  content: string;
  user: CurrentUser | null;
  id: string;
  createdAt: string;
}): ChatMessage {
  return {
    id,
    content,
    createdAt,
    userId: user?.id ?? '',
    displayName: user?.displayName ?? 'You',
    profilePictureUrl: user?.profilePictureUrl ?? null,
    isBot: false,
  };
}
