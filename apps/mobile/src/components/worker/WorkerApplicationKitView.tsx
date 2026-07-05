import type { WorkerProfile } from '@chairside/api';
import { isWorkerProfileComplete } from '@chairside/api';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import { AuthField } from '@/components/onboarding/AuthField';
import {
  FieldBlock,
  ProfileDetailStack,
  ProfileEmptyState,
  ProfileSummaryBanner,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { EditPillButton } from '@/components/ui/EditPillButton';
import { ApplicationKitPreview } from '@/components/worker/ApplicationKitPreview';
import { ProfilePhotoUpload } from '@/components/worker/ProfilePhotoUpload';
import { ResumeUpload } from '@/components/worker/ResumeUpload';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
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
  const { save } = useWorkerSetupSave();
  const [coverNoteDraft, setCoverNoteDraft] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
    intro: profileSettingsHintStyle({ typography, colors }),
    noteForm: { gap: spacing.sm },
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
        title="Set up your application profile"
        description="Add a photo, resume, and default note so clinics receive a polished application when you apply."
      />
    );
  }

  const hasNote = Boolean(profile.default_cover_message?.trim());
  const backgroundComplete = isWorkerProfileComplete(profile);

  const handleSaveCoverNote = async () => {
    const trimmed = coverNoteDraft.trim();
    if (!trimmed) return;

    setIsSavingNote(true);
    try {
      await save({ default_cover_message: trimmed });
      setCoverNoteDraft('');
      await refreshWorkerProfile();
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <ProfileDetailStack>
      {!backgroundComplete ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Finish your professional background first</Text>
        </View>
      ) : null}

      <ProfileSummaryBanner icon="information-circle-outline" title="What clinics see">
        <Text style={styles.intro}>
          Set this up once and reuse it whenever you apply. Clinics review your application profile
          after you apply or when they request your full application following screening.
        </Text>
      </ProfileSummaryBanner>

      <SectionPanel stepNumber={1} stepAccent="primary" title="Profile photo">
        <Text style={styles.hint}>
          Optional but recommended — helps clinics recognize you on role and fill-in applications.
        </Text>
        <ProfilePhotoUpload embedded onUpdated={() => void refreshWorkerProfile()} />
      </SectionPanel>

      <SectionPanel stepNumber={2} stepAccent="secondary" title="Resume">
        <Text style={styles.hint}>
          Optional PDF attached to role applications so clinics can review your experience in detail.
        </Text>
        <ResumeUpload embedded onUploaded={() => void refreshWorkerProfile()} />
      </SectionPanel>

      <SectionPanel stepNumber={3} stepAccent="primary" title="Default cover note">
        <Text style={styles.hint}>
          A reusable note sent with applications. You can customize it each time you apply.
        </Text>
        <FieldBlock label="Saved note">
          {hasNote ? (
            <DetailProse text={profile.default_cover_message!.trim()} />
          ) : (
            <View style={styles.noteForm}>
              <AuthField
                label="Cover note"
                placeholder="Introduce yourself or explain why you're a good fit"
                value={coverNoteDraft}
                onChangeText={setCoverNoteDraft}
                multiline
                autoCapitalize="sentences"
              />
              <EditPillButton
                label={isSavingNote ? 'Saving…' : 'Save note'}
                showIcon={false}
                onPress={() => void handleSaveCoverNote()}
              />
            </View>
          )}
        </FieldBlock>
      </SectionPanel>

      {displayPreview ? (
        <SectionPanel
          icon="eye-outline"
          title="Clinic preview"
          collapsible
          defaultExpanded={false}>
          <Text style={styles.hint}>This is what clinics will see when they review your application.</Text>
          <ApplicationKitPreview profile={profile} embedded />
        </SectionPanel>
      ) : null}
    </ProfileDetailStack>
  );
}
