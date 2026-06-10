import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type MessageThreadPlaceholderProps = {
  role: 'worker' | 'clinic';
  /** True when inbox has rows but none is selected (filtered empty, etc.). */
  filteredEmpty?: boolean;
};

export function MessageThreadPlaceholder({
  role,
  filteredEmpty = false,
}: MessageThreadPlaceholderProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ spacing, typography }) => ({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
    },
    title: {
      ...typography.body,
      fontSize: 18,
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

  const copy =
    role === 'worker'
      ? {
          title: filteredEmpty ? 'No matching conversations' : 'No messages yet',
          body: filteredEmpty
            ? 'Try a different filter to see more conversations.'
            : 'When you message a clinic or apply for a role, your conversations will appear here.',
        }
      : {
          title: filteredEmpty ? 'No matching conversations' : 'No messages yet',
          body: filteredEmpty
            ? 'Try a different filter to see more conversations.'
            : 'When applicants reach out or you message them, conversations will appear here.',
        };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="chatbubbles-outline" size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
    </View>
  );
}
