import type { ClinicProfile } from '@chairside/api';
import { SPECIALTY_OPTIONS, getProvinceLabel, getTeamSizeRangeLabel } from '@chairside/config';

import { PracticeDoctorFieldValue } from '@/components/clinic/PracticeDoctorList';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  SectionPanel,
} from '@/components/profile/ProfileDetailBlocks';

type ClinicPracticeViewProps = {
  profile: ClinicProfile | null;
};

export function ClinicPracticeView({ profile }: ClinicPracticeViewProps) {
  if (!profile) {
    return (
      <ProfileEmptyState
        icon="business-outline"
        title="Add practice details"
        description="Add your practice details, location, and contact info to start posting."
      />
    );
  }

  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === profile.specialty)?.label ??
    'General dentistry';
  const teamSizeLabel = getTeamSizeRangeLabel(profile.team_size_range ?? null);
  const softwareUsed = profile.software_used ?? [];
  const softwareLabel = softwareUsed.length > 0 ? softwareUsed.join(' · ') : null;
  const practiceDoctors = profile.practice_doctors ?? [];
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
    <ProfileDetailStack>
      <SectionPanel icon="call-outline" title="Contact">
        <FieldBlock label="Contact name">
          <FieldValue value={profile.contact_name} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Phone">
          <FieldValue value={profile.phone} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel icon="location-outline" title="Location">
        <FieldBlock label="Address">
          <FieldValue value={address || null} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel icon="business-outline" title="Practice">
        <FieldBlock label="Specialty">
          <FieldValue value={specialtyLabel} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Software">
          <FieldValue value={softwareLabel} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Operatories">
          <FieldValue value={profile.operatories_count?.toString() ?? null} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Team size">
          <FieldValue value={teamSizeLabel} />
        </FieldBlock>
        {practiceDoctors.length > 0 ? (
          <>
            <FieldDivider />
            <FieldBlock label="Doctors">
              <PracticeDoctorFieldValue doctors={practiceDoctors} />
            </FieldBlock>
          </>
        ) : null}
      </SectionPanel>
    </ProfileDetailStack>
  );
}
