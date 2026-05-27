import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

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

  const styles = useThemedStyles(({ spacing, typography }) => ({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    title: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    count: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
      backgroundColor: colors.fillSubtle,
      borderRadius: 999,
      overflow: 'hidden',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      minWidth: 24,
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
          size={18}
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
      style={styles.wrap}
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
