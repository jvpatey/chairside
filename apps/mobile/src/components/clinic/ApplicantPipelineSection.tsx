import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ApplicantPipelineSectionHeaderProps = {
  title: string;
  count: number;
  expanded: boolean;
  collapsible?: boolean;
  onToggle?: () => void;
};

export function ApplicantPipelineSectionHeader({
  title,
  count,
  expanded,
  collapsible = false,
  onToggle,
}: ApplicantPipelineSectionHeaderProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      borderRadius: 10,
      ...webPointer(onToggle ? 'pointer' : 'default'),
    },
    wrapHovered: webListRowHoverStyles(colors),
    wrapPressed: {
      opacity: 0.88,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.55,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    count: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
      backgroundColor: colors.fillSubtle,
      borderRadius: 999,
      overflow: 'hidden',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      minWidth: 22,
      textAlign: 'center',
    },
  }));

  const content = (
    <>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{count}</Text>
      </View>
      {collapsible ? (
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.labelTertiary}
        />
      ) : null}
    </>
  );

  if (!collapsible || !onToggle) {
    return <View style={styles.wrap}>{content}</View>;
  }

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.wrap,
        webHover(hovered, pressed, styles.wrapHovered),
        pressed && styles.wrapPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}>
      {content}
    </Pressable>
  );
}

type ApplicantPipelineSectionBlockProps = {
  title: string;
  count: number;
  expanded: boolean;
  collapsible?: boolean;
  onToggle?: () => void;
  children: ReactNode;
};

export function ApplicantPipelineSectionBlock({
  title,
  count,
  expanded,
  collapsible,
  onToggle,
  children,
}: ApplicantPipelineSectionBlockProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    section: {
      gap: spacing.sm,
    },
    list: {
      gap: spacing.md,
    },
  }));

  return (
    <View style={styles.section}>
      <ApplicantPipelineSectionHeader
        title={title}
        count={count}
        expanded={expanded}
        collapsible={collapsible}
        onToggle={onToggle}
      />
      {expanded ? <View style={styles.list}>{children}</View> : null}
    </View>
  );
}
