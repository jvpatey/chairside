import type { ShiftPost } from '@chairside/api';
import { router } from 'expo-router';
import {
  LayoutAnimation,
  Platform,
  Text,
  UIManager,
  View,
} from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import { ShiftPostManageMenu } from '@/components/clinic/ShiftPostManageMenu';
import { ShiftPostStatusBadge } from '@/components/clinic/ShiftPostStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { CountBadge, formatRequestCountLabel } from '@/components/ui/CountBadge';
import { ExpandableSurfaceCard } from '@/components/ui/ExpandableSurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import {
  formatShiftPostMeta,
  formatShiftPostRoleTitle,
} from '@/lib/shiftPostDisplay';
import {
  getClinicShiftApplicantsRoute,
  getEditShiftRoute,
  type FillInReturnTarget,
} from '@/lib/routing';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FillInPostingCardProps = {
  shift: ShiftPost;
  pendingRequestCount?: number;
  applicationCount?: number;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  clinicId?: string;
  returnTo?: FillInReturnTarget;
  onShiftUpdated?: (shift: ShiftPost) => void;
  onShiftDeleted?: () => void;
  accent?: GradientAccent;
};

export function FillInPostingCard({
  shift,
  pendingRequestCount = 0,
  applicationCount = 0,
  expanded = false,
  onExpandChange,
  clinicId,
  returnTo = 'fill-ins-tab',
  onShiftUpdated,
  onShiftDeleted,
  accent = 'secondary',
}: FillInPostingCardProps) {
  const { colors } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const { clinicProfile } = useClinicProfile();
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');

  const styles = useThemedStyles(({ spacing }) => ({
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    compensation: {
      fontSize: 15,
      fontWeight: '600',
      color: brandColor,
    },
    actions: {
      gap: spacing.sm,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
  }));

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onExpandChange?.(!expanded);
  };

  const reviewLabel =
    applicationCount === 1 ? 'Review applicant' : `Review ${applicationCount} applicants`;

  const header = (
        <ClinicPostHeader
          layout="split"
          clinicName={clinicName}
      logoStoragePath={clinicProfile?.logo_storage_path}
      title={formatShiftPostRoleTitle(shift.role_type)}
      location={location || null}
      detail={formatShiftPostMeta(shift)}
      avatarSize={44}
      accessory={<ShiftPostStatusBadge status={shift.status} shiftDate={shift.shift_date} />}
      textFooter={
        pendingRequestCount > 0 ? (
          <CountBadge label={formatRequestCountLabel(pendingRequestCount)} />
        ) : null
      }
      footer={
        shift.compensation ? (
          <View style={styles.footer}>
            <Text style={styles.compensation}>{shift.compensation}</Text>
          </View>
        ) : null
      }
    />
  );

  return (
    <ExpandableSurfaceCard
      header={header}
      expanded={expanded}
      onToggleExpand={toggleExpanded}
      accent={accent}>
      <ShiftPostDetailView shift={shift} variant="embedded" showStatusBadge={false} accent={accent} />
      <View style={styles.actions}>
        {applicationCount > 0 ? (
          <OnboardingButton
            label={reviewLabel}
            accent={accent}
            onPress={() => router.push(getClinicShiftApplicantsRoute(shift.id, returnTo))}
          />
        ) : null}
        <View style={styles.actionsRow}>
          <OnboardingButton
            style={styles.actionButton}
            label="Edit fill-in"
            variant={applicationCount > 0 ? 'secondary' : 'primary'}
            accent={applicationCount > 0 ? 'primary' : accent}
            onPress={() => router.push(getEditShiftRoute(shift.id, returnTo))}
          />
          {clinicId ? (
            <ShiftPostManageMenu
              trigger={applicationCount > 0 ? 'icon' : 'button'}
              style={applicationCount > 0 ? undefined : styles.actionButton}
              clinicId={clinicId}
              shift={shift}
              onUpdated={onShiftUpdated ?? (() => undefined)}
              onDeleted={onShiftDeleted ?? (() => undefined)}
            />
          ) : null}
        </View>
      </View>
    </ExpandableSurfaceCard>
  );
}
