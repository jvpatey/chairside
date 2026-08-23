import type { ClinicProfile } from '@chairside/api';
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
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { useThemedStyles } from '@/theme';

type ClinicGroupDetailsViewProps = {
  profile: ClinicProfile | null;
  groupName?: string | null;
};

export function ClinicGroupDetailsView({ profile, groupName }: ClinicGroupDetailsViewProps) {
  const styles = useThemedStyles(({ colors, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
  }));

  if (!profile) {
    return (
      <ProfileEmptyState
        icon="business-outline"
        title="Add group details"
        description="Add your group name and contact phone so candidates know who they are working with."
      />
    );
  }

  const displayName = groupName?.trim() || profile.clinic_name?.trim() || 'Your group';

  return (
    <ProfileDetailStack>
      <ClinicIdentityHeroCard
        clinicName={displayName}
        logoUri={null}
        specialtyLabel={null}
        locationLabel={null}
        emptyMetaFallback="Add your group name so it appears across roles and fill-ins."
      />

      <CardInfoPanel variant="info" icon="information-circle-outline" title="What candidates see">
        <CardInfoPanelText>
          Your group name appears on postings and messages. Location-specific details live under
          Locations.
        </CardInfoPanelText>
      </CardInfoPanel>

      <SectionPanel icon="business-outline" title="Group identity">
        <Text style={styles.hint}>The brand name for your clinic group account.</Text>
        <FieldBlock label="Group name">
          <FieldValue value={profile.clinic_name} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Group phone">
          <FieldValue value={profile.phone} />
        </FieldBlock>
      </SectionPanel>
    </ProfileDetailStack>
  );
}
