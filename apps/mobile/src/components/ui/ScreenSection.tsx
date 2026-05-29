import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { RowDivider } from '@/components/clinic/DetailCard';
import { useTheme, useThemedStyles } from '@/theme';

type ScreenSectionProps = ViewProps & {
  sectionLabel: string;
  description?: string;
  collapsible?: boolean;
  subtitle?: string;
  collapsedSummary?: string;
  defaultExpanded?: boolean;
  actionLabel?: string;
  onActionPress?: () => void;
  /** Shown on the collapsible header row when collapsed (e.g. Edit schedule). */
  collapsedActionLabel?: string;
  onCollapsedActionPress?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function ScreenSection({
  sectionLabel,
  description,
  collapsible = false,
  subtitle,
  collapsedSummary,
  defaultExpanded = true,
  actionLabel,
  onActionPress,
  collapsedActionLabel,
  onCollapsedActionPress,
  contentStyle,
  children,
  style,
  ...rest
}: ScreenSectionProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hasUserToggled, setHasUserToggled] = useState(false);

  useEffect(() => {
    if (!collapsible || hasUserToggled) return;
    setExpanded(defaultExpanded);
  }, [collapsible, defaultExpanded, hasUserToggled]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: { gap: spacing.sm },
    meta: { gap: spacing.xs, paddingHorizontal: spacing.xs },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    description: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
    surface: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    headerMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    headerAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: spacing.xs,
      paddingLeft: spacing.sm,
    },
    headerText: { flex: 1, gap: spacing.xs },
    headerSubtitle: { ...typography.subtitle, fontSize: 14, lineHeight: 20 },
    collapsedSummary: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
    },
    toggleHit: {
      minWidth: 28,
      minHeight: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      minHeight: 44,
    },
    actionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    body: {
      gap: spacing.md,
      padding: spacing.md,
      paddingTop: 0,
    },
    bodyFlush: {
      gap: spacing.md,
      padding: spacing.md,
    },
  }));

  const toggle = () => {
    setHasUserToggled(true);
    setExpanded((open) => !open);
  };

  const showBody = !collapsible || expanded;
  const showCollapsibleHeader = collapsible;
  const bodyPadding = collapsible ? styles.body : styles.bodyFlush;

  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View style={styles.meta}>
        <Text style={styles.sectionLabel}>{sectionLabel}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>

      <View style={styles.surface}>
        {showCollapsibleHeader ? (
          <>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                style={styles.headerMain}
                onPress={toggle}>
                <View style={styles.headerText}>
                  <Text style={expanded ? styles.headerSubtitle : styles.collapsedSummary}>
                    {expanded
                      ? (subtitle ?? description ?? sectionLabel)
                      : (collapsedSummary ?? description ?? sectionLabel)}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.headerActions}>
                {!expanded && collapsedActionLabel && onCollapsedActionPress ? (
                  <Pressable
                    accessibilityRole="button"
                    style={styles.headerAction}
                    onPress={onCollapsedActionPress}>
                    <Text style={styles.actionLabel}>{collapsedActionLabel}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={expanded ? 'Collapse section' : 'Expand section'}
                  style={styles.toggleHit}
                  onPress={toggle}>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.labelTertiary}
                  />
                </Pressable>
              </View>
            </View>
            {expanded && actionLabel && onActionPress ? (
              <>
                <RowDivider />
                <Pressable
                  accessibilityRole="button"
                  style={styles.actionRow}
                  onPress={onActionPress}>
                  <Text style={styles.actionLabel}>{actionLabel}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </Pressable>
              </>
            ) : null}
          </>
        ) : null}

        {showBody && children ? (
          <>
            {showCollapsibleHeader ? (
              <>
                <RowDivider />
                <View style={[bodyPadding, contentStyle]}>{children}</View>
              </>
            ) : (
              <View style={[bodyPadding, contentStyle]}>{children}</View>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
}
