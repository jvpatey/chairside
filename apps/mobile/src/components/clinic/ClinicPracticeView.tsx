import type { ClinicProfile } from '@chairside/api';
import { SPECIALTY_OPTIONS, getProvinceLabel, getTeamSizeRangeLabel } from '@chairside/config';
import { Text, View } from 'react-native';

import { PracticeDoctorFieldValue } from '@/components/clinic/PracticeDoctorList';
import { ClinicIdentityHeroCard } from '@/components/clinic/ClinicProfileHero';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  ProfileTagRow,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { EditPillButton } from '@/components/ui/EditPillButton';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { useThemedStyles } from '@/theme';

type ClinicPracticeViewProps = {
  profile: ClinicProfile | null;
  onEditContact?: () => void;
  onEditLocation?: () => void;
  onEditPractice?: () => void;
};

function sectionEditAccessory(onPress?: () => void) {
  return onPress ? <EditPillButton label="Edit" onPress={onPress} /> : undefined;
}

export function ClinicPracticeView({
  profile,
  onEditContact,
  onEditLocation,
  onEditPractice,
}: ClinicPracticeViewProps) {
  const { locations } = useClinicProfile();
  const { logoUri } = useClinicLogo();
  const doctorLocations = locations
    .filter((location) => location.is_active)
    .map((location) => ({ id: location.id, name: location.name }));
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
    doctorsBlock: { gap: spacing.sm },
  }));

  if (!profile) {
    return (
      <ProfileEmptyState
        icon="business-outline"
        title="Add practice details"
        description="Add your practice details, location, and contact info to start posting."
      />
    );
  }

  const clinicName = profile.clinic_name?.trim() || 'Your practice';
  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === profile.specialty)?.label ?? null;
  const locationLabel = [profile.city, profile.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');
  const teamSizeLabel = getTeamSizeRangeLabel(profile.team_size_range ?? null);
  const softwareUsed = profile.software_used ?? [];
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
      <ClinicIdentityHeroCard
        clinicName={clinicName}
        logoUri={logoUri}
        specialtyLabel={specialtyLabel}
        locationLabel={locationLabel || null}
        emptyMetaFallback="Add your specialty and location so candidates know where you are."
      />

      <CardInfoPanel variant="info" icon="information-circle-outline" title="What candidates see">
        <CardInfoPanelText>
          Candidates use your contact details, location, and practice setup to decide whether a
          role or fill-in is a good fit before they apply or accept an interview.
        </CardInfoPanelText>
      </CardInfoPanel>

      <SectionPanel
        icon="call-outline"
        title="Contact"
        headerAccessory={sectionEditAccessory(onEditContact)}>
        <Text style={styles.hint}>
          Your practice name and who candidates can reach.
        </Text>
        <FieldBlock label="Clinic name">
          <FieldValue value={profile.clinic_name} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Contact name">
          <FieldValue value={profile.contact_name} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Phone">
          <FieldValue value={profile.phone} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel
        icon="location-outline"
        title="Location"
        headerAccessory={sectionEditAccessory(onEditLocation)}>
        <Text style={styles.hint}>
          Where your practice is based — shown on roles, fill-ins, and your public clinic profile.
        </Text>
        <FieldBlock label="City & province">
          <FieldValue value={locationLabel || null} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Full address">
          <FieldValue value={address || null} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel
        icon="medkit-outline"
        title="Practice setup"
        headerAccessory={sectionEditAccessory(onEditPractice)}>
        <Text style={styles.hint}>
          Your clinical environment, team size, and doctors help candidates understand day-to-day
          work at your practice.
        </Text>
        <FieldBlock label="Specialty">
          <FieldValue value={specialtyLabel} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Software">
          <ProfileTagRow
            tags={softwareUsed}
            emptyText="Add the software systems your team uses."
          />
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
              <View style={styles.doctorsBlock}>
                <PracticeDoctorFieldValue
                  doctors={practiceDoctors}
                  locations={doctorLocations}
                />
              </View>
            </FieldBlock>
          </>
        ) : null}
      </SectionPanel>
    </ProfileDetailStack>
  );
}
