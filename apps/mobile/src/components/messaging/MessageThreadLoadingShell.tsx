import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { useThemedStyles } from '@/theme';

type MessageThreadLoadingShellProps = {
  onBack: () => void;
  title?: string;
  subtitle?: string;
};

export function MessageThreadLoadingShell({
  onBack,
  title = 'Messages',
  subtitle = 'Loading…',
}: MessageThreadLoadingShellProps) {
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + spacing.sm,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AuthScreenHeader title={title} subtitle={subtitle} onBack={onBack} />
      </View>
    </View>
  );
}
