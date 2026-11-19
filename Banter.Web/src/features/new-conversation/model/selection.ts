import type { UserSearchResult } from '../../../lib/api/contracts';
import { botPersona, resolveIsBot } from '../../../lib/bots';

export type Mode = 'direct' | 'group';

export const BOT_GROUP_ERROR = 'AI teammates join direct threads only.';

export function dedupeUsers(results: UserSearchResult[]): UserSearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.id)) return false;
    seen.add(result.id);
    return true;
  });
}

export function selectPerson(
  current: UserSearchResult[],
  result: UserSearchResult,
  mode: Mode,
): { selected: UserSearchResult[]; error: string | null } {
  if (mode === 'direct') {
    return { selected: [result], error: null };
  }
  if (resolveIsBot(result.isBot, result.displayName)) {
    return { selected: current, error: BOT_GROUP_ERROR };
  }
  return {
    selected: current.some((person) => person.id === result.id)
      ? current.filter((person) => person.id !== result.id)
      : [...current, result],
    error: null,
  };
}

export function switchModeSelection(current: UserSearchResult[], mode: Mode): UserSearchResult[] {
  if (mode === 'direct') return current.slice(0, 1);
  return current.filter((person) => !resolveIsBot(person.isBot, person.displayName));
}

export function canCreateConversation(
  mode: Mode,
  selected: UserSearchResult[],
  groupTitle: string,
): boolean {
  return mode === 'direct'
    ? selected.length === 1
    : selected.length >= 2 && groupTitle.trim().length > 0;
}

export function resultPresentation(
  result: UserSearchResult,
  mode: Mode,
): { isBot: boolean; persona: string | null; unavailable: boolean } {
  const isBot = resolveIsBot(result.isBot, result.displayName);
  return {
    isBot,
    persona: isBot ? botPersona(result.displayName, result.botPersona) : null,
    unavailable: mode === 'group' && isBot,
  };
}

export function builderHint(
  mode: Mode,
  selected: UserSearchResult[],
  groupTitle: string,
): string {
  if (mode === 'direct') {
    if (selected.length !== 1) return 'One person is enough for a direct thread.';
    const isBot = resolveIsBot(selected[0].isBot, selected[0].displayName);
    return isBot
      ? `Open a direct thread with ${selected[0].displayName}, an AI teammate.`
      : `Open a thread with ${selected[0].displayName}.`;
  }
  if (selected.length < 2) return 'A group needs at least two other people.';
  if (groupTitle.trim()) return `Create “${groupTitle.trim()}” with ${selected.length} people.`;
  return 'Give the group a name to continue.';
}
