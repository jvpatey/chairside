import { router } from 'expo-router';
import type { ViewStyle } from 'react-native';

import { PillBadge, type PillBadgeSize } from '@/components/ui/PillBadge';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import {
  getFillInSmsBadgePresentation,
  type FillInSmsBadgeTone,
} from '@/lib/fillInAvailabilitySummary';
import { getWorkerFillInAvailabilityRoute } from '@/lib/routing';
import { colorWithAlpha, useTheme, type Colors } from '@/theme';

type TextAlertsStatusBadgeProps = {
  size?: PillBadgeSize;
  style?: ViewStyle;
  /** Override press — defaults to notification settings. */
  onPress?: () => void;
  /** When false, badge is display-only. */
  interactive?: boolean;
};

function tonePalette(tone: FillInSmsBadgeTone, colors: Colors, isDark: boolean) {
  if (tone === 'on') {
    return {
      color: colors.success,
      backgroundColor: colorWithAlpha(colors.success, isDark ? 0.18 : 0.1),
      borderColor: colorWithAlpha(colors.success, 0.28),
    };
  }
  if (tone === 'needs_phone') {
    return {
      color: colors.warning,
      backgroundColor: colorWithAlpha(colors.warning, isDark ? 0.18 : 0.1),
      borderColor: colorWithAlpha(colors.warning, 0.28),
    };
  }
  return {
    color: colors.labelSecondary,
    backgroundColor: colors.fillSubtle,
    borderColor: colors.separator,
  };
}

/** Three-state SMS alert badge — green when on, warning for phone, quiet when off. */
export function TextAlertsStatusBadge({
  size = 'sm',
  style,
  onPress,
  interactive = true,
}: TextAlertsStatusBadgeProps) {
  const { colors, isDark } = useTheme();
  const { workerProfile } = useWorkerProfile();
  const presentation = getFillInSmsBadgePresentation(workerProfile);

  if (!presentation) return null;

  const palette = tonePalette(presentation.tone, colors, isDark);

  return (
    <PillBadge
      label={presentation.label}
      color={palette.color}
      backgroundColor={palette.backgroundColor}
      borderColor={palette.borderColor}
      showDot={presentation.showDot}
      size={size}
      style={[{ alignSelf: 'flex-start' }, style]}
      onPress={
        interactive
          ? (onPress ??
              (() => router.push(getWorkerFillInAvailabilityRoute('profile'))))
          : undefined
      }
      accessibilityLabel={`${presentation.label}. Manage text alerts`}
    />
  );
}
