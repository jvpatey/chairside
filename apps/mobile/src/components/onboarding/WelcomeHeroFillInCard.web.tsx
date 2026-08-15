import { getRoleTypeLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { ShiftPostStatusBadge } from '@/components/clinic/ShiftPostStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { CardSectionDivider } from '@/components/ui/CardTitleSection';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { formatPostedDateLabel } from '@/lib/dates';
import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import type { WelcomeHeroPreview } from '@/lib/welcomeHeroPreview';
import { useTheme, useThemedStyles } from '@/theme';

type WelcomeHeroFillInCardProps = {
  preview: WelcomeHeroPreview;
  embedded?: boolean;
};

const FILL_IN_TITLE = 'Fill-in Dental Hygienist';

/** Presentational clinic fill-in — posting + cover request in one cohesive card. */
export function WelcomeHeroFillInCard({
  preview,
  embedded = false,
}: WelcomeHeroFillInCardProps) {
  const { colors } = useTheme();
  const shift = preview.shift;
  const applicant = preview.applicants[0];
  const postedLabel = formatPostedDateLabel(shift.created_at);
  const shiftMeta = formatShiftPostMeta(shift);
  const compensation = shift.compensation ?? 'To be discussed';

  const styles = useThemedStyles(({ colors, spacing }) => ({
    header: {
      padding: spacing.md,
      paddingBottom: spacing.sm,
    },
    headerActions: {
      alignItems: 'flex-end' as const,
      gap: spacing.xs,
    },
    wageRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    compensation: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.secondary,
    },
    body: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
      color: colors.labelSecondary,
    },
    request: {
      gap: spacing.sm,
    },
    coverMessage: {
      fontSize: 14,
      lineHeight: 20,
      fontStyle: 'italic' as const,
      color: colors.labelSecondary,
      paddingLeft: 56,
    },
    actions: { gap: spacing.sm },
    row: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    action: { flex: 1, minWidth: 0 },
    chevronRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'flex-end' as const,
      gap: spacing.xs,
    },
  }));

  return (
    <SurfaceCard variant={embedded ? 'inner' : 'default'} padding="none">
      <View style={styles.header}>
        <ClinicPostHeader
          layout="split"
          clinicName={preview.clinic.name}
          logoStoragePath={null}
          title={FILL_IN_TITLE}
          location={preview.clinic.locationLabel}
          detail={shiftMeta}
          postedLabel={postedLabel}
          avatarSize={embedded ? 40 : 44}
          accessory={
            <View style={styles.headerActions}>
              <BadgeRow>
                <ShiftPostStatusBadge status={shift.status} shiftDate={shift.shift_date} />
              </BadgeRow>
            </View>
          }
          footer={
            <View style={styles.wageRow}>
              <Text style={styles.compensation}>{compensation}</Text>
            </View>
          }
        />
      </View>

      <View style={styles.body}>
        <CardSectionDivider />
        <View style={styles.request}>
          <Text style={styles.sectionLabel}>Requests to Cover</Text>
          <ApplicantPostHeader
            displayName={applicant.name}
            photoStoragePath={null}
            title={getRoleTypeLabel(shift.role_type)}
            detail={[shiftMeta, 'Just now'].filter(Boolean).join(' · ')}
            avatarSize={40}
            accessory={
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <ApplicationCardBadge label="New request" />
                <View style={styles.chevronRow}>
                  <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
                </View>
              </View>
            }
          />
          <Text style={styles.coverMessage}>{`\u201C${preview.coverMessage}\u201D`}</Text>
          <View style={styles.actions}>
            <OnboardingButton label="Accept" accent="secondary" onPress={() => {}} />
            <View style={styles.row}>
              <OnboardingButton
                style={styles.action}
                label="Message"
                variant="secondary"
                onPress={() => {}}
              />
              <OnboardingButton
                style={styles.action}
                label="Decline"
                variant="destructive"
                onPress={() => {}}
              />
            </View>
          </View>
        </View>
      </View>
    </SurfaceCard>
  );
}
