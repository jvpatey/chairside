import { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { OnboardingShell, useFormScroll } from '@/components/onboarding/OnboardingShell';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  FORM_CONTENT_MAX_WIDTH,
  formContentWidthStyle,
} from '@/theme/formFieldTokens';
import { useThemedStyles, type GradientAccent } from '@/theme';
import type { PageHeroGlowVariant } from '@/components/ui/PageHeroGlow';

export { useFormScroll };

type FormScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  headerAccessory?: ReactNode;
  compactHeader?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  transparentBackground?: boolean;
  atmosphere?: PageHeroGlowVariant | 'none';
  atmosphereAccent?: GradientAccent;
  accent?: GradientAccent;
  constrainFormWidth?: boolean;
  formMaxWidth?: number;
  fillViewport?: boolean;
};

/**
 * Form/detail shell with keyboard scroll-into-view and optional sticky footer.
 * Page header is fixed/sticky outside scroll content.
 */
export function FormScreen({
  children,
  footer,
  title,
  eyebrow,
  subtitle,
  onBack,
  backLabel,
  headerAccessory,
  compactHeader = false,
  contentStyle,
  transparentBackground = true,
  atmosphere = 'none',
  atmosphereAccent = 'primary',
  accent = 'primary',
  constrainFormWidth = false,
  formMaxWidth = FORM_CONTENT_MAX_WIDTH,
  fillViewport = false,
}: FormScreenProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    body: {
      gap: spacing.lg,
      ...(constrainFormWidth ? formContentWidthStyle(formMaxWidth) : {}),
    },
  }));

  const showHeader = Boolean(title || eyebrow || subtitle || onBack || headerAccessory);

  const header = showHeader ? (
    <PageHeader
      variant="detail"
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      backLabel={backLabel}
      trailing={headerAccessory}
      compact={compactHeader}
      accent={accent}
    />
  ) : null;

  return (
    <OnboardingShell
      header={header}
      footer={footer}
      transparentBackground={transparentBackground}
      atmosphere={atmosphere}
      atmosphereAccent={atmosphereAccent}
      fillViewport={fillViewport}
      contentStyle={[styles.body, contentStyle]}
    >
      {children}
    </OnboardingShell>
  );
}
