import type { WorkerProfile } from '@chairside/api';
import { isWorkerProfileComplete } from '@chairside/api';
import { Text, View } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import {
  FieldBlock,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { ApplicationKitPreview } from '@/components/worker/ApplicationKitPreview';
import { ProfilePhotoUpload } from '@/components/worker/ProfilePhotoUpload';
import { ResumeUpload } from '@/components/worker/ResumeUpload';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useThemedStyles } from '@/theme';

type WorkerApplicationKitViewProps = {
  profile: WorkerProfile | null;
  displayPreview?: boolean;
};

export function WorkerApplicationKitView({
  profile,
  displayPreview = true,
}: WorkerApplicationKitViewProps) {
  const { refreshWorkerProfile } = useWorkerProfile();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 1,
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  if (!profile) {
    return (
      <ProfileEmptyState
        icon="folder-open-outline"
        title="Set up your application kit"
        description="Add a photo, resume, and default note so clinics receive a polished application when you apply."
      />
    );
  }

  const hasNote = Boolean(profile.default_cover_message?.trim());
  const backgroundComplete = isWorkerProfileComplete(profile);

  return (
    <ProfileDetailStack>
      {!backgroundComplete ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Finish your professional background first</Text>
        </View>
      ) : null}

      <SectionPanel icon="camera-outline" title="Profile photo">
        <Text style={styles.hint}>
          Optional — included with role and fill-in applications.
        </Text>
        <ProfilePhotoUpload embedded onUpdated={() => void refreshWorkerProfile()} />
      </SectionPanel>

      <SectionPanel icon="document-text-outline" title="Resume">
        <Text style={styles.hint}>Optional PDF attached to role applications.</Text>
        <ResumeUpload embedded onUploaded={() => void refreshWorkerProfile()} />
      </SectionPanel>

      <SectionPanel icon="chatbox-ellipses-outline" title="Default cover note">
        <FieldBlock label="Saved note">
          {hasNote ? (
            <DetailProse text={profile.default_cover_message!.trim()} />
          ) : (
            <FieldValue value={null} />
          )}
        </FieldBlock>
      </SectionPanel>

      {displayPreview ? (
        <SectionPanel icon="eye-outline" title="Clinic preview">
          <ApplicationKitPreview profile={profile} embedded />
        </SectionPanel>
      ) : null}
    </ProfileDetailStack>
  );
}
