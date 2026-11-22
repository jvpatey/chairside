import type { WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import { getProvinceLabel, getRoleTypeLabel } from '@chairside/config';
import { Text } from 'react-native';

import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  ProfileSummaryBanner,
  ProfileTagRow,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { useThemedStyles } from '@/theme';

type WorkerProfessionalViewProps = {
  profile: WorkerProfile | null;
};

export function WorkerProfessionalView({ profile }: WorkerProfessionalViewProps) {
  const styles = useThemedStyles(({ colors, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
    intro: profileSettingsHintStyle({ typography, colors }),
  }));

  if (!profile) {
    return (
      <ProfileEmptyState
        icon="person-outline"
        title="Add a few details"
        description="Tell us your role and city so we can text you about nearby fill-ins."
      />
    );
  }

  const roles = getWorkerRoleTypes(profile).map(getRoleTypeLabel);
  const locationLabel = [profile.city, profile.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');
  const street = profile.address_line1?.trim() || null;

  return (
    <ProfileDetailStack>
      <ProfileSummaryBanner icon="information-circle-outline" title="Used for matching">
        <Text style={styles.intro}>
          Role and city help us text you the right fill-ins. That’s all we need.
        </Text>
      </ProfileSummaryBanner>

      <SectionPanel icon="ribbon-outline" iconAccent="primary" title="Role">
        <Text style={styles.hint}>What you’re qualified to cover.</Text>
        <FieldBlock label="Roles">
          <ProfileTagRow tags={roles} emptyText="Add your role." />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel icon="location-outline" iconAccent="primary" title="Place">
        <Text style={styles.hint}>Where you want nearby fill-in texts.</Text>
        <FieldBlock label="City">
          <FieldValue value={locationLabel || null} />
        </FieldBlock>
        {street ? (
          <>
            <FieldDivider />
            <FieldBlock label="Street (optional)">
              <FieldValue value={street} />
            </FieldBlock>
          </>
        ) : null}
      </SectionPanel>
    </ProfileDetailStack>
  );
}
