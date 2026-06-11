import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { RowDivider } from '@/components/clinic/DetailCard';
import { EditPillButton } from '@/components/ui/EditPillButton';
import {
  webFullBleedRowInsets,
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

export type CollapsedSummaryTone = 'positive' | 'negative';

export type CollapsedSummaryContent =
  | string
  | {
      primary: string;
      primaryLabel?: string;
      primaryTone?: CollapsedSummaryTone;
      secondary?: string;
      secondaryLabel?: string;
    };

type ScreenSectionProps = ViewProps & {
  sectionLabel: string;
  description?: string;
  collapsible?: boolean;
  subtitle?: string;
  collapsedSummary?: CollapsedSummaryContent;
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
    headerCollapsed: {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: 0,
      paddingBottom: 0,
    },
    headerMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: 10,
      ...webFullBleedRowInsets(spacing.md),
      ...webPointer(),
    },
    headerMainHovered: webListRowHoverStyles(colors),
    headerMainPressed: {
      opacity: 0.88,
    },
    headerMainCollapsed: {
      alignItems: 'flex-start',
      paddingBottom: spacing.md,
    },
    headerText: { flex: 1, gap: spacing.sm },
    headerSubtitle: { ...typography.subtitle, fontSize: 14, lineHeight: 20 },
    collapsedDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    collapsedDetailLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
      minWidth: 72,
    },
    collapsedDetailValue: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      flex: 1,
    },
    collapsedDetailValuePositive: {
      color: colors.success,
      fontWeight: '600',
    },
    collapsedDetailValueNegative: {
      color: colors.destructive,
      fontWeight: '600',
    },
    collapsedSummary: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
    },
    collapsedActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
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
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
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

  const collapsedContent =
    typeof collapsedSummary === 'string'
      ? { primary: collapsedSummary, secondary: undefined }
      : collapsedSummary;

  const collapsedPrimary =
    collapsedContent?.primary ?? description ?? sectionLabel;
  const collapsedPrimaryLabel =
    collapsedContent && typeof collapsedContent !== 'string'
      ? collapsedContent.primaryLabel
      : undefined;
  const collapsedPrimaryTone =
    collapsedContent && typeof collapsedContent !== 'string'
      ? collapsedContent.primaryTone
      : undefined;
  const collapsedSecondary = collapsedContent?.secondary;
  const collapsedSecondaryLabel =
    collapsedContent && typeof collapsedContent !== 'string'
      ? collapsedContent.secondaryLabel
      : undefined;

  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View style={styles.meta}>
        <Text style={styles.sectionLabel}>{sectionLabel}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>

      <View style={styles.surface}>
        {showCollapsibleHeader ? (
          <>
            <View style={[styles.header, !expanded && styles.headerCollapsed]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                style={({ pressed, hovered }) => [
                  styles.headerMain,
                  !expanded && styles.headerMainCollapsed,
                  webHover(hovered, pressed, styles.headerMainHovered),
                  pressed && styles.headerMainPressed,
                ]}
                onPress={toggle}>
                <View style={styles.headerText}>
                  {expanded ? (
                    <Text style={styles.headerSubtitle}>
                      {subtitle ?? description ?? sectionLabel}
                    </Text>
                  ) : collapsedSecondary ? (
                    <>
                      {collapsedPrimaryLabel ? (
                        <View style={styles.collapsedDetailRow}>
                          <Text style={styles.collapsedDetailLabel}>{collapsedPrimaryLabel}</Text>
                          <Text
                            style={[
                              styles.collapsedDetailValue,
                              collapsedPrimaryTone === 'positive' &&
                                styles.collapsedDetailValuePositive,
                              collapsedPrimaryTone === 'negative' &&
                                styles.collapsedDetailValueNegative,
                            ]}>
                            {collapsedPrimary}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.collapsedSummary}>{collapsedPrimary}</Text>
                      )}
                      <View style={styles.collapsedDetailRow}>
                        {collapsedSecondaryLabel ? (
                          <Text style={styles.collapsedDetailLabel}>
                            {collapsedSecondaryLabel}
                          </Text>
                        ) : null}
                        <Text style={styles.collapsedDetailValue}>{collapsedSecondary}</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.collapsedSummary}>{collapsedPrimary}</Text>
                  )}
                </View>
                <View style={styles.toggleHit}>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.labelTertiary}
                  />
                </View>
              </Pressable>
              {!expanded && collapsedActionLabel && onCollapsedActionPress ? (
                <>
                  <RowDivider />
                  <View style={styles.collapsedActionRow}>
                    <EditPillButton
                      label={collapsedActionLabel}
                      onPress={onCollapsedActionPress}
                    />
                  </View>
                </>
              ) : null}
            </View>
            {expanded && actionLabel && onActionPress ? (
              <>
                <RowDivider />
                <View style={styles.actionRow}>
                  <EditPillButton label={actionLabel} onPress={onActionPress} />
                </View>
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
