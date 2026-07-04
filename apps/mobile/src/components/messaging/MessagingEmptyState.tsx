import type { Ionicons } from '@expo/vector-icons';

import { EmptyState } from '@/components/ui/EmptyState';
import type { GradientAccent } from '@/theme';

type MessagingEmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  /** @deprecated Use `message` — kept for existing call sites. */
  body?: string;
  message?: string;
  compact?: boolean;
  accent?: GradientAccent;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

/** Branded empty state for messaging inbox and thread surfaces. */
export function MessagingEmptyState({
  icon = 'chatbubbles-outline',
  title,
  body,
  message,
  accent,
  ctaLabel,
  onCtaPress,
}: MessagingEmptyStateProps) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      message={message ?? body ?? ''}
      accent={accent}
      ctaLabel={ctaLabel}
      onCtaPress={onCtaPress}
    />
  );
}
