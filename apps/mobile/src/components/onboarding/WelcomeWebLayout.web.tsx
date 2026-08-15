import { useRef } from 'react';
import { Animated, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WebLandingCta } from '@/components/web/marketing/WebLandingCta.web';
import { WebLandingFaq } from '@/components/web/marketing/WebLandingFaq.web';
import { WebLandingFeatures } from '@/components/web/marketing/WebLandingFeatures.web';
import { WebLandingHero } from '@/components/web/marketing/WebLandingHero.web';
import { WebLandingPricing } from '@/components/web/marketing/WebLandingPricing.web';
import { WebMarketingFooter } from '@/components/web/marketing/WebMarketingFooter.web';
import { WebMarketingNav } from '@/components/web/marketing/WebMarketingNav.web';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useThemedStyles } from '@/theme';

export function WelcomeWebLayout() {
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
        <WebLandingHero />
        <WebLandingFeatures />
        <WebLandingPricing />
        <WebLandingFaq />
        <WebLandingCta />
        <WebMarketingFooter />
      </Animated.ScrollView>
    </View>
  );
}
