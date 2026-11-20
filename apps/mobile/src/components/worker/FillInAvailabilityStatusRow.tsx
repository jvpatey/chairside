import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import {
  getFillInAvailabilityCollapsedSummary,
  getFillInSmsStatus,
} from '@/lib/fillInAvailabilitySummary';
import { WORKER_FILLIN_AVAILABILITY } from '@/lib/routing';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

/** Compact hub chrome — status only; full editor lives on fill-in-availability. */
export function FillInAvailabilityStatusRow() {
  const { colors } = useTheme();
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const summary = getFillInAvailabilityCollapsedSummary(workerProfile, availabilityBlocks);
  const isAvailable = workerProfile?.short_notice_available ?? false;
  const { smsActive, smsNeedsPhone } = getFillInSmsStatus(workerProfile);

  const label = !isAvailable
    ? 'Turn on fill-in alerts'
    : [
        'Available',
        smsActive ? 'Texts on' : smsNeedsPhone ? 'Add phone for texts' : 'Texts off',
        summary.secondary !== 'No schedule set' ? summary.secondary : null,
      ]
        .filter(Boolean)
        .join(' · ');

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
      backgroundColor: isAvailable ? colors.secondarySubtle : colors.fillSubtle,
      flexShrink: 0,
    },
    label: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: isAvailable ? colors.labelPrimary : colors.secondary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. Manage availability`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(WORKER_FILLIN_AVAILABILITY);
      }}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, webListRowHoverStyles(colors)),
        pressed && { opacity: 0.88 },
      ]}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={isAvailable ? 'notifications' : 'notifications-outline'}
          size={15}
          color={isAvailable ? colors.secondary : colors.labelSecondary}
        />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
    </Pressable>
  );
}
