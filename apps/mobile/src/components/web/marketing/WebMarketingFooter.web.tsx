import { router, type Href } from 'expo-router';
import { Pressable, Text, type TextStyle, View } from 'react-native';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { PUBLIC_LEGAL_PATHS } from '@/constants/legal';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { navigateToWelcome } from '@/lib/publicRoutes';
import {
  webHover,
  webLinkUnderline,
  webOnlyStyle,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { webSectionEyebrowStyle } from '@/theme/web';

const FOOTER_YEAR = new Date().getFullYear();
const ONBOARDING_HREF = '/(onboarding)/role' as Href;
const SIGN_IN_HREF = '/(onboarding)/sign-in' as Href;

const PRODUCT_LINKS = [
  { label: 'For clinics', href: ONBOARDING_HREF },
  { label: 'For professionals', href: ONBOARDING_HREF },
  { label: 'Sign in', href: SIGN_IN_HREF },
] as const;

const LEGAL_LINKS = [
  { label: 'Privacy', path: 'privacy' as const },
  { label: 'Terms', path: 'terms' as const },
  { label: 'Support', path: 'support' as const },
] as const;

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    pressable: {
      paddingVertical: 5,
      paddingHorizontal: spacing.xs,
      marginLeft: -spacing.xs,
      borderRadius: 8,
      alignSelf: 'flex-start' as const,
      ...webPointer(),
    },
    label: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.pressable,
        webHover(hovered, pressed, webTextLinkHoverStyles(colors)),
        pressed && { opacity: 0.75 },
      ]}
    >
      {({ hovered }) => (
        <Text style={[styles.label, webLinkUnderline(hovered, colors.primary) as TextStyle]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ spacing }) => ({
    column: {
      gap: spacing.sm,
      minWidth: 128,
    },
    title: {
      ...webSectionEyebrowStyle(colors),
      marginBottom: spacing.xs,
    },
    links: {
      gap: 2,
    },
  }));

  return (
    <View style={styles.column}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.links}>{children}</View>
    </View>
  );
}

export function WebMarketingFooter() {
  const { isWide, isTablet } = useResponsiveLayout();
  const linkRow = isWide || isTablet;

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    outer: {
      width: '100%' as const,
      marginTop: spacing.xl * 1.5,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      backgroundColor: colors.surface,
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 28%)'
          : 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, transparent 28%)',
      } as object),
    },
    inner: {
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl * 1.5,
      paddingBottom: spacing.xl,
    },
    main: {
      flexDirection: linkRow ? ('row' as const) : ('column' as const),
      alignItems: linkRow ? ('flex-start' as const) : ('stretch' as const),
      justifyContent: linkRow ? ('space-between' as const) : ('flex-start' as const),
      gap: linkRow ? spacing.xl : spacing.xl,
    },
    brandColumn: {
      flexShrink: 0,
      alignItems: 'flex-start' as const,
      gap: spacing.sm,
      maxWidth: 280,
    },
    tagline: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
    linkColumns: {
      flexDirection: linkRow ? ('row' as const) : ('column' as const),
      gap: linkRow ? spacing.xl * 2 : spacing.lg,
      flexShrink: 0,
    },
    bottom: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      justifyContent: 'space-between' as const,
      alignItems: isWide ? ('center' as const) : ('flex-start' as const),
      gap: spacing.sm,
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    copyright: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
  }));

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <View style={styles.main}>
          <View style={styles.brandColumn}>
            <ChairsideWordmark variant="small" align="left" onPress={navigateToWelcome} />
            <Text style={styles.tagline}>
              Permanent roles and same-day fill-ins for dental teams. iOS app coming soon.
            </Text>
          </View>

          <View style={styles.linkColumns}>
            <FooterColumn title="Product">
              {PRODUCT_LINKS.map((link) => (
                <FooterLink key={link.label} label={link.label} onPress={() => router.push(link.href)} />
              ))}
            </FooterColumn>
            <FooterColumn title="Legal">
              {LEGAL_LINKS.map((link) => (
                <FooterLink
                  key={link.label}
                  label={link.label}
                  onPress={() => router.push(PUBLIC_LEGAL_PATHS[link.path])}
                />
              ))}
            </FooterColumn>
          </View>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.copyright}>© {FOOTER_YEAR} Chairside. All rights reserved.</Text>
          <Text style={styles.copyright}>Made for Canadian dental teams.</Text>
        </View>
      </View>
    </View>
  );
}
