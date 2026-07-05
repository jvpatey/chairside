import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getElevationStyle } from '@/theme/tokens';

export type ProfileSettingsCardVariant = 'default' | 'danger';
export type ProfileStepAccent = 'primary' | 'secondary';

export function ProfileStepNumber({
  value,
  accent = 'primary',
}: {
  value: number;
  accent?: ProfileStepAccent;
}) {
  const { colors } = useTheme();
  const backgroundColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const textColor = accent === 'secondary' ? colors.secondaryOnSecondary : colors.primaryOnPrimary;

  const styles = useThemedStyles(() => ({
    wrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor,
    },
    label: {
      fontSize: 15,
      fontWeight: '700',
      color: textColor,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{value}</Text>
    </View>
  );
}

export type ProfileSettingsCardProps = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  stepNumber?: number;
  stepAccent?: ProfileStepAccent;
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
  stepNumber,
  stepAccent = 'primary',
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
    headerPressable: {
      borderRadius: 10,
      marginHorizontal: -spacing.xs,
      paddingHorizontal: spacing.xs,
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

  const resolvedAccessory = collapsible ? (
    <Ionicons
      name={expanded ? 'chevron-up' : 'chevron-down'}
      size={18}
      color={colors.labelTertiary}
    />
  ) : (
    headerAccessory
  );

  const header = (
    <View style={styles.header}>
      {stepNumber != null ? (
        <ProfileStepNumber value={stepNumber} accent={stepAccent} />
      ) : icon ? (
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {resolvedAccessory ? <View style={styles.accessory}>{resolvedAccessory}</View> : null}
    </View>
  );

  const toggleExpanded = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((current) => !current);
  };

  return (
    <View style={[styles.card, style]}>
      {collapsible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
          accessibilityState={{ expanded }}
          onPress={toggleExpanded}
          style={({ pressed, hovered }) => [
            styles.headerPressable,
            webHover(hovered, pressed, styles.headerHovered),
            pressed && styles.headerPressed,
          ]}>
          {header}
        </Pressable>
      ) : (
        header
      )}
      {!collapsible || expanded ? children : null}
    </View>
  );
}
