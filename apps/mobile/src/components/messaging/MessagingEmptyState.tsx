import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type MessagingEmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  compact?: boolean;
};

/** Branded empty state for messaging inbox and thread surfaces. */
export function MessagingEmptyState({
  icon = 'chatbubbles-outline',
  title,
  body,
  compact = false,
}: MessagingEmptyStateProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ spacing, typography }) => ({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: compact ? spacing.lg : spacing.xl,
      paddingVertical: compact ? spacing.lg : spacing.xl,
      gap: spacing.md,
    },
    iconWrap: {
      width: compact ? 48 : 56,
      height: compact ? 48 : 56,
      borderRadius: compact ? 24 : 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
    },
    title: {
      ...typography.body,
      fontSize: compact ? 16 : 18,
      fontWeight: '700',
      color: colors.labelPrimary,
      textAlign: 'center',
    },
    body: {
      ...typography.subtitle,
      textAlign: 'center',
      maxWidth: 320,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={compact ? 24 : 28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}
