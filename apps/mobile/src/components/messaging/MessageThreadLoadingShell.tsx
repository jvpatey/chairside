import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { useTabAtmosphere, useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
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
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const showTabAtmosphere = tabAtmosphere !== 'none';
  const paintOwnAtmosphere = showTabAtmosphere;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    container: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor: showTabAtmosphere ? 'transparent' : colors.background,
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
      {paintOwnAtmosphere ? (
        <AppAtmosphere intensity={tabAtmosphere} accent={tabAtmosphereAccent} />
      ) : null}
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
