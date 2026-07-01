import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { PUBLIC_LEGAL_PATHS } from '@/constants/legal';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { navigateToWelcome } from '@/lib/publicRoutes';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

export type PublicSiteFooterLink = {
  label: string;
  onPress: () => void;
  active?: boolean;
};

type PublicSiteFooterProps = {
  links: PublicSiteFooterLink[];
};

const FOOTER_YEAR = new Date().getFullYear();

export const PUBLIC_LEGAL_FOOTER_LINKS: {
  path: keyof typeof PUBLIC_LEGAL_PATHS;
  label: string;
}[] = [
  { path: 'privacy', label: 'Privacy' },
  { path: 'support', label: 'Support' },
  { path: 'terms', label: 'Terms' },
];

export function getPublicLegalFooterLinks(
  currentPath?: keyof typeof PUBLIC_LEGAL_PATHS,
): PublicSiteFooterLink[] {
  return PUBLIC_LEGAL_FOOTER_LINKS.map((link) => ({
    label: link.label,
    onPress: () => router.push(PUBLIC_LEGAL_PATHS[link.path]),
    active: link.path === currentPath,
  }));
}

export function PublicSiteFooter({ links }: PublicSiteFooterProps) {
  const { isCompact } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    footer: {
      width: '100%' as const,
      alignSelf: 'center' as const,
      alignItems: 'center' as const,
      gap: isCompact ? spacing.md : spacing.lg,
      marginTop: isCompact ? spacing.lg : spacing.xl,
      paddingHorizontal: isCompact ? 0 : spacing.lg,
      paddingTop: isCompact ? spacing.lg : spacing.xl,
      paddingBottom: isCompact ? spacing.md : spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      maxWidth: CONTENT_MAX_WIDTH.regular,
    },
    wordmark: {
      marginBottom: -spacing.xs,
    },
    linksRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: isCompact ? spacing.sm : spacing.md,
    },
    linkPressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: 8,
      ...webPointer(),
    },
    linkHovered: webTextLinkHoverStyles(colors),
    link: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
    },
    linkActive: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    copyright: {
      ...typography.body,
      fontSize: 13,
      color: colors.labelTertiary,
      textAlign: 'center' as const,
    },
  }));

  return (
    <View style={styles.footer}>
      <View style={styles.wordmark}>
        <ChairsideWordmark variant="small" align="center" onPress={navigateToWelcome} />
      </View>

      <View style={styles.linksRow}>
        {links.map((link) => (
          <Pressable
            key={link.label}
            accessibilityRole="link"
            onPress={link.onPress}
            style={({ pressed, hovered }) => [
              styles.linkPressable,
              webHover(hovered, pressed, styles.linkHovered),
              pressed && { opacity: 0.75 },
            ]}>
            <Text style={[styles.link, link.active && styles.linkActive]}>{link.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.copyright}>© {FOOTER_YEAR} Chairside</Text>
    </View>
  );
}
