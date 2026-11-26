import type { ClinicProfile } from '@chairside/api';
import { getProvinceLabel } from '@chairside/config';
import { Text } from 'react-native';

import { ClinicIdentityHeroCard } from '@/components/clinic/ClinicProfileHero';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { EditPillButton } from '@/components/ui/EditPillButton';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { formatPhoneNumber } from '@/lib/phone';
import { useThemedStyles } from '@/theme';

type ClinicPracticeViewProps = {
  profile: ClinicProfile | null;
  onEditContact?: () => void;
  onEditLocation?: () => void;
};

function sectionEditAccessory(onPress?: () => void) {
  return onPress ? <EditPillButton label="Edit" onPress={onPress} /> : undefined;
}

export function ClinicPracticeView({
  profile,
  onEditContact,
  onEditLocation,
}: ClinicPracticeViewProps) {
  const { logoUri } = useClinicLogo();
  const styles = useThemedStyles(({ colors, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
  }));

  if (!profile) {
    return (
      <ProfileEmptyState
        icon="business-outline"
        title="Add practice details"
        description="Add your clinic name, phone, and address to start posting."
      />
    );
  }

  const clinicName = profile.clinic_name?.trim() || 'Your practice';
  const locationLabel = [profile.city, profile.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');
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
        specialtyLabel={null}
        locationLabel={locationLabel || null}
        emptyMetaFallback="Add your clinic address."
      />

      <SectionPanel
        icon="call-outline"
        title="Contact"
        headerAccessory={sectionEditAccessory(onEditContact)}>
        <Text style={styles.hint}>
          Your clinic name and phone — cover-request texts for fill-ins go to this number.
        </Text>
        <FieldBlock label="Clinic name">
          <FieldValue value={profile.clinic_name} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Phone">
          <FieldValue value={profile.phone ? formatPhoneNumber(profile.phone) : null} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel
        icon="location-outline"
        title="Location"
        headerAccessory={sectionEditAccessory(onEditLocation)}>
        <Text style={styles.hint}>
          Where your practice is based — shown on fill-ins and roles.
        </Text>
        <FieldBlock label="City & province">
          <FieldValue value={locationLabel || null} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Full address">
          <FieldValue value={address || null} />
        </FieldBlock>
      </SectionPanel>
    </ProfileDetailStack>
  );
}
