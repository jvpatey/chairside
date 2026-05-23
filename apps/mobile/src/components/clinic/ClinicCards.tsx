import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { getTimeOfDayGreeting } from '@/lib/greeting';
import { useTheme, useThemedStyles } from '@/theme';

type SetupBannerProps = {
  onPress: () => void;
};

export function SetupBanner({ onPress }: SetupBannerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.primarySubtle,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    body: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="business" size={20} color={colors.primaryOnPrimary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Complete your clinic profile</Text>
          <Text style={styles.body}>
            Add practice details to unlock posting roles and fill-in shifts.
          </Text>
        </View>
      </View>
      <OnboardingButton label="Continue setup" onPress={onPress} />
    </View>
  );
}

type DashboardHeroProps = {
  clinicName?: string | null;
};

export function DashboardHero({ clinicName }: DashboardHeroProps) {
  const greeting = getTimeOfDayGreeting();
  const displayName = clinicName?.trim();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    greeting: {
      ...typography.subtitle,
      fontSize: 15,
    },
    name: {
      ...typography.title,
      fontSize: 26,
      lineHeight: 32,
      minHeight: 32,
    },
    nameHidden: {
      opacity: 0,
    },
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text
        style={[styles.name, !displayName && styles.nameHidden]}
        numberOfLines={1}
        accessibilityElementsHidden={!displayName}
        importantForAccessibility={displayName ? 'yes' : 'no-hide-descendants'}>
        {displayName || 'Clinic name'}
      </Text>
    </View>
  );
}

type SectionHeaderProps = {
  title: string;
};

export function SectionHeader({ title }: SectionHeaderProps) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    header: {
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: typography.subtitle.color,
    },
  }));

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

type QuickActionTileProps = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
};

export function QuickActionTile({
  label,
  description,
  icon,
  variant = 'primary',
  onPress,
}: QuickActionTileProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    tile: {
      flex: 1,
      borderRadius: 16,
      padding: spacing.md,
      gap: spacing.sm,
      minHeight: 112,
      borderWidth: 1,
      borderColor: isPrimary ? colors.primary : colors.separator,
      backgroundColor: isPrimary ? colors.primary : colors.surface,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isPrimary ? 'rgba(255,255,255,0.2)' : colors.fillSubtle,
    },
    label: {
      ...typography.body,
      fontWeight: '600',
      fontSize: 15,
      color: isPrimary ? colors.primaryOnPrimary : colors.labelPrimary,
    },
    description: {
      fontSize: 12,
      lineHeight: 16,
      color: isPrimary ? 'rgba(255,255,255,0.85)' : colors.labelSecondary,
    },
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9 }]}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={icon}
          size={20}
          color={isPrimary ? colors.primaryOnPrimary : colors.primary}
        />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

type StatGridProps = {
  openRoles: number;
  fillInsPosted: number;
  newApplications: number;
  onOpenRolesPress: () => void;
  onFillInsPress: () => void;
  onApplicationsPress: () => void;
};

export function StatGrid({
  openRoles,
  fillInsPosted,
  newApplications,
  onOpenRolesPress,
  onFillInsPress,
  onApplicationsPress,
}: StatGridProps) {
  const stats = [
    { label: 'Open roles', value: openRoles, onPress: onOpenRolesPress },
    { label: 'Fill-ins', value: fillInsPosted, onPress: onFillInsPress },
    {
      label: 'Applications',
      value: newApplications,
      onPress: onApplicationsPress,
      highlight: newApplications > 0,
    },
  ];

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    grid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cell: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: spacing.xs,
    },
    cellHighlight: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    value: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 28,
    },
    valueHighlight: {
      color: colors.primary,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.labelSecondary,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <Pressable
          key={stat.label}
          accessibilityRole="button"
          accessibilityLabel={`${stat.label}: ${stat.value}`}
          onPress={stat.onPress}
          style={({ pressed }) => [
            styles.cell,
            stat.highlight && styles.cellHighlight,
            pressed && { opacity: 0.85 },
          ]}>
          <Text style={[styles.value, stat.highlight && styles.valueHighlight]}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

type ActivityEmptyStateProps = {
  hasApplications: boolean;
};

export function ActivityEmptyState({ hasApplications }: ActivityEmptyStateProps) {
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
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.fillSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
      textAlign: 'center',
    },
    body: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={hasApplications ? 'notifications' : 'calendar-outline'}
          size={24}
          color={colors.labelSecondary}
        />
      </View>
      <Text style={styles.title}>
        {hasApplications ? 'New applications waiting' : 'No recent activity'}
      </Text>
      <Text style={styles.body}>
        {hasApplications
          ? 'Head to Applications to review candidates for your postings.'
          : 'Publish a role or fill-in shift to start receiving applications.'}
      </Text>
    </View>
  );
}
