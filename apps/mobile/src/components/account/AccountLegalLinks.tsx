import { router } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';

import { AccountSettingsCard } from '@/components/account/AccountSettingsCard';
import { PUBLIC_LEGAL_PATHS, SUPPORT_EMAIL } from '@/constants/legal';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

const LEGAL_LINKS: { path: keyof typeof PUBLIC_LEGAL_PATHS; label: string }[] = [
  { path: 'privacy', label: 'Privacy Policy' },
  { path: 'support', label: 'Support' },
  { path: 'terms', label: 'Terms of Service' },
];

export function AccountLegalLinks() {
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
    <AccountSettingsCard title="Legal & support" icon="document-text-outline">
      <View style={styles.list}>
        {LEGAL_LINKS.map((link) => (
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
      <Text style={styles.hint}>
        Questions?{' '}
        <Text
          style={styles.hintLink}
          onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          accessibilityRole="link">
          {SUPPORT_EMAIL}
        </Text>
      </Text>
    </AccountSettingsCard>
  );
}
