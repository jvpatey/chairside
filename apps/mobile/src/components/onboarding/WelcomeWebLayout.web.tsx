import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WebLandingCtaStrip } from '@/components/web/marketing/WebLandingCtaStrip.web';
import { WebLandingFaq } from '@/components/web/marketing/WebLandingFaq.web';
import { WebLandingHero } from '@/components/web/marketing/WebLandingHero.web';
import { WebLandingStory } from '@/components/web/marketing/WebLandingStory.web';
import { WebMarketingFooter } from '@/components/web/marketing/WebMarketingFooter.web';
import { WebMarketingNav } from '@/components/web/marketing/WebMarketingNav.web';
import {
  WebMarketingScrollProvider,
  useWebMarketingScroll,
} from '@/components/web/marketing/WebMarketingScrollContext.web';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useThemedStyles } from '@/theme';

/** Old Features deep-links land on How it works after the features section was removed. */
function resolveWelcomeSection(section: string | undefined) {
  if (!section) return null;
  if (section === 'features') return 'how-it-works';
  return section;
}

function WelcomeWebLayoutInner() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { section } = useLocalSearchParams<{ section?: string }>();
  const marketingScroll = useWebMarketingScroll();

  useEffect(() => {
    const target = resolveWelcomeSection(section);
    if (!target || !marketingScroll) return;
    const timer = window.setTimeout(() => {
      marketingScroll.scrollToSection(target);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [section, marketingScroll]);

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
      <WebMarketingNav
        scrollY={scrollY}
        onSectionPress={marketingScroll?.scrollToSection}
      />
      <Animated.ScrollView
        ref={(node) => {
          marketingScroll?.setScrollRef(node as never);
        }}
        style={[styles.page, webScrollbarStyles()]}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        showsVerticalScrollIndicator={false}
      >
        <View
          collapsable={false}
          ref={(node) => {
            marketingScroll?.setContentRef(node);
          }}
        >
          <WebLandingHero />
          <WebLandingStory />
          <WebLandingFaq />
          <WebLandingCtaStrip />
          <WebMarketingFooter />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

export function WelcomeWebLayout() {
  return (
    <WebMarketingScrollProvider>
      <WelcomeWebLayoutInner />
    </WebMarketingScrollProvider>
  );
}
