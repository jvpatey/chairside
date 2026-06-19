import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type WorkerMapUnavailableProps = {
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function WorkerMapUnavailable({
  title,
  body,
  icon = 'map-outline',
}: WorkerMapUnavailableProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      flex: 1,
      minHeight: 320,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
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
    title: { ...typography.body, fontWeight: '600', textAlign: 'center' },
    body: { ...typography.subtitle, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={colors.labelSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}
