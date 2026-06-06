import {
  createJobPost,
  getJobPostWithScreening,
  screeningQuestionInputFromSelection,
  updateJobPost,
  type EmploymentType,
  type JobPostWithScreening,
  type RoleType,
} from '@chairside/api';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  ROLE_TYPE_OPTIONS,
} from '@chairside/config';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CLINIC_POSTINGS } from '@/lib/routing';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { OfferingsInput } from '@/components/clinic/OfferingsInput';
import { ScheduleInput } from '@/components/clinic/ScheduleInput';
import {
  ScreeningToggleSection,
  type CustomScreeningQuestion,
} from '@/components/clinic/ScreeningToggleSection';
import { WageRangeInput } from '@/components/clinic/WageRangeInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/theme';

function applyJobToForm(job: JobPostWithScreening) {
  const catalogSlugs = job.screening_questions
    .filter((question) => question.catalogSlug)
    .map((question) => question.catalogSlug!);

  const customQuestions: CustomScreeningQuestion[] = job.screening_questions
    .filter((question) => question.customPrompt)
    .map((question) => ({
      id: question.id,
      prompt: question.customPrompt!,
      type: question.type,
    }));

  return {
    roleType: job.role_type,
    employmentType: job.employment_type,
    title: job.title,
    wageRange: job.wage_range ?? '',
    schedule: job.schedule ?? '',
    offerings: job.offerings ?? [],
    description: job.description ?? '',
    screeningEnabled: job.screening_enabled,
    selectedCatalogSlugs: catalogSlugs,
    customQuestions,
  };
}

const DEFAULT_CREATE_FORM = {
  roleType: 'hygienist' as RoleType,
  employmentType: 'permanent' as EmploymentType,
  title: '',
  wageRange: '',
  schedule: '',
  offerings: [] as string[],
  description: '',
  screeningEnabled: false,
  selectedCatalogSlugs: [] as string[],
  customQuestions: [] as CustomScreeningQuestion[],
};

export default function PostJobScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const jobId = typeof id === 'string' ? id : undefined;
  const isEditing = Boolean(jobId);

  const [roleType, setRoleType] = useState<RoleType>('hygienist');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('permanent');
  const [title, setTitle] = useState('');
  const [wageRange, setWageRange] = useState('');
  const [schedule, setSchedule] = useState('');
  const [offerings, setOfferings] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [screeningEnabled, setScreeningEnabled] = useState(false);
  const [selectedCatalogSlugs, setSelectedCatalogSlugs] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<CustomScreeningQuestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [formKey, setFormKey] = useState(0);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    section: { gap: spacing.sm },
    label: {
      ...typography.body,
      fontWeight: '600',
    },
    loading: typography.subtitle,
  }));

  const resetForm = useCallback(() => {
    setRoleType(DEFAULT_CREATE_FORM.roleType);
    setEmploymentType(DEFAULT_CREATE_FORM.employmentType);
    setTitle(DEFAULT_CREATE_FORM.title);
    setWageRange(DEFAULT_CREATE_FORM.wageRange);
    setSchedule(DEFAULT_CREATE_FORM.schedule);
    setOfferings(DEFAULT_CREATE_FORM.offerings);
    setDescription(DEFAULT_CREATE_FORM.description);
    setScreeningEnabled(DEFAULT_CREATE_FORM.screeningEnabled);
    setSelectedCatalogSlugs(DEFAULT_CREATE_FORM.selectedCatalogSlugs);
    setCustomQuestions(DEFAULT_CREATE_FORM.customQuestions);
    setFormKey((current) => current + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isEditing) {
        resetForm();
      }
    }, [isEditing, resetForm]),
  );

  const loadJob = useCallback(async () => {
    if (!jobId || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const job = await getJobPostWithScreening(user.id, jobId);
      if (!job) {
        Alert.alert('Role not found', 'This posting may have been removed.');
        router.back();
        return;
      }

      const form = applyJobToForm(job);
      setRoleType(form.roleType);
      setEmploymentType(form.employmentType);
      setTitle(form.title);
      setWageRange(form.wageRange);
      setSchedule(form.schedule);
      setOfferings(form.offerings);
      setDescription(form.description);
      setScreeningEnabled(form.screeningEnabled);
      setSelectedCatalogSlugs(form.selectedCatalogSlugs);
      setCustomQuestions(form.customQuestions);
      setFormKey((current) => current + 1);
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

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  const handleSubmit = async () => {
    if (!user?.id || !title.trim()) {
      Alert.alert('Missing information', 'Enter a job title to continue.');
      return;
    }

    if (screeningEnabled && selectedCatalogSlugs.length === 0 && customQuestions.length === 0) {
      Alert.alert('Screening questions', 'Select at least one question or turn off screening.');
      return;
    }

    setIsSubmitting(true);
    try {
      const screeningQuestions = screeningEnabled
        ? screeningQuestionInputFromSelection(selectedCatalogSlugs, customQuestions)
        : [];

      const payload = {
        role_type: roleType,
        employment_type: employmentType,
        title: title.trim(),
        wage_range: wageRange.trim() || undefined,
        schedule: schedule.trim() || undefined,
        offerings,
        description: description.trim() || undefined,
        screening_enabled: screeningEnabled,
        screeningQuestions,
      };

      if (isEditing && jobId) {
        await updateJobPost(user.id, jobId, payload);
        router.back();
      } else {
        await createJobPost(user.id, {
          ...payload,
          offerings: offerings.length > 0 ? offerings : undefined,
          status: 'live',
        });
        resetForm();
        router.replace(CLINIC_POSTINGS);
      }
    } catch (error) {
      Alert.alert(
        isEditing ? 'Could not save changes' : 'Could not publish',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <OnboardingShell>
        <Text style={styles.loading}>Loading role…</Text>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell>
      <View style={styles.form}>
        <AuthScreenHeader
          title={isEditing ? 'Edit role' : 'Post a role'}
          subtitle={
            isEditing
              ? 'Update your job posting details.'
              : 'Create a structured job posting.'
          }
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
        <WageRangeInput key={`wage-${formKey}`} initialValue={wageRange} onChange={setWageRange} />
        <ScheduleInput key={`schedule-${formKey}`} initialValue={schedule} onChange={setSchedule} />
        <OfferingsInput key={`offerings-${formKey}`} initialValue={offerings} onChange={setOfferings} />

        <AuthField
          label="Description"
          placeholder="Role details and requirements"
          value={description}
          onChangeText={setDescription}
          multiline
          autoCapitalize="sentences"
        />

        <ScreeningToggleSection
          enabled={screeningEnabled}
          selectedCatalogSlugs={selectedCatalogSlugs}
          customQuestions={customQuestions}
          onEnabledChange={setScreeningEnabled}
          onSelectedCatalogSlugsChange={setSelectedCatalogSlugs}
          onCustomQuestionsChange={setCustomQuestions}
        />

        <OnboardingButton
          label={isSubmitting ? (isEditing ? 'Saving…' : 'Publishing…') : isEditing ? 'Save changes' : 'Publish role'}
          disabled={isSubmitting}
          onPress={handleSubmit}
        />
      </View>
    </OnboardingShell>
  );
}
