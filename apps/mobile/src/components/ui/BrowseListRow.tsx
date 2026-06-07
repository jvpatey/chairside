import type { ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

export type ListingLayout = 'tile' | 'list';

type BrowseListRowProps = {
  avatar: ReactNode;
  eyebrow?: string | null;
  title: string;
  meta?: string | null;
  detail?: string | null;
  postedLabel?: string | null;
  /** Renders below the text block, aligned with the title column. */
  textFooter?: ReactNode;
  /** Renders on its own line at the bottom of the card content. */
  statusFooter?: ReactNode;
  /** Renders in the top-right, aligned with the title row. */
  topTrailing?: ReactNode;
  trailing?: ReactNode;
  footer?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
};

export function BrowseListRow({
  avatar,
  eyebrow,
  title,
  meta,
  detail,
  postedLabel,
  textFooter,
  statusFooter,
  topTrailing,
  trailing,
  footer,
  onPress,
  showChevron = true,
  isLast = false,
}: BrowseListRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      ...webPointer(),
    },
    rowSeparator: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: {
      backgroundColor: colors.fillSubtle,
    },
    textWrap: { flex: 1, gap: 2, minWidth: 0 },
    eyebrow: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    title: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    footer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    textFooter: {
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
    },
    statusFooterRow: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: spacing.xs,
      alignSelf: 'stretch',
    },
    trailingCol: {
      flexShrink: 0,
      alignItems: 'flex-end',
      alignSelf: 'stretch',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    trailingColCentered: {
      justifyContent: 'center',
    },
    trailingBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
  }));

  const mainRow = (
    <>
      {avatar}
      <View style={styles.textWrap}>
        {eyebrow ? (
          <Text style={styles.eyebrow} numberOfLines={1}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {detail ? (
          <Text style={styles.meta} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
        {postedLabel ? (
          <Text style={styles.meta} numberOfLines={1}>
            {postedLabel}
          </Text>
        ) : null}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
        {textFooter ? <View style={styles.textFooter}>{textFooter}</View> : null}
      </View>
      {topTrailing || trailing || showChevron ? (
        <View style={[styles.trailingCol, !topTrailing && styles.trailingColCentered]}>
          {topTrailing ?? null}
          {trailing || showChevron ? (
            <View style={styles.trailingBottom}>
              {trailing}
              {showChevron ? (
                <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );

  const content = (
    <>
      <View style={[styles.row, statusFooter ? { paddingBottom: 0 } : null]}>{mainRow}</View>
      {statusFooter ? <View style={styles.statusFooterRow}>{statusFooter}</View> : null}
    </>
  );

  const rowStyle = [!isLast && styles.rowSeparator];

  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed, hovered }) => [
        rowStyle,
        webHover(hovered, pressed, styles.rowHovered),
        pressed && styles.rowPressed,
      ]}>
      {content}
    </Pressable>
  );
}
