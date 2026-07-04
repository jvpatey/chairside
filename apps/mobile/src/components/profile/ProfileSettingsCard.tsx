import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';
import { getElevationStyle } from '@/theme/tokens';

export type ProfileSettingsCardVariant = 'default' | 'danger';

export type ProfileSettingsCardProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  variant?: ProfileSettingsCardVariant;
  style?: StyleProp<ViewStyle>;
  headerAccessory?: ReactNode;
};

export function ProfileSettingsCard({
  title,
  icon,
  children,
  variant = 'default',
  style,
  headerAccessory,
}: ProfileSettingsCardProps) {
  const { colors } = useTheme();
  const isDanger = variant === 'danger';
  const iconColor = isDanger ? colors.destructive : colors.primary;

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDanger ? `${colors.destructive}33` : colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
      ...getElevationStyle({ isDark, level: 'subtle' }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDanger ? `${colors.destructive}14` : colors.fillSubtle,
    },
    title: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '600',
      color: isDanger ? colors.destructive : colors.labelPrimary,
      flex: 1,
    },
    accessory: {
      flexShrink: 0,
    },
  }));

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {headerAccessory ? <View style={styles.accessory}>{headerAccessory}</View> : null}
      </View>
      {children}
    </View>
  );
}
