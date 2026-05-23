import {
  createJobPost,
  type EmploymentType,
  type RoleType,
} from '@chairside/api';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  ROLE_TYPE_OPTIONS,
} from '@chairside/config';
import { router } from 'expo-router';
import { CLINIC_POSTINGS } from '@/lib/routing';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { OfferingsInput } from '@/components/clinic/OfferingsInput';
import { ScheduleInput } from '@/components/clinic/ScheduleInput';
import { WageRangeInput } from '@/components/clinic/WageRangeInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/theme';

export default function PostJobScreen() {
  const { user } = useAuth();
  const [roleType, setRoleType] = useState<RoleType>('hygienist');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('permanent');
  const [title, setTitle] = useState('');
  const [wageRange, setWageRange] = useState('');
  const [schedule, setSchedule] = useState('');
  const [offerings, setOfferings] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
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
        offerings: offerings.length > 0 ? offerings : undefined,
        description: description.trim() || undefined,
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
    <OnboardingShell>
      <View style={styles.form}>
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
        <WageRangeInput onChange={setWageRange} />
        <ScheduleInput onChange={setSchedule} />
        <OfferingsInput onChange={setOfferings} />

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
      </View>
    </OnboardingShell>
  );
}
