import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  UIManager,
  View,
} from 'react-native';

import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { DetailRow, RowDivider } from '@/components/clinic/DetailCard';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { CardExpandToggle } from '@/components/ui/CardExpandToggle';
import { formatFillInRoleLabel, formatShiftPostMeta, formatShiftPostTimeDetail } from '@/lib/shiftPostDisplay';
import { getClinicApplicationMessagesRoute, type ClinicApplicationReturnTarget } from '@/lib/routing';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ConfirmedFillInCardProps = {
  workerName: string;
  workerPhotoStoragePath?: string | null;
  shiftDate: string;
  startTime: string | null;
  endTime: string | null;
  applicationId?: string;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  returnTo?: ClinicApplicationReturnTarget;
};

export function ConfirmedFillInCard({
  workerName,
  workerPhotoStoragePath,
  shiftDate,
  startTime,
  endTime,
  applicationId,
  expanded = false,
  onExpandChange,
  returnTo = 'fill-ins-tab',
}: ConfirmedFillInCardProps) {
  const { colors } = useTheme();
  const roleLabel = formatFillInRoleLabel(shiftDate);
  const shiftTimes = {
    shift_date: shiftDate,
    start_time: startTime ?? '',
    end_time: endTime ?? '',
  };
  const shiftMeta = formatShiftPostMeta(shiftTimes);
  const scheduleDetail = formatShiftPostTimeDetail(shiftTimes);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: `${colors.success}10`,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${colors.success}40`,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardHeaderPressable: {
      alignSelf: 'stretch',
      borderRadius: 12,
      ...webPointer(),
    },
    cardHeaderHovered: webListRowHoverStyles(colors),
    cardPressed: { opacity: 0.92 },
    expandedBody: {
      gap: spacing.md,
      paddingTop: spacing.xs,
    },
    detailsCard: {
      gap: spacing.sm,
    },
    confirmedAccessory: {
      paddingTop: 2,
    },
  }));

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onExpandChange?.(!expanded);
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${workerName} confirmed for ${roleLabel}`}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggleExpanded();
        }}
        style={({ pressed, hovered }) => [
          styles.cardHeaderPressable,
          webHover(hovered, pressed, styles.cardHeaderHovered),
          pressed && styles.cardPressed,
        ]}>
        <ApplicantPostHeader
          displayName={workerName}
          photoStoragePath={workerPhotoStoragePath}
          eyebrow={roleLabel}
          title={workerName}
          detail={scheduleDetail}
          avatarSize={44}
          accessory={
            <View style={styles.confirmedAccessory}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            </View>
          }
          textFooter={<ClinicApplicationStatusBadge status="hired" postType="shift" />}
        />
      </Pressable>

      <CardExpandToggle expanded={expanded} onPress={toggleExpanded} />

      {expanded ? (
        <View style={styles.expandedBody}>
          <View style={styles.detailsCard}>
            <DetailRow label="Name" value={workerName} />
            <RowDivider />
            <DetailRow label="Role" value={roleLabel} />
            <RowDivider />
            <DetailRow label="Schedule" value={scheduleDetail ?? shiftMeta} />
            <RowDivider />
            <DetailRow label="Status" value="Confirmed" />
          </View>
          {applicationId ? (
            <OnboardingButton
              label="Message"
              variant="secondary"
              onPress={() =>
                router.push(getClinicApplicationMessagesRoute(applicationId, returnTo))
              }
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
