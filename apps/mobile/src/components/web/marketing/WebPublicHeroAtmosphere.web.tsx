import { StyleSheet, View } from 'react-native';

import { PageHeroGlow } from '@/components/ui/PageHeroGlow';

/** Primary-blue hero wash for public legal/support pages on web (matches dashboard atmosphere). */
export function WebPublicHeroAtmosphere() {
  return (
    <View style={styles.root} pointerEvents="none">
      <PageHeroGlow variant="form" accent="primary" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
