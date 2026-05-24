import type { WorkerProfile } from '@chairside/api';
import { isApplicationPackageReady } from '@chairside/api';
import { Text, View } from 'react-native';

import { ApplicationKitPreview } from '@/components/worker/ApplicationKitPreview';
import { ProfileSection } from '@/components/worker/ProfileSection';
import { ResumeUpload } from '@/components/worker/ResumeUpload';
import { useThemedStyles } from '@/theme';

type WorkerApplicationKitViewProps = {
  profile: WorkerProfile | null;
  displayPreview?: boolean;
};

export function WorkerApplicationKitView({
  profile,
  displayPreview = true,
}: WorkerApplicationKitViewProps) {
  const ready = isApplicationPackageReady(profile);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: ready ? colors.primarySubtle : colors.fillSubtle,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: ready ? colors.primary : colors.labelSecondary,
    },
  }));

  return (
    <ProfileSection
      title="Application kit"
      subtitle="What clinics receive when you apply to a role. Resume is optional.">
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {ready ? 'Ready to quick apply' : 'Complete your background to quick apply'}
        </Text>
      </View>

      <ResumeUpload />

      {displayPreview ? <ApplicationKitPreview profile={profile} /> : null}
    </ProfileSection>
  );
}
