import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import type { LegalPageContent } from '@/content/legal/types';
import { LEGAL_LAST_UPDATED, PUBLIC_LEGAL_PATHS, SUPPORT_EMAIL } from '@/constants/legal';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type LegalPageLayoutProps = {
  content: LegalPageContent;
  currentPath: keyof typeof PUBLIC_LEGAL_PATHS;
};

const FOOTER_LINKS: { path: keyof typeof PUBLIC_LEGAL_PATHS; label: string }[] = [
  { path: 'privacy', label: 'Privacy' },
  { path: 'support', label: 'Support' },
  { path: 'terms', label: 'Terms' },
];

function LegalBodyText({ children }: { children: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ typography, spacing }) => ({
    text: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 24,
      color: colors.labelSecondary,
      marginBottom: spacing.sm,
    },
    link: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
  }));

  if (children.includes(SUPPORT_EMAIL)) {
    const parts = children.split(SUPPORT_EMAIL);
    return (
      <Text style={styles.text}>
        {parts[0]}
        <Text
          style={styles.link}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          accessibilityRole="link">
          {SUPPORT_EMAIL}
        </Text>
        {parts[1] ?? ''}
      </Text>
    );
  }

  return <Text style={styles.text}>{children}</Text>;
}

export function LegalPageLayout({ content, currentPath }: LegalPageLayoutProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    page: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      paddingBottom: insets.bottom + spacing.xl,
      alignSelf: 'center' as const,
      width: '100%' as const,
      maxWidth: CONTENT_MAX_WIDTH.regular,
    },
    headerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: spacing.xl,
      gap: spacing.md,
    },
    backPressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: 8,
      ...webPointer(),
    },
    backHovered: webTextLinkHoverStyles(colors),
    backText: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    title: {
      ...typography.title,
      fontSize: 32,
      lineHeight: 38,
      marginBottom: spacing.xs,
      color: colors.labelPrimary,
    },
    updated: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.labelTertiary,
      marginBottom: spacing.lg,
    },
    intro: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 26,
      color: colors.labelSecondary,
      marginBottom: spacing.xl,
    },
    section: {
      marginBottom: spacing.xl,
      gap: spacing.sm,
    },
    sectionTitle: {
      ...typography.body,
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
      marginBottom: spacing.xs,
    },
    bulletRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      paddingRight: spacing.sm,
    },
    bullet: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 24,
      color: colors.labelTertiary,
      width: 16,
    },
    bulletText: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 24,
      color: colors.labelSecondary,
      flex: 1,
    },
    footer: {
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
    },
    footerDivider: {
      fontSize: 13,
      color: colors.labelTertiary,
    },
    footerLinkPressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    footerLinkHovered: webTextLinkHoverStyles(colors),
    footerLink: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
    },
    footerLinkActive: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    copyright: {
      fontSize: 13,
      color: colors.labelTertiary,
    },
  }));

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerRow}>
        <ChairsideWordmark variant="small" align="left" />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Back to home"
          onPress={() => router.push('/(onboarding)/welcome')}
          style={({ pressed, hovered }) => [
            styles.backPressable,
            webHover(hovered, pressed, styles.backHovered),
            pressed && { opacity: 0.75 },
          ]}>
          <Text style={styles.backText}>Home</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</Text>
      {content.intro ? <Text style={styles.intro}>{content.intro}</Text> : null}

      {content.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.paragraphs?.map((paragraph) => (
            <LegalBodyText key={paragraph}>{paragraph}</LegalBodyText>
          ))}
          {section.bullets?.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.footer}>
        {FOOTER_LINKS.map((link, index) => (
          <View key={link.path} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {index > 0 ? (
              <Text style={styles.footerDivider} accessibilityElementsHidden>
                ·
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push(PUBLIC_LEGAL_PATHS[link.path])}
              style={({ pressed, hovered }) => [
                styles.footerLinkPressable,
                webHover(hovered, pressed, styles.footerLinkHovered),
                pressed && { opacity: 0.75 },
              ]}>
              <Text
                style={[
                  styles.footerLink,
                  link.path === currentPath && styles.footerLinkActive,
                ]}>
                {link.label}
              </Text>
            </Pressable>
          </View>
        ))}
        <Text style={styles.footerDivider}>·</Text>
        <Text style={styles.copyright}>© {new Date().getFullYear()} Chairside</Text>
      </View>
    </ScrollView>
  );
}
