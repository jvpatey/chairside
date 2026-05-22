import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type AuthPlaceholderNoteProps = {
  message?: string;
};

export function AuthPlaceholderNote({
  message = 'Sign-in will connect here once Supabase auth is added.',
}: AuthPlaceholderNoteProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    box: {
      backgroundColor: colors.primarySubtle,
      borderRadius: 10,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    text: {
      ...typography.subtitle,
      fontSize: 14,
      color: colors.primary,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.box}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}
