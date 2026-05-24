import type { ClinicProfile } from '@chairside/api';
import { SPECIALTY_OPTIONS, getProvinceLabel, getTeamSizeRangeLabel } from '@chairside/config';
import { Text, View } from 'react-native';

import {
  DetailRow,
  DetailSection,
  DetailSectionDivider,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { useThemedStyles } from '@/theme';

type ClinicPracticeViewProps = {
  profile: ClinicProfile | null;
};

export function ClinicPracticeView({ profile }: ClinicPracticeViewProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.lg,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
    },
    emptyText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
      textAlign: 'center',
    },
  }));

  if (!profile) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          Add your practice details, location, and contact info to start posting.
        </Text>
      </View>
    );
  }

  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === profile.specialty)?.label ??
    'General dentistry';
  const teamSizeLabel = getTeamSizeRangeLabel(profile.team_size_range ?? null);
  const softwareUsed = profile.software_used ?? [];
  const softwareLabel = softwareUsed.length > 0 ? softwareUsed.join(' · ') : null;
  const address = [
    profile.address_line1,
    profile.address_line2,
    profile.city,
    getProvinceLabel(profile.province),
    profile.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.card}>
      <DetailSection title="Contact">
        <DetailRow label="Contact name" value={profile.contact_name} />
        <RowDivider />
        <DetailRow label="Phone" value={profile.phone} />
      </DetailSection>

      <DetailSectionDivider>
        <DetailSection title="Location">
          <DetailRow label="Address" value={address || null} layout="stacked" />
        </DetailSection>
      </DetailSectionDivider>

      <DetailSectionDivider>
        <DetailSection title="Practice">
          <DetailRow label="Specialty" value={specialtyLabel} />
          <RowDivider />
          <DetailRow label="Software" value={softwareLabel} />
          <RowDivider />
          <DetailRow label="Operatories" value={profile.operatories_count?.toString() ?? null} />
          <RowDivider />
          <DetailRow label="Team size" value={teamSizeLabel} />
        </DetailSection>
      </DetailSectionDivider>
    </View>
  );
}
