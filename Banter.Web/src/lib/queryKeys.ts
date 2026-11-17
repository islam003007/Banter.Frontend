export const queryKeys = {
  session: ['session'] as const,
  demoUsers: ['demo-users'] as const,
  inbox: ['inbox'] as const,
  conversation: (conversationId: string) => ['conversation', conversationId] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  userSearch: (searchTerm: string) => ['user-search', searchTerm] as const,
};
