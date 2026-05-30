import type { WorkerAppliedShiftClinic } from '@chairside/api';
import { SPECIALTY_OPTIONS, getProvinceLabel, getTeamSizeRangeLabel } from '@chairside/config';
import { Text, View } from 'react-native';

import {
  DetailRow,
  DetailSection,
  DetailSectionDivider,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { useThemedStyles } from '@/theme';

type WorkerClinicDetailViewProps = {
  clinic: WorkerAppliedShiftClinic;
};

export function WorkerClinicDetailView({ clinic }: WorkerClinicDetailViewProps) {
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
  }));

  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === clinic.specialty)?.label ??
    'General dentistry';
  const teamSizeLabel = getTeamSizeRangeLabel(clinic.team_size_range ?? null);
  const softwareLabel =
    clinic.software_used.length > 0 ? clinic.software_used.join(' · ') : null;
  const address = [
    clinic.address_line1,
    clinic.address_line2,
    clinic.city,
    getProvinceLabel(clinic.province),
    clinic.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.card}>
      <DetailSection title="Clinic contact">
        <DetailRow label="Contact name" value={clinic.contact_name} />
        <RowDivider />
        <DetailRow label="Phone" value={clinic.phone} />
        {clinic.website ? (
          <>
            <RowDivider />
            <DetailRow label="Website" value={clinic.website} />
          </>
        ) : null}
      </DetailSection>

      <DetailSectionDivider>
        <DetailSection title="Location">
          <DetailRow label="Address" value={address || null} layout="stacked" />
        </DetailSection>
      </DetailSectionDivider>

      <DetailSectionDivider>
        <DetailSection title="Practice">
          <DetailRow label="Specialty" value={specialtyLabel} />
          {teamSizeLabel ? (
            <>
              <RowDivider />
              <DetailRow label="Team size" value={teamSizeLabel} />
            </>
          ) : null}
          {softwareLabel ? (
            <>
              <RowDivider />
              <DetailRow label="Software" value={softwareLabel} />
            </>
          ) : null}
        </DetailSection>
      </DetailSectionDivider>
    </View>
  );
}
