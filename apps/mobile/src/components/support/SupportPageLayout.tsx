import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { SupportContactForm } from '@/components/support/SupportContactForm';
import { LEGAL_LAST_UPDATED, PUBLIC_LEGAL_PATHS } from '@/constants/legal';
import { SUPPORT_PAGE_CONTENT } from '@/content/legal/support';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

const FOOTER_LINKS: { path: keyof typeof PUBLIC_LEGAL_PATHS; label: string }[] = [
  { path: 'privacy', label: 'Privacy' },
  { path: 'support', label: 'Support' },
  { path: 'terms', label: 'Terms' },
];

const FAQ_SECTIONS = SUPPORT_PAGE_CONTENT.sections.filter(
  (section) => section.title !== 'Contact us' && section.title !== 'Report a problem',
);

export function SupportPageLayout() {
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
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      marginBottom: spacing.xl,
      gap: spacing.md,
    },
    formTitle: {
      ...typography.body,
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    formSubtitle: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
    faqTitle: {
      ...typography.body,
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
      marginBottom: spacing.lg,
    },
    section: {
      marginBottom: spacing.xl,
      gap: spacing.sm,
    },
    sectionTitle: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
      marginBottom: spacing.xs,
    },
    body: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 24,
      color: colors.labelSecondary,
      marginBottom: spacing.sm,
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

      <Text style={styles.title}>{SUPPORT_PAGE_CONTENT.title}</Text>
      <Text style={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</Text>
      <Text style={styles.intro}>{SUPPORT_PAGE_CONTENT.intro}</Text>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Contact us</Text>
        <Text style={styles.formSubtitle}>
          Send a message for bugs, account issues, or questions. We typically respond within one to
          two business days.
        </Text>
        <SupportContactForm />
      </View>

      <Text style={styles.faqTitle}>Help topics</Text>
      {FAQ_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.paragraphs?.map((paragraph) => (
            <Text key={paragraph} style={styles.body}>
              {paragraph}
            </Text>
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
                  link.path === 'support' && styles.footerLinkActive,
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
