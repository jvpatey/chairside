import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useTheme, useThemedStyles } from '@/theme';

type PublicPageCardHeaderProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
};

export function PublicPageCardHeader({ icon, title, subtitle }: PublicPageCardHeaderProps) {
  const { colors } = useTheme();
  const { isCompact } = useResponsiveLayout();
  const iconSize = isCompact ? 40 : 44;
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: isCompact ? spacing.sm : spacing.md,
    },
    iconWrap: {
      width: iconSize,
      height: iconSize,
      borderRadius: isCompact ? 10 : 12,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexShrink: 0,
    },
    textBlock: {
      flex: 1,
      gap: spacing.xs,
      paddingTop: 2,
    },
    title: {
      ...typography.body,
      fontSize: isCompact ? 18 : 20,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: isCompact ? 14 : 15,
      lineHeight: isCompact ? 20 : 22,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={isCompact ? 20 : 22} color={colors.primary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}
