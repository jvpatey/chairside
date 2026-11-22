import { Text, View } from 'react-native';

import { webOnlyStyle } from '@/lib/webPressableStyles';
import { fontSemibold, useThemedStyles } from '@/theme';

/**
 * Marketing SMS preview — mirrors production fill-in tone
 * (`Reply YES {code} to request` + Details) without real clinic PII.
 */
const OFFER = 'Chairside: Dental Clinic posted a fill-in for Today, 9 AM-5 PM.';
const REPLY_CODE = '4821';
const DETAILS = 'Details: chairside.app/f/demo';

type WelcomeSmsPreviewProps = {
  /** Larger type for the welcome hero. */
  size?: 'default' | 'hero';
};

/** Incoming-text look for marketing — not an in-app notification card. */
export function WelcomeSmsPreview({ size = 'default' }: WelcomeSmsPreviewProps) {
  const isHero = size === 'hero';

  const styles = useThemedStyles(({ colors, isDark }) => ({
    wrap: {
      gap: isHero ? 6 : 4,
      alignItems: 'flex-start' as const,
      width: '100%' as const,
    },
    sender: {
      fontSize: isHero ? 12 : 11,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
      paddingLeft: 12,
    },
    bubble: {
      maxWidth: '100%' as const,
      backgroundColor: isDark ? '#2C2C2E' : '#E9E9EB',
      borderRadius: isHero ? 22 : 18,
      borderBottomLeftRadius: 5,
      paddingVertical: isHero ? 14 : 10,
      paddingHorizontal: isHero ? 16 : 12,
      gap: isHero ? 10 : 6,
      ...webOnlyStyle({
        boxShadow: isDark
          ? '0 8px 24px rgba(0,0,0,0.28)'
          : '0 6px 18px rgba(14, 27, 44, 0.08)',
      } as object),
    },
    offer: {
      fontSize: isHero ? 16 : 13,
      lineHeight: isHero ? 22 : 18,
      color: isDark ? '#FFFFFF' : '#111111',
    },
    ctaRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    ctaMuted: {
      fontSize: isHero ? 16 : 13,
      lineHeight: isHero ? 22 : 18,
      color: isDark ? '#FFFFFF' : '#111111',
    },
    yesChip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: isHero ? 3 : 2,
      paddingHorizontal: isHero ? 8 : 6,
      borderRadius: 7,
      backgroundColor: colors.secondarySubtle,
    },
    yesText: {
      fontSize: isHero ? 15 : 12,
      lineHeight: isHero ? 20 : 16,
      fontFamily: fontSemibold,
      fontWeight: '700' as const,
      color: colors.secondary,
      letterSpacing: 0.2,
    },
    details: {
      fontSize: isHero ? 14 : 12,
      lineHeight: isHero ? 19 : 16,
      color: isDark ? '#0A84FF' : '#007AFF',
    },
    time: {
      fontSize: isHero ? 11 : 10,
      fontWeight: '500' as const,
      color: colors.labelTertiary,
      paddingLeft: 12,
      marginTop: 2,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.sender}>Chairside</Text>
      <View style={styles.bubble}>
        <Text style={styles.offer}>{OFFER}</Text>
        <View style={styles.ctaRow}>
          <Text style={styles.ctaMuted}>Reply </Text>
          <View style={styles.yesChip}>
            <Text style={styles.yesText}>YES {REPLY_CODE}</Text>
          </View>
          <Text style={styles.ctaMuted}> to request.</Text>
        </View>
        <Text style={styles.details}>{DETAILS}</Text>
      </View>
      <Text style={styles.time}>Text Message · Now</Text>
    </View>
  );
}

export const WELCOME_SMS_REPLY_CODE = REPLY_CODE;
