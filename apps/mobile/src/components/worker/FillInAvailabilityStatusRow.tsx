import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { getFillInSmsStatus } from '@/lib/fillInAvailabilitySummary';
import { getWorkerFillInAvailabilityRoute } from '@/lib/routing';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

/** Compact hub chrome — SMS / outreach status only. */
export function FillInAvailabilityStatusRow() {
  const { colors } = useTheme();
  const { workerProfile } = useWorkerProfile();
  const { smsActive, smsNeedsPhone, fillInsOn } = getFillInSmsStatus(workerProfile);

  const label = !fillInsOn
    ? 'Turn on text alerts'
    : smsActive
      ? 'Text alerts on'
      : smsNeedsPhone
        ? 'Add phone for texts'
        : 'Text alerts off';

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
      backgroundColor: colors.fillSubtle,
      borderWidth: 0.5,
      borderColor: colors.separator,
      ...webPointer(),
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: fillInsOn ? colors.primarySubtle : colors.fillSubtle,
      flexShrink: 0,
    },
    label: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: fillInsOn ? colors.labelPrimary : colors.primary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. Manage text alerts`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(getWorkerFillInAvailabilityRoute('fill-ins'));
      }}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, webListRowHoverStyles(colors)),
        pressed && { opacity: 0.88 },
      ]}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={smsActive ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
          size={15}
          color={fillInsOn ? colors.primary : colors.labelSecondary}
        />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
    </Pressable>
  );
}
