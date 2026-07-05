import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import {
  ProfileSettingsCard,
  type ProfileSettingsCardProps,
} from '@/components/profile/ProfileSettingsCard';
import { useTheme, useThemedStyles } from '@/theme';

export type ProfileDetailSectionIcon = keyof typeof Ionicons.glyphMap;

export function profileSettingsHintStyle({
  typography,
  colors,
}: {
  typography: { subtitle: object };
  colors: { labelSecondary: string };
}) {
  return {
    ...typography.subtitle,
    fontSize: 14,
    lineHeight: 20,
    color: colors.labelSecondary,
  };
}

export function ProfileSummaryBanner({
  icon,
  title,
  children,
}: {
  icon: ProfileDetailSectionIcon;
  title: string;
  children: ReactNode;
}) {
  const styles = useThemedStyles(({ spacing }) => ({
    body: { gap: spacing.md },
  }));

  return (
    <ProfileSettingsCard title={title} icon={icon}>
      <View style={styles.body}>{children}</View>
    </ProfileSettingsCard>
  );
}

export function ProfileEmptyState({
  icon,
  title,
  description,
}: {
  icon: ProfileDetailSectionIcon;
  title: string;
  description: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      marginBottom: spacing.xs,
    },
    title: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '600',
      color: colors.labelPrimary,
      textAlign: 'center',
    },
    description: profileSettingsHintStyle({ typography, colors }),
  }));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.description, { textAlign: 'center' }]}>{description}</Text>
    </View>
  );
}

export function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: ProfileDetailSectionIcon;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    stat: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
      padding: spacing.sm + 2,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.labelTertiary,
    },
    statValue: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
  }));

  return (
    <View style={styles.stat}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={13} color={colors.labelTertiary} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function SectionPanel({
  icon,
  stepNumber,
  stepAccent,
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
  variant = 'default',
}: Pick<
  ProfileSettingsCardProps,
  | 'icon'
  | 'stepNumber'
  | 'stepAccent'
  | 'title'
  | 'collapsible'
  | 'defaultExpanded'
  | 'variant'
> & {
  children: ReactNode;
}) {
  const styles = useThemedStyles(({ spacing }) => ({
    body: { gap: spacing.xs },
  }));

  return (
    <ProfileSettingsCard
      title={title}
      icon={icon}
      stepNumber={stepNumber}
      stepAccent={stepAccent}
      collapsible={collapsible}
      defaultExpanded={defaultExpanded}
      variant={variant}>
      <View style={styles.body}>{children}</View>
    </ProfileSettingsCard>
  );
}

export function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const styles = useThemedStyles(({ spacing, colors, typography }) => ({
    field: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
      color: colors.labelTertiary,
    },
  }));

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function FieldValue({ value }: { value: string | null | undefined }) {
  const styles = useThemedStyles(({ colors, typography }) => ({
    value: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelPrimary,
    },
    empty: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelTertiary,
      fontStyle: 'italic',
    },
  }));

  const display = value?.trim();
  return <Text style={display ? styles.value : styles.empty}>{display || 'Not added yet'}</Text>;
}

export function FieldDivider() {
  const styles = useThemedStyles(({ colors }) => ({
    divider: {
      height: 1,
      backgroundColor: colors.separator,
      opacity: 0.55,
    },
  }));

  return <View style={styles.divider} />;
}

export function ProfileDetailStack({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(({ spacing }) => ({
    wrap: { gap: spacing.lg },
  }));

  return <View style={styles.wrap}>{children}</View>;
}

export function SummaryStatRow({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  }));

  return <View style={styles.row}>{children}</View>;
}

export function ProfileTagRow({
  tags,
  emptyText = 'Not added yet',
}: {
  tags: string[];
  emptyText?: string;
}) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    tag: {
      borderRadius: 999,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 4,
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    tagText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    empty: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelTertiary,
      fontStyle: 'italic',
    },
  }));

  if (tags.length === 0) {
    return <Text style={styles.empty}>{emptyText}</Text>;
  }

  return (
    <View style={styles.wrap}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}
