import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';
import {
  webHover,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';

type AuthScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  /** Smaller title for split-view detail headers. */
  compact?: boolean;
  /** Renders beside the title block (e.g. filter control). */
  accessory?: ReactNode;
};

export function AuthScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  compact = false,
  accessory,
}: AuthScreenHeaderProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    back: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      marginBottom: spacing.xs,
      marginLeft: -spacing.xs,
      minHeight: 44,
      justifyContent: 'center',
      borderRadius: 8,
      ...webPointer(),
    },
    backHovered: webTextLinkHoverStyles(colors),
    backText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    titleBlock: {
      flex: 1,
      gap: spacing.sm,
    },
    title: {
      ...typography.title,
      fontSize: compact ? 22 : 28,
    },
    subtitle: typography.subtitle,
  }));

  return (
    <View style={styles.wrap}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={({ pressed, hovered }) => [
            styles.back,
            webHover(hovered, pressed, styles.backHovered),
            pressed && { opacity: 0.75 },
          ]}>
          <Text style={styles.backText}>{backLabel}</Text>
        </Pressable>
      ) : null}
      {title || subtitle || accessory ? (
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {accessory}
        </View>
      ) : null}
    </View>
  );
}
