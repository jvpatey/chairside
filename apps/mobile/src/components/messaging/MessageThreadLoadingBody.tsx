import { ActivityIndicator, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

/** Inline loading body for an open message thread. */
export function MessageThreadLoadingBody() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing }) => ({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.xl,
    },
  }));

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="small" />
    </View>
  );
}
