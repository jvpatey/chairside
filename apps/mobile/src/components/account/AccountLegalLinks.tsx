import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AccountSettingsCard } from '@/components/account/AccountSettingsCard';
import { PUBLIC_LEGAL_PATHS } from '@/constants/legal';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

const PRIVACY_TERMS_LINKS: { path: keyof typeof PUBLIC_LEGAL_PATHS; label: string }[] = [
  { path: 'privacy', label: 'Privacy Policy' },
  { path: 'terms', label: 'Terms of Service' },
];

const SUPPORT_LINK = { path: 'support' as const, label: 'Support' };

export function AccountLegalLinks() {
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
    <AccountSettingsCard
      title={isCompact ? 'Legal' : 'Legal & support'}
      icon="document-text-outline">
      <View style={styles.list}>
        {links.map((link) => (
          <Pressable
            key={link.path}
            accessibilityRole="link"
            onPress={() => router.push(PUBLIC_LEGAL_PATHS[link.path])}
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
            onPress={() => router.push(PUBLIC_LEGAL_PATHS.support)}
            accessibilityRole="link">
            Support page
          </Text>{' '}
          to send us a message.
        </Text>
      ) : null}
    </AccountSettingsCard>
  );
}
