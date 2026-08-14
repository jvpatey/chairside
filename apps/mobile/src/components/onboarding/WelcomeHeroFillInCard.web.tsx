import { useState } from 'react';
import { Text, View } from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import { ShiftPostStatusBadge } from '@/components/clinic/ShiftPostStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { ExpandableSurfaceCard } from '@/components/ui/ExpandableSurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { formatPostedDateLabel } from '@/lib/dates';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import type { WelcomeHeroPreview } from '@/lib/welcomeHeroPreview';
import { useThemedStyles } from '@/theme';

type WelcomeHeroFillInCardProps = {
  preview: WelcomeHeroPreview;
  embedded?: boolean;
};

/** Presentational clinic fill-in posting — same card as the live Fill-ins tab. */
export function WelcomeHeroFillInCard({
  preview,
  embedded = false,
}: WelcomeHeroFillInCardProps) {
  const [expanded, setExpanded] = useState(false);
  const applicationCount = preview.applicants.length;
  const shift = preview.shift;
  const postedLabel = formatPostedDateLabel(shift.created_at);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    headerActions: {
      alignItems: 'flex-end' as const,
      gap: spacing.xs,
    },
    footer: {
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
    actions: {
      gap: spacing.sm,
    },
  }));

  const header = (
    <ClinicPostHeader
      layout="split"
      clinicName={preview.clinic.name}
      logoStoragePath={null}
      title={formatShiftPostRoleTitle(shift.role_type)}
      location={preview.clinic.locationLabel}
      detail={formatShiftPostMeta(shift)}
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
      onToggleExpand={() => setExpanded((value) => !value)}
      variant={embedded ? 'inner' : 'default'}
      accent="secondary"
    >
      <ShiftPostDetailView shift={shift} variant="embedded" showStatusBadge={false} accent="secondary" />
      <View style={styles.actions}>
        <OnboardingButton
          label={
            applicationCount === 1
              ? 'Review applicant'
              : `Review ${applicationCount} applicants`
          }
          accent="secondary"
          onPress={() => {}}
        />
      </View>
    </ExpandableSurfaceCard>
  );
}
