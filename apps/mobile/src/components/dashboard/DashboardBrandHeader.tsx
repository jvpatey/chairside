import { View } from 'react-native';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { useThemedStyles } from '@/theme';

/** Centered Chairside wordmark for phone dashboard entry screens. */
export function DashboardBrandHeader() {
  const styles = useThemedStyles(() => ({
    container: {
      width: '100%',
      alignItems: 'center',
    },
  }));

  return (
    <View style={styles.container}>
      <ChairsideWordmark variant="small" align="center" />
    </View>
  );
}
