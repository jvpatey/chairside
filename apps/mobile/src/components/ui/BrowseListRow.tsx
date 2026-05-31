import type { ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

export type ListingLayout = 'tile' | 'list';

type BrowseListRowProps = {
  avatar: ReactNode;
  eyebrow?: string | null;
  title: string;
  meta?: string | null;
  detail?: string | null;
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
    },
    rowSeparator: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
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

  const content = (
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
        {footer ? <View style={styles.footer}>{footer}</View> : null}
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

  const rowStyle = [styles.row, !isLast && styles.rowSeparator];

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
      style={({ pressed }) => [rowStyle, pressed && styles.rowPressed]}>
      {content}
    </Pressable>
  );
}
