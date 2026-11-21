import { Sparkles } from 'lucide-react';

export function BotBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`bot-badge ${className}`.trim()}
      role="img"
      aria-label="AI operator"
      title="AI operator"
    >
      <Sparkles size={9} aria-hidden="true" />
      <span>AI</span>
    </span>
  );
}
