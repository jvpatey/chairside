import { type ReactNode } from 'react';

import { PageHeader } from '@/components/ui/PageHeader';
import { type GradientAccent } from '@/theme';

type AuthScreenHeaderProps = {
  title?: string | ReactNode;
  eyebrow?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  compact?: boolean;
  accessory?: ReactNode;
  accent?: GradientAccent;
};

export function AuthScreenHeader({
  title,
  eyebrow,
  subtitle,
  onBack,
  backLabel = 'Back',
  compact = false,
  accessory,
  accent = 'primary',
}: AuthScreenHeaderProps) {
  return (
    <PageHeader
      variant="detail"
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      backLabel={backLabel}
      trailing={accessory}
      compact={compact}
      accent={accent}
      showNotifications={false}
    />
  );
}
