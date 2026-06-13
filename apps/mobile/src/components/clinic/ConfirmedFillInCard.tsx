import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  LayoutAnimation,
  Platform,
  UIManager,
  View,
} from 'react-native';

import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { DetailRow, RowDivider } from '@/components/clinic/DetailCard';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { CardDetailSection } from '@/components/ui/CardDetailSection';
import { ExpandableSurfaceCard } from '@/components/ui/ExpandableSurfaceCard';
import {
  formatFillInRoleLabel,
  formatShiftPostMeta,
  formatShiftPostTimeDetail,
} from '@/lib/shiftPostDisplay';
import { getClinicApplicationMessagesRoute, type ClinicApplicationReturnTarget } from '@/lib/routing';
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

  const styles = useThemedStyles(({ spacing }) => ({
    confirmedAccessory: {
      paddingTop: 2,
    },
    detailsCard: {
      gap: spacing.sm,
    },
  }));

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onExpandChange?.(!expanded);
  };

  const header = (
    <ApplicantPostHeader
      layout="split"
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
  );

  return (
    <ExpandableSurfaceCard
      header={header}
      expanded={expanded}
      onToggleExpand={toggleExpanded}
      variant="success">
      <CardDetailSection title="Shift details">
        <View style={styles.detailsCard}>
          <DetailRow label="Name" value={workerName} />
          <RowDivider />
          <DetailRow label="Role" value={roleLabel} />
          <RowDivider />
          <DetailRow label="Schedule" value={scheduleDetail ?? shiftMeta} />
          <RowDivider />
          <DetailRow label="Status" value="Confirmed" />
        </View>
      </CardDetailSection>
      {applicationId ? (
        <OnboardingButton
          label="Message"
          variant="secondary"
          onPress={() =>
            router.push(getClinicApplicationMessagesRoute(applicationId, returnTo))
          }
        />
      ) : null}
    </ExpandableSurfaceCard>
  );
}
