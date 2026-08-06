import { getClinicDiscoverJobPost, type LiveJobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { JobPostDetailView } from '@/components/clinic/JobPostDetailView';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useThemedStyles } from '@/theme';

export default function ClinicDiscoverJobDetailScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = typeof id === 'string' ? id : '';
  const [job, setJob] = useState<LiveJobPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing }) => ({
    content: {
      gap: spacing.lg,
    },
  }));

  const loadJob = useCallback(async () => {
    if (!jobId || !user?.id) {
      setJob(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextJob = await getClinicDiscoverJobPost(jobId, user.id);
      if (!nextJob) {
        Alert.alert('Role not found', 'This posting may no longer be available.');
        router.back();
        return;
      }
      setJob(nextJob);
    } catch (error) {
      Alert.alert(
        'Could not load role',
        error instanceof Error ? error.message : 'Please try again.',
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [jobId, user?.id]);

  useRefreshOnFocus(loadJob);

  if (isLoading || !job) {
    return (
      <FormScreen
        title="Role details"
        subtitle={isLoading ? undefined : 'Role not found.'}
        onBack={() => router.back()}>
        {isLoading ? <PageLoadingDetail /> : null}
      </FormScreen>
    );
  }

  const location = [job.clinic.city, job.clinic.province].filter(Boolean).join(', ');

  return (
    <FormScreen
      eyebrow="Discover"
      title="Role details"
      subtitle={job.clinic.clinic_name}
      onBack={() => router.back()}>
      <View style={styles.content}>
        <SurfaceCard>
          <ClinicPostHeader
            layout="split"
            clinicName={job.clinic.clinic_name}
            logoStoragePath={job.clinic.logo_storage_path}
            title={job.title}
            location={location || null}
            detail={formatJobPostRoleMeta(job)}
            avatarSize={44}
          />
        </SurfaceCard>
        <JobPostDetailView job={job} />
      </View>
    </FormScreen>
  );
}
