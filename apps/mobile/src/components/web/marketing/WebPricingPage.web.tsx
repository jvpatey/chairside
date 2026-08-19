import { useRef } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WebLandingPricing } from '@/components/web/marketing/WebLandingPricing.web';
import { WebMarketingFooter } from '@/components/web/marketing/WebMarketingFooter.web';
import { WebMarketingNav } from '@/components/web/marketing/WebMarketingNav.web';
import { WebPublicHeroAtmosphere } from '@/components/web/marketing/WebPublicHeroAtmosphere.web';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useThemedStyles } from '@/theme';

export function WebPricingPage() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const styles = useThemedStyles(({ colors }) => ({
    page: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    scrollContent: {
      flexGrow: 1,
      width: '100%' as const,
      alignSelf: 'stretch' as const,
      paddingBottom: insets.bottom,
    },
    pricing: {
      position: 'relative' as const,
      overflow: 'hidden' as const,
      paddingTop: insets.top + 88,
    },
  }));

  return (
    <View style={styles.page}>
      <WebMarketingNav scrollY={scrollY} />
      <Animated.ScrollView
        style={[styles.page, webScrollbarStyles()]}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pricing}>
          <WebPublicHeroAtmosphere />
          <WebLandingPricing />
        </View>
        <WebMarketingFooter />
      </Animated.ScrollView>
    </View>
  );
}
