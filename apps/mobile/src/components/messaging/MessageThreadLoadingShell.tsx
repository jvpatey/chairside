import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { useThemedStyles } from '@/theme';

type MessageThreadLoadingShellProps = {
  onBack: () => void;
  title?: string;
};

export function MessageThreadLoadingShell({
  onBack,
  title = 'Messages',
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
    body: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <AuthScreenHeader title={title} onBack={onBack} />
        </View>
        <View style={styles.body}>
          <PageLoadingDetail />
        </View>
      </View>
    </View>
  );
}
