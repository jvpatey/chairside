import {
  createJobPost,
  type EmploymentType,
  type RoleType,
} from '@chairside/api';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  ROLE_TYPE_OPTIONS,
  SOFTWARE_OPTIONS,
  SPECIALTY_OPTIONS,
  type ClinicSpecialty,
} from '@chairside/config';
import { router } from 'expo-router';
import { CLINIC_POSTINGS } from '@/lib/routing';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useThemedStyles } from '@/theme';

export default function PostJobScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { clinicProfile } = useClinicProfile();
  const [roleType, setRoleType] = useState<RoleType>('hygienist');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('permanent');
  const [title, setTitle] = useState('');
  const [wageRange, setWageRange] = useState('');
  const [schedule, setSchedule] = useState('');
  const [specialty, setSpecialty] = useState<ClinicSpecialty>(
    clinicProfile?.specialty ?? 'general',
  );
  const [softwareUsed, setSoftwareUsed] = useState<string[]>(clinicProfile?.software_used ?? []);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: insets.bottom + spacing.lg,
      gap: spacing.lg,
    },
    section: { gap: spacing.sm },
    label: {
      ...typography.body,
      fontWeight: '600',
    },
  }));

  const handlePublish = async () => {
    if (!user?.id || !title.trim()) {
      Alert.alert('Missing information', 'Enter a job title to publish.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createJobPost(user.id, {
        role_type: roleType,
        employment_type: employmentType,
        title: title.trim(),
        wage_range: wageRange.trim() || undefined,
        schedule: schedule.trim() || undefined,
        description: description.trim() || undefined,
        specialty,
        software_used: softwareUsed,
        status: 'live',
      });
      router.replace(CLINIC_POSTINGS);
    } catch (error) {
      Alert.alert(
        'Could not publish',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <AuthScreenHeader
        title="Post a role"
        subtitle="Create a structured job posting."
        onBack={() => router.back()}
      />

      <View style={styles.section}>
        <Text style={styles.label}>Role type</Text>
        <ChipSelector
          options={ROLE_TYPE_OPTIONS}
          selected={roleType}
          onChange={(value) => setRoleType(value as RoleType)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Employment type</Text>
        <ChipSelector
          options={EMPLOYMENT_TYPE_OPTIONS}
          selected={employmentType}
          onChange={(value) => setEmploymentType(value as EmploymentType)}
        />
      </View>

      <AuthField label="Job title" placeholder="Dental hygienist" value={title} onChangeText={setTitle} autoCapitalize="words" />
      <AuthField label="Wage range" placeholder="$38–$45/hr" value={wageRange} onChangeText={setWageRange} />
      <AuthField label="Schedule" placeholder="Mon–Thu, 8am–5pm" value={schedule} onChangeText={setSchedule} />

      <View style={styles.section}>
        <Text style={styles.label}>Specialty</Text>
        <ChipSelector
          options={SPECIALTY_OPTIONS}
          selected={specialty}
          onChange={(value) => setSpecialty(value as ClinicSpecialty)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Software</Text>
        <ChipSelector
          options={SOFTWARE_OPTIONS.map((item) => ({ value: item, label: item }))}
          selected={softwareUsed}
          multiple
          onChange={(value) => setSoftwareUsed(value as string[])}
        />
      </View>

      <AuthField
        label="Description"
        placeholder="Role details and requirements"
        value={description}
        onChangeText={setDescription}
        multiline
        autoCapitalize="sentences"
      />

      <OnboardingButton
        label={isSubmitting ? 'Publishing…' : 'Publish role'}
        disabled={isSubmitting}
        onPress={handlePublish}
      />
    </ScrollView>
  );
}
