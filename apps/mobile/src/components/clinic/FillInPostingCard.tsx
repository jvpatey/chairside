import type { ShiftPost } from '@chairside/api';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import { ShiftPostManageMenu } from '@/components/clinic/ShiftPostManageMenu';
import { ShiftPostStatusBadge } from '@/components/clinic/ShiftPostStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { CardExpandToggle } from '@/components/ui/CardExpandToggle';
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
import { useThemedStyles } from '@/theme';

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
};

function RequestCountPill({ count }: { count: number }) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    pill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    text: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{count === 1 ? '1 request' : `${count} requests`}</Text>
    </View>
  );
}

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
}: FillInPostingCardProps) {
  const { clinicProfile } = useClinicProfile();
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardPressed: { opacity: 0.92 },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    compensation: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    expandedBody: {
      gap: spacing.md,
      paddingTop: spacing.xs,
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

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggleExpanded();
        }}
        style={({ pressed }) => [pressed && styles.cardPressed]}>
        <ClinicPostHeader
          clinicName={clinicName}
          logoStoragePath={clinicProfile?.logo_storage_path}
          title={formatShiftPostRoleTitle(shift.role_type)}
          location={location || null}
          detail={formatShiftPostMeta(shift)}
          avatarSize={44}
          accessory={<ShiftPostStatusBadge status={shift.status} />}
          textFooter={pendingRequestCount > 0 ? <RequestCountPill count={pendingRequestCount} /> : null}
          footer={
            shift.compensation ? (
              <View style={styles.footer}>
                <Text style={styles.compensation}>{shift.compensation}</Text>
              </View>
            ) : null
          }
        />
      </Pressable>

      <CardExpandToggle expanded={expanded} onPress={toggleExpanded} />

      {expanded ? (
        <View style={styles.expandedBody}>
          <ShiftPostDetailView shift={shift} variant="embedded" showStatusBadge={false} />
          <View style={styles.actions}>
            {applicationCount > 0 ? (
              <OnboardingButton
                label={reviewLabel}
                onPress={() =>
                  router.push(getClinicShiftApplicantsRoute(shift.id, returnTo))
                }
              />
            ) : null}
            <View style={styles.actionsRow}>
              <OnboardingButton
                style={styles.actionButton}
                label="Edit fill-in"
                variant={applicationCount > 0 ? 'secondary' : 'primary'}
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
        </View>
      ) : null}
    </View>
  );
}
