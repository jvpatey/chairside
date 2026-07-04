import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ROLE_OPTIONS } from '@/constants';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

const TRUST_POINTS = [
  'Same-day fill-ins',
  'Apply in one tap',
  'Start free',
] as const;

const PATH_ACCENTS = {
  worker: 'secondary' as const,
  clinic: 'primary' as const,
};

function PathCard({
  title,
  description,
  icon,
  accent,
}: {
  title: string;
  description: string;
  icon: (typeof ROLE_OPTIONS)[number]['icon'];
  accent: 'primary' | 'secondary';
}) {
  const { colors } = useTheme();
  const tint = accent === 'primary' ? colors.primary : colors.secondary;

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      flex: 1,
      minWidth: 0,
      borderRadius: 16,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: spacing.sm,
      overflow: 'hidden' as const,
      position: 'relative' as const,
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
    },
    wash: {
      ...webOnlyStyle({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        backgroundImage:
          accent === 'primary'
            ? isDark
              ? 'radial-gradient(ellipse 90% 70% at 0% 0%, rgba(74, 154, 255, 0.16) 0%, transparent 62%)'
              : 'radial-gradient(ellipse 90% 70% at 0% 0%, rgba(26, 111, 212, 0.1) 0%, transparent 62%)'
            : isDark
              ? 'radial-gradient(ellipse 90% 70% at 100% 0%, rgba(152, 150, 255, 0.16) 0%, transparent 62%)'
              : 'radial-gradient(ellipse 90% 70% at 100% 0%, rgba(88, 86, 214, 0.1) 0%, transparent 62%)',
      } as object),
    },
    content: {
      zIndex: 1,
      gap: spacing.xs,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    description: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.wash} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Ionicons name={icon} size={20} color={tint} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

export function AuthWebRolePathsVisual() {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      width: '100%' as const,
      gap: spacing.lg,
    },
    paths: {
      flexDirection: 'row' as const,
      gap: spacing.md,
    },
    trust: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    trustRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    trustText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.paths}>
        {ROLE_OPTIONS.map((option) => (
          <PathCard
            key={option.role}
            title={option.title}
            description={option.description}
            icon={option.icon}
            accent={PATH_ACCENTS[option.role]}
          />
        ))}
      </View>
      <View style={styles.trust}>
        {TRUST_POINTS.map((point) => (
          <View key={point} style={styles.trustRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.trustText}>{point}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
