import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, type ViewProps } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type ProfileSectionProps = ViewProps & {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
};

export function ProfileSection({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  children,
  style,
  ...rest
}: ProfileSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing, typography }) => ({
    wrap: { gap: spacing.md },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerText: { flex: 1, gap: spacing.xs },
    title: { ...typography.body, fontWeight: '700', fontSize: 17 },
    subtitle: { ...typography.subtitle, fontSize: 14, lineHeight: 20 },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingTop: 2,
    },
    actionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {actionLabel && onActionPress ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            style={styles.action}
            onPress={onActionPress}>
            <Text style={styles.actionLabel}>{actionLabel}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
