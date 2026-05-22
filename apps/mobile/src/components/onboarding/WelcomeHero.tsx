import { Text, View } from 'react-native';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { ONBOARDING_SUBTITLE } from '@/constants';
import { useThemedStyles } from '@/theme';

export function WelcomeHero() {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    container: {
      alignItems: 'center',
      gap: spacing.md,
    },
    wordmarkWrap: {
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 17,
      textAlign: 'center',
      maxWidth: 320,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.wordmarkWrap}>
        <ChairsideWordmark variant="hero" />
      </View>
      <Text style={styles.subtitle}>{ONBOARDING_SUBTITLE}</Text>
    </View>
  );
}
