import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

export type ProfileDetailSectionIcon = keyof typeof Ionicons.glyphMap;

export function ProfileSummaryBanner({
  icon,
  title,
  children,
}: {
  icon: ProfileDetailSectionIcon;
  title: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    summary: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
  }));

  return (
    <View style={styles.summary}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </View>
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
  const styles = useThemedStyles(({ colors, spacing }) => ({
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
      backgroundColor: colors.primarySubtle,
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.labelPrimary,
      textAlign: 'center',
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
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
  const styles = useThemedStyles(({ colors, spacing }) => ({
    stat: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
      padding: spacing.sm + 2,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    statValue: {
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
  title,
  children,
}: {
  icon: ProfileDetailSectionIcon;
  title: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    panel: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
    },
    title: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
    body: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.xs,
    },
  }));

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={17} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

export function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const styles = useThemedStyles(({ spacing, colors }) => ({
    field: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
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
  const styles = useThemedStyles(({ colors }) => ({
    value: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelPrimary,
    },
    empty: {
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
    wrap: { gap: spacing.md },
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
