import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  DashboardWidgetIconBadge,
  type DashboardWidgetAccent,
} from '@/components/dashboard/DashboardWidgetIconBadge';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getElevationStyle } from '@/theme/tokens';

export type ProfileSettingsCardVariant = 'default' | 'danger';

export type ProfileSettingsCardProps = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconAccent?: DashboardWidgetAccent;
  children: ReactNode;
  variant?: ProfileSettingsCardVariant;
  style?: StyleProp<ViewStyle>;
  headerAccessory?: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
};

export function ProfileSettingsCard({
  title,
  icon,
  iconAccent = 'primary',
  children,
  variant = 'default',
  style,
  headerAccessory,
  collapsible = false,
  defaultExpanded = true,
}: ProfileSettingsCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isDanger = variant === 'danger';
  const iconColor = isDanger ? colors.destructive : colors.primary;

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
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
    headerMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 0,
      borderRadius: 10,
      marginHorizontal: -spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    headerHovered: webListRowHoverStyles(colors),
    headerPressed: {
      opacity: 0.88,
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

  const toggleExpanded = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((current) => !current);
  };

  const headerIcon = icon ? (
    isDanger ? (
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
    ) : (
      <DashboardWidgetIconBadge icon={icon} accent={iconAccent} />
    )
  ) : null;

  const headerTitle = <Text style={styles.title}>{title}</Text>;

  const header = collapsible ? (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
        accessibilityState={{ expanded }}
        onPress={toggleExpanded}
        style={({ pressed, hovered }) => [
          styles.headerMain,
          webHover(hovered, pressed, styles.headerHovered),
          pressed && styles.headerPressed,
        ]}>
        {headerIcon}
        {headerTitle}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.labelTertiary}
        />
      </Pressable>
      {headerAccessory ? <View style={styles.accessory}>{headerAccessory}</View> : null}
    </View>
  ) : (
    <View style={styles.header}>
      {headerIcon}
      {headerTitle}
      {headerAccessory ? <View style={styles.accessory}>{headerAccessory}</View> : null}
    </View>
  );

  return (
    <View style={[styles.card, style]}>
      {header}
      {!collapsible || expanded ? children : null}
    </View>
  );
}
