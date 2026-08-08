import type { WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import {
  formatWorkerEducation,
  getEmploymentTypeLabel,
  getProvinceLabel,
  getRoleTypeLabel,
  getSpecialtyLabel,
  getTravelRadiusRangeLabel,
} from '@chairside/config';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import { AuthField } from '@/components/onboarding/AuthField';
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
import { EditPillButton } from '@/components/ui/EditPillButton';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useThemedStyles } from '@/theme';

type WorkerProfessionalViewProps = {
  profile: WorkerProfile | null;
};

export function WorkerProfessionalView({ profile }: WorkerProfessionalViewProps) {
  const { refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [bioDraft, setBioDraft] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
    intro: profileSettingsHintStyle({ typography, colors }),
    bioForm: { gap: spacing.sm },
  }));

  if (!profile) {
    return (
      <ProfileEmptyState
        icon="briefcase-outline"
        title="Build your professional background"
        description="Add your roles, experience, and location so clinics can match you to the right opportunities."
      />
    );
  }

  const roles = getWorkerRoleTypes(profile).map(getRoleTypeLabel);
  const locationLabel = [profile.city, profile.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');
  const fullAddress = [
    profile.address_line1,
    profile.city,
    getProvinceLabel(profile.province),
    profile.postal_code,
  ]
    .filter(Boolean)
    .join(', ');
  const education = formatWorkerEducation(profile);
  const softwareTags = profile.software_used;
  const specialtyTags = profile.practice_types.map(getSpecialtyLabel);
  const employmentTags = (profile.preferred_employment_types ?? []).map(getEmploymentTypeLabel);
  const travelLabel = getTravelRadiusRangeLabel(profile.travel_radius_range);
  const hasBio = Boolean(profile.bio?.trim());

  const handleSaveBio = async () => {
    const trimmed = bioDraft.trim();
    if (!trimmed) return;

    setIsSavingBio(true);
    try {
      await save({ bio: trimmed });
      setBioDraft('');
      await refreshWorkerProfile();
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSavingBio(false);
    }
  };

  return (
    <ProfileDetailStack>
      <ProfileSummaryBanner icon="information-circle-outline" title="How clinics evaluate fit">
        <Text style={styles.intro}>
          Clinics use this background to understand your experience, location, and preferences
          before reviewing your applications or inviting you to interview.
        </Text>
      </ProfileSummaryBanner>

      <SectionPanel stepNumber={1} stepAccent="primary" title="Roles">
        <Text style={styles.hint}>
          The positions you are open to — clinics use this to match you with the right
          opportunities.
        </Text>
        <FieldBlock label="Qualified roles">
          <ProfileTagRow
            tags={roles}
            emptyText="Add roles so clinics know what positions fit you."
          />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel stepNumber={2} stepAccent="secondary" title="Experience">
        <Text style={styles.hint}>
          Your clinical background helps clinics quickly assess whether you are a strong fit.
        </Text>
        <FieldBlock label="Experience">
          <FieldValue
            value={
              profile.years_of_experience != null
                ? `${profile.years_of_experience} years`
                : null
            }
          />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Education">
          <FieldValue value={education || null} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel stepNumber={3} stepAccent="primary" title="Location">
        <Text style={styles.hint}>
          Where you are based and how far you are willing to travel for work.
        </Text>
        <FieldBlock label="Location">
          <FieldValue value={locationLabel || null} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Full address">
          <FieldValue value={fullAddress || null} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Preferred travel distance">
          <FieldValue value={travelLabel || null} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel stepNumber={4} stepAccent="secondary" title="Skills & preferences">
        <Text style={styles.hint}>
          Software, practice environments, and employment types you prefer.
        </Text>
        <FieldBlock label="Software">
          <ProfileTagRow
            tags={softwareTags}
            emptyText="Add software you're comfortable using."
          />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Practice environments">
          <ProfileTagRow
            tags={specialtyTags}
            emptyText="Add practice environments you prefer."
          />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Preferred employment">
          <ProfileTagRow
            tags={employmentTags}
            emptyText="Add employment types you are open to."
          />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel icon="document-text-outline" title="Bio">
        <Text style={styles.hint}>
          A short introduction clinics can read when learning more about you.
        </Text>
        <FieldBlock label="Saved bio">
          {hasBio ? (
            <DetailProse text={profile.bio!.trim()} />
          ) : (
            <View style={styles.bioForm}>
              <AuthField
                label="Bio"
                placeholder="Tell clinics about your background and work style"
                value={bioDraft}
                onChangeText={setBioDraft}
                multiline
                autoCapitalize="sentences"
              />
              <EditPillButton
                label={isSavingBio ? 'Saving…' : 'Save bio'}
                showIcon={false}
                onPress={() => void handleSaveBio()}
              />
            </View>
          )}
        </FieldBlock>
      </SectionPanel>
    </ProfileDetailStack>
  );
}
