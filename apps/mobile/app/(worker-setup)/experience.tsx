import {
  EDUCATION_DEGREE_TYPE_OPTIONS,
  type EducationDegreeType,
  isNoPostSecondaryEducation,
} from '@chairside/config';
import { router } from 'expo-router';
import { WORKER_SETUP_SKILLS } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormScreen } from '@/components/ui/FormScreen';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { useSetupStepProgress } from '@/hooks/useSetupStepProgress';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useWorkerSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useThemedStyles } from '@/theme';

const CURRENT_YEAR = new Date().getFullYear();

export default function WorkerExperienceScreen() {
  const { profile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'worker' });
  const setupFormProps = useSetupFormScreenProps('worker');
  const progress = useSetupStepProgress('experience', { role: 'worker' });
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [degreeType, setDegreeType] = useState<EducationDegreeType | null>(null);
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institution, setInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useWorkerSetupStepGuard(
    'experience',
    workerProfile,
    profile?.first_name,
    profile?.last_name,
    isWorkerProfileReady,
    isEditMode,
  );

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.lg },
    section: { gap: spacing.sm },
    educationDetails: { gap: spacing.md },
  }));

  useEffect(() => {
    if (!workerProfile) return;
    setYearsOfExperience(
      workerProfile.years_of_experience != null
        ? String(workerProfile.years_of_experience)
        : '',
    );
    setGraduationYear(
      workerProfile.education_graduation_year != null
        ? String(workerProfile.education_graduation_year)
        : '',
    );
    setDegreeType((workerProfile.education_degree_type as EducationDegreeType) ?? null);
    setFieldOfStudy(workerProfile.education_field ?? '');
    setInstitution(workerProfile.education_institution ?? '');
  }, [workerProfile]);

  const handleContinue = async () => {
    const years = yearsOfExperience.trim() ? Number(yearsOfExperience) : null;
    const gradYear = graduationYear.trim() ? Number(graduationYear) : null;

    if (years != null && (!Number.isFinite(years) || years < 0)) {
      setSubmitError('Enter a valid number of years of experience.');
      return;
    }
    if (
      !isNoPostSecondaryEducation(degreeType) &&
      gradYear != null &&
      (!Number.isFinite(gradYear) || gradYear < 1950 || gradYear > CURRENT_YEAR + 1)
    ) {
      setSubmitError('Enter a valid graduation year.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const noPostSecondary = isNoPostSecondaryEducation(degreeType);
      await save({
        years_of_experience: years,
        education_graduation_year: noPostSecondary ? null : gradYear,
        education_degree_type: degreeType,
        education_field: noPostSecondary ? null : fieldOfStudy.trim() || null,
        education_institution: noPostSecondary ? null : institution.trim() || null,
        education: null,
      });
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(WORKER_SETUP_SKILLS);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWorkerProfileReady) return null;

  const showEducationDetails = !isNoPostSecondaryEducation(degreeType);

  const handleDegreeTypeChange = (value: EducationDegreeType) => {
    setDegreeType(value);
    if (isNoPostSecondaryEducation(value)) {
      setGraduationYear('');
      setFieldOfStudy('');
      setInstitution('');
    }
  };

  return (
    <FormScreen
      {...setupFormProps}
      title="Professional background · Experience & education"
      subtitle="Clinics will receive this with every application."
      onBack={() => (isEditMode ? router.replace(exitHref) : router.back())}
      footer={
        <SetupStepFooter
          canContinue
          validationMessage={null}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel={isEditMode ? 'Save changes' : 'Continue'}
          onContinue={handleContinue}
        />
      }>
      {progress.visible ? (
        <SetupStepProgress step={progress.step} total={progress.total} />
      ) : null}
      <View style={styles.form}>
        <AuthField
          label="Years of experience"
          placeholder="Years"
          value={yearsOfExperience}
          onChangeText={setYearsOfExperience}
          keyboardType="number-pad"
          icon="stats-chart-outline"
        />

        <View style={styles.section}>
          <FormSectionHeader icon="school-outline" label="Education" />
          <ChipSelector
            options={[...EDUCATION_DEGREE_TYPE_OPTIONS]}
            selected={degreeType}
            onChange={(value) => handleDegreeTypeChange(value as EducationDegreeType)}
          />
          {showEducationDetails ? (
            <View style={styles.educationDetails}>
              <AuthField
                label="Graduation year"
                placeholder="Year"
                value={graduationYear}
                onChangeText={setGraduationYear}
                keyboardType="number-pad"
                icon="calendar-outline"
              />
              <AuthField
                label="Field of study"
                placeholder="Field of study"
                value={fieldOfStudy}
                onChangeText={setFieldOfStudy}
                autoCapitalize="words"
                icon="book-outline"
              />
              <AuthField
                label="University or college"
                placeholder="Institution name"
                value={institution}
                onChangeText={setInstitution}
                autoCapitalize="words"
                icon="school-outline"
              />
            </View>
          ) : null}
        </View>
      </View>
    </FormScreen>
  );
}
