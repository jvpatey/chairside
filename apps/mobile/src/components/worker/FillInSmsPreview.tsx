import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

/** Matches production `buildFillInSms` tone (YES + Details companion). */
export const DEFAULT_SMS_BODY =
  'Chairside: Evergreen Dental (Dartmouth) posted a fill-in for Dec 21, 8 AM-5 PM. Pay: $45/hr. Reply YES 4821 to request. Details: chairsidedental.app/f/… Reply STOP to opt out.';

type FillInSmsPreviewProps = {
  body?: string;
};

/** Incoming-text look showing what a fill-in SMS alert reads like. */
export function FillInSmsPreview({ body = DEFAULT_SMS_BODY }: FillInSmsPreviewProps) {
  const styles = useThemedStyles(({ colors, isDark }) => ({
    wrap: {
      gap: 4,
      alignItems: 'flex-start' as const,
    },
    sender: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
      paddingLeft: 10,
    },
    bubble: {
      maxWidth: '100%' as const,
      backgroundColor: isDark ? '#2C2C2E' : '#E9E9EB',
      borderRadius: 18,
      borderBottomLeftRadius: 5,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    body: {
      fontSize: 14,
      lineHeight: 19,
      color: isDark ? '#FFFFFF' : '#111111',
    },
    time: {
      fontSize: 10,
      fontWeight: '500' as const,
      color: colors.labelTertiary,
      paddingLeft: 10,
      marginTop: 2,
    },
  }));

  return (
    <View style={styles.wrap} accessibilityLabel={`Example text alert: ${body}`}>
      <Text style={styles.sender}>Chairside</Text>
      <View style={styles.bubble}>
        <Text style={styles.body}>{body}</Text>
      </View>
      <Text style={styles.time}>Text Message · now</Text>
    </View>
  );
}
