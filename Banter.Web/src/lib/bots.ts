export interface BotProfile {
  name: string;
  persona: string;
}

const SEEDED_BOTS: Record<string, BotProfile> = {
  ada: { name: 'Ada', persona: 'Systems and backend pair-programmer' },
  milo: { name: 'Milo', persona: 'Rubber-duck debugging partner' },
  nova: { name: 'Nova', persona: 'Enthusiastic idea generator' },
};

export const BOT_ROSTER: readonly BotProfile[] = [
  SEEDED_BOTS.ada,
  SEEDED_BOTS.milo,
  SEEDED_BOTS.nova,
];

export const BOT_NAMES = 'Ada, Milo and Nova';

export function knownBot(name: string | null | undefined): BotProfile | null {
  if (!name) return null;
  return SEEDED_BOTS[name.trim().toLowerCase()] ?? null;
}

export function isKnownBot(name: string | null | undefined): boolean {
  return knownBot(name) !== null;
}

/**
 * The API is authoritative when it sends `isBot`. Older payloads (inbox rows,
 * history pages) may omit it, so the seeded bot names are a visual fallback.
 */
export function resolveIsBot(
  isBot: boolean | undefined,
  name: string | null | undefined,
): boolean {
  return isBot ?? isKnownBot(name);
}

export function botPersona(
  name: string | null | undefined,
  persona?: string | null,
): string | null {
  const supplied = persona?.trim();
  if (supplied) return supplied;
  return knownBot(name)?.persona ?? null;
}
