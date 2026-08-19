import { router, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { LegalPathKey } from '@/constants/legal';
import { PUBLIC_LEGAL_PATHS } from '@/constants/legal';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

const PRIVACY_TERMS_LINKS: { path: LegalPathKey; label: string }[] = [
  { path: 'privacy', label: 'Privacy Policy' },
  { path: 'terms', label: 'Terms of Service' },
];

const SUPPORT_LINK = { path: 'support' as const, label: 'Support' };

type AccountLegalLinksProps = {
  /** Prefer authenticated profile routes when signed in. Defaults to public URLs. */
  legalPaths?: Record<LegalPathKey, Href>;
};

export function AccountLegalLinks({ legalPaths = PUBLIC_LEGAL_PATHS }: AccountLegalLinksProps) {
  const { isCompact } = useResponsiveLayout();
  const links = isCompact
    ? PRIVACY_TERMS_LINKS
    : [PRIVACY_TERMS_LINKS[0], SUPPORT_LINK, PRIVACY_TERMS_LINKS[1]];
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    list: {
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      marginHorizontal: -spacing.xs,
      borderRadius: 10,
      ...webPointer(),
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: {
      opacity: 0.88,
    },
    label: {
      ...typography.body,
      fontSize: 16,
      color: colors.labelPrimary,
    },
    hint: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      marginTop: spacing.sm,
    },
    hintLink: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
  }));

  return (
    <View>
      <View style={styles.list}>
        {links.map((link) => (
          <Pressable
            key={link.path}
            accessibilityRole="link"
            onPress={() => router.push(legalPaths[link.path])}
            style={({ pressed, hovered }) => [
              styles.row,
              webHover(hovered, pressed, styles.rowHovered),
              pressed && styles.rowPressed,
            ]}>
            <Text style={styles.label}>{link.label}</Text>
          </Pressable>
        ))}
      </View>
      {!isCompact ? (
        <Text style={styles.hint}>
          Questions? Use the{' '}
          <Text
            style={styles.hintLink}
            onPress={() => router.push(legalPaths.support)}
            accessibilityRole="link">
            Support page
          </Text>{' '}
          to send us a message.
        </Text>
      ) : null}
    </View>
  );
}
