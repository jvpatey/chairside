import {
  createJobPost,
  getErrorMessage,
  getJobPostWithScreening,
  updateJobPost,
  type EmploymentType,
  type JobPostWithScreening,
  type RoleType,
} from '@chairside/api';
import {
  normalizeRoleEmploymentType,
  ROLE_EMPLOYMENT_TYPE_OPTIONS,
  ROLE_TYPE_OPTIONS,
  THIN_PERMANENT_ROLES,
} from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { CLINIC_POSTINGS } from '@/lib/routing';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { WageRangeInput } from '@/components/clinic/WageRangeInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { PlanUpgradeCallout } from '@/components/billing/PlanUpgradeCallout';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicActingContext } from '@/hooks/useClinicActingContext';
import { resolveActiveLocationId } from '@/lib/clinicLocationScope';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { useFormSectionScroll } from '@/hooks/useFormSectionScroll';
import { usePostingFormScreenProps } from '@/hooks/usePostingFormScreenProps';
import {
  getClinicPostingLimitReachedMessage,
  getClinicPostingLimitTitle,
  isRolePostingLimitReached,
} from '@/lib/clinicPlanPresentation';
import { showFormError } from '@/lib/formErrors';
import { useThemedStyles } from '@/theme';

function applyJobToForm(job: JobPostWithScreening) {
  return {
    roleType: job.role_type,
    employmentType: normalizeRoleEmploymentType(job.employment_type),
    title: job.title,
    wageRange: job.wage_range ?? '',
    description: job.description ?? '',
  };
}

const DEFAULT_CREATE_FORM = {
  roleType: 'hygienist' as RoleType,
  employmentType: 'permanent' as EmploymentType,
  title: '',
  wageRange: '',
  description: '',
};

export default function PostJobScreen() {
  const { user } = useAuth();
  const {
    clinicId,
    accessibleLocations,
    locationScope,
    isGroup,
    attribution,
    attributionLabel,
  } = useClinicActingContext();
  const {
    billing,
    upgradePrompt,
    showPublishUpgrade,
    handleBillingError,
  } = useClinicUpgradePrompt();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const jobId = typeof id === 'string' ? id : undefined;
  const isEditing = Boolean(jobId);
  const roleLimitReached = !isEditing && isRolePostingLimitReached(billing);
  const { setSectionRef, scrollToFirstSection } = useFormSectionScroll();
  const postingFormProps = usePostingFormScreenProps();

  const [roleType, setRoleType] = useState<RoleType>('hygienist');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('permanent');
  const [title, setTitle] = useState('');
  const [wageRange, setWageRange] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState<string | null>(
    resolveActiveLocationId(locationScope, accessibleLocations),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [formKey, setFormKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [wageValid, setWageValid] = useState(true);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    form: { gap: spacing.lg },
    noticeBlock: {
      gap: spacing.sm,
    },
    section: { gap: spacing.sm },
    helper: typography.subtitle,
    fieldError: {
      ...typography.subtitle,
      color: colors.destructive,
      fontSize: 13,
      marginTop: spacing.xs,
    },
  }));

  const resetForm = useCallback(() => {
    setRoleType(DEFAULT_CREATE_FORM.roleType);
    setEmploymentType(DEFAULT_CREATE_FORM.employmentType);
    setTitle(DEFAULT_CREATE_FORM.title);
    setWageRange(DEFAULT_CREATE_FORM.wageRange);
    setDescription(DEFAULT_CREATE_FORM.description);
    setTitleError(null);
    setWageValid(true);
    setFormKey((current) => current + 1);
  }, []);

  const loadJob = useCallback(async () => {
    if (!jobId || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const job = await getJobPostWithScreening(clinicId ?? user.id, jobId);
      if (!job) {
        const message = 'This posting may have been removed.';
        setFormError(showFormError(message, { title: 'Role not found' }));
        router.back();
        return;
      }

      const form = applyJobToForm(job);
      setRoleType(form.roleType);
      setEmploymentType(form.employmentType);
      setTitle(form.title);
      setWageRange(form.wageRange);
      setDescription(form.description);
      setLocationId(job.location_id ?? null);
      setFormKey((current) => current + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(showFormError(message, { title: 'Could not load role' }));
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, jobId, user?.id]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  const handleSubmit = async () => {
    if (!user?.id || !clinicId || !title.trim()) {
      const message = 'Enter a job title to continue.';
      setTitleError(message);
      setFormError(showFormError(message));
      scrollToFirstSection(['title']);
      return;
    }

    if (isGroup && !locationId) {
      const message = 'Choose which location this role is for.';
      setFormError(showFormError(message));
      scrollToFirstSection(['location']);
      return;
    }

    if (!wageValid) {
      const message = 'Maximum wage must be greater than minimum.';
      setFormError(showFormError(message, { title: 'Invalid compensation' }));
      scrollToFirstSection(['wage']);
      return;
    }

    if (!isEditing && billing && !billing.canPublishRole) {
      showPublishUpgrade();
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setTitleError(null);
    try {
      const payload = {
        role_type: roleType,
        employment_type: employmentType,
        title: title.trim(),
        wage_range: wageRange.trim() || undefined,
        description: description.trim() || undefined,
        ...(THIN_PERMANENT_ROLES
          ? { screening_enabled: false, screeningQuestions: [] as const }
          : {}),
        ...(isGroup ? { location_id: locationId } : {}),
      };

      if (isEditing && jobId) {
        await updateJobPost(clinicId, jobId, payload);
        router.back();
      } else {
        await createJobPost(clinicId, {
          ...payload,
          status: 'live',
          organization_id: clinicId,
          location_id: locationId,
          ...attribution,
        });
        resetForm();
        router.replace(CLINIC_POSTINGS);
      }
    } catch (error) {
      if (handleBillingError(error)) {
        return;
      }
      const message = getErrorMessage(error, 'Please try again.');
      setFormError(
        showFormError(message, {
          title: isEditing ? 'Could not save changes' : 'Could not publish',
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButton = (
    <OnboardingButton
      label={
        isSubmitting
          ? isEditing
            ? 'Saving…'
            : 'Publishing…'
          : isEditing
            ? 'Save changes'
            : 'Post role & alert matches'
      }
      disabled={isSubmitting || roleLimitReached}
      onPress={handleSubmit}
    />
  );

  if (isLoading) {
    return (
      <FormScreen
        {...postingFormProps}
        title={isEditing ? 'Edit role' : 'Post a role'}
        onBack={() => router.back()}
      >
        <PageLoadingDetail />
      </FormScreen>
    );
  }

  return (
    <>
      {upgradePrompt}
      <FormScreen
        {...postingFormProps}
        title={isEditing ? 'Edit role' : 'Post a role'}
        subtitle={
          isEditing
            ? 'Update role title, location, pay, and description.'
            : 'Matched professionals get an in-app alert — no screening or interview steps.'
        }
        onBack={() => router.back()}
        footer={submitButton}
        afterCard={
          roleLimitReached && billing ? (
            <View style={styles.noticeBlock}>
              <PlanUpgradeCallout
                title={getClinicPostingLimitTitle('role')}
                message={getClinicPostingLimitReachedMessage(billing, 'role')}
                compact
              />
            </View>
          ) : null
        }
      >
        <FormErrorBanner message={formError} />

        <View style={styles.form}>
          {isGroup ? (
            <View ref={setSectionRef('location')} style={styles.section} collapsable={false}>
              <FormSectionHeader icon="location-outline" label="Location" required />
              <ChipSelector
                options={accessibleLocations.map((location) => ({
                  value: location.id,
                  label: location.name,
                }))}
                selected={locationId}
                onChange={(value) => {
                  setLocationId(value as string);
                  setFormError(null);
                }}
              />
              {attributionLabel ? (
                <Text style={styles.helper}>Will show as posted by {attributionLabel}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <FormSectionHeader icon="person-outline" label="Role type" />
            <ChipSelector
              options={ROLE_TYPE_OPTIONS}
              selected={roleType}
              onChange={(value) => setRoleType(value as RoleType)}
            />
          </View>

          <View style={styles.section}>
            <FormSectionHeader icon="briefcase-outline" label="Employment type" />
            <ChipSelector
              options={ROLE_EMPLOYMENT_TYPE_OPTIONS}
              selected={employmentType}
              onChange={(value) => setEmploymentType(value as EmploymentType)}
            />
          </View>

          <View ref={setSectionRef('title')} collapsable={false}>
            <AuthField
              label="Job title"
              placeholder="Dental hygienist"
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                setTitleError(null);
                setFormError(null);
              }}
              autoCapitalize="words"
              required
              invalid={Boolean(titleError)}
              icon="create-outline"
            />
            {titleError ? <Text style={styles.fieldError}>{titleError}</Text> : null}
          </View>

          <View ref={setSectionRef('wage')} style={styles.section} collapsable={false}>
            <FormSectionHeader icon="cash-outline" label="Compensation (optional)" />
            <WageRangeInput
              key={`wage-${formKey}`}
              initialValue={wageRange}
              onChange={setWageRange}
              onValidationChange={setWageValid}
              embedded
            />
          </View>

          <AuthField
            label="Description"
            placeholder="Short summary of the role"
            value={description}
            onChangeText={setDescription}
            multiline
            autoCapitalize="sentences"
            icon="document-text-outline"
          />
        </View>
      </FormScreen>
    </>
  );
}