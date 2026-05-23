import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type AuthScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
};

export function AuthScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
}: AuthScreenHeaderProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    back: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      marginBottom: spacing.xs,
      minHeight: 44,
      justifyContent: 'center',
    },
    backText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    title: {
      ...typography.title,
      fontSize: 28,
    },
    subtitle: typography.subtitle,
    placeholder: {
      height: 44,
    },
  }));

  return (
    <View style={styles.wrap}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={styles.back}>
          <Text style={styles.backText}>{backLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
