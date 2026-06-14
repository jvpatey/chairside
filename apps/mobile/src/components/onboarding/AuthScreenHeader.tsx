import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';
import {
  webHover,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';

type AuthScreenHeaderProps = {
  title?: string | ReactNode;
  /** Small label above the title (e.g. "Applications for"). */
  eyebrow?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  /** Smaller title for split-view detail headers. */
  compact?: boolean;
  /** Renders beside the title block (e.g. filter control). */
  accessory?: ReactNode;
};

export function AuthScreenTitle({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const styles = useThemedStyles(({ typography }) => ({
    title: {
      ...typography.title,
      fontSize: compact ? 22 : 28,
    },
  }));

  return <Text style={styles.title}>{children}</Text>;
}

export function AuthScreenHeader({
  title,
  eyebrow,
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
      gap: spacing.xs,
    },
    eyebrow: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
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
      {eyebrow || title || subtitle || accessory ? (
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {title != null ? (
              typeof title === 'string' ? (
                <Text style={styles.title}>{title}</Text>
              ) : (
                title
              )
            ) : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {accessory}
        </View>
      ) : null}
    </View>
  );
}
