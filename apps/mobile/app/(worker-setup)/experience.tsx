import {
  EDUCATION_DEGREE_TYPE_OPTIONS,
  type EducationDegreeType,
} from '@chairside/config';
import { router } from 'expo-router';
import { WORKER_SETUP_SKILLS } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useThemedStyles } from '@/theme';

const CURRENT_YEAR = new Date().getFullYear();

export default function WorkerExperienceScreen() {
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'worker' });
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [degreeType, setDegreeType] = useState<EducationDegreeType | null>(null);
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institution, setInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    section: { gap: spacing.sm },
    label: { ...typography.body, fontWeight: '600' },
    hint: typography.subtitle,
    educationBlock: { gap: spacing.md },
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
      Alert.alert('Invalid information', 'Enter a valid number of years of experience.');
      return;
    }
    if (
      gradYear != null &&
      (!Number.isFinite(gradYear) || gradYear < 1950 || gradYear > CURRENT_YEAR + 1)
    ) {
      Alert.alert('Invalid information', 'Enter a valid graduation year.');
      return;
    }

    setIsSubmitting(true);
    try {
      await save({
        years_of_experience: years,
        education_graduation_year: gradYear,
        education_degree_type: degreeType,
        education_field: fieldOfStudy.trim() || null,
        education_institution: institution.trim() || null,
        education: null,
      });
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(WORKER_SETUP_SKILLS);
      }
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWorkerProfileReady) return null;

  return (
    <OnboardingShell atmosphere="form"
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Continue'}
            disabled={isSubmitting}
            onPress={handleContinue}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Professional background · Experience & education"
        subtitle="Clinics will receive this with every application."
        onBack={() => (isEditMode ? router.replace(exitHref) : router.back())}
      />
      {!isEditMode ? <SetupStepProgress step={2} total={5} /> : null}
      <View style={styles.form}>
        <AuthField
          label="Years of experience (optional)"
          placeholder="Years"
          value={yearsOfExperience}
          onChangeText={setYearsOfExperience}
          keyboardType="number-pad"
        />

        <View style={styles.section}>
          <Text style={styles.label}>Education (optional)</Text>
          <Text style={styles.hint}>Your highest relevant credential, if applicable.</Text>
          <View style={styles.educationBlock}>
            <AuthField
              label="Graduation year"
              placeholder="Year"
              value={graduationYear}
              onChangeText={setGraduationYear}
              keyboardType="number-pad"
            />
            <View style={styles.section}>
              <Text style={styles.label}>Degree or credential</Text>
              <ChipSelector
                options={[...EDUCATION_DEGREE_TYPE_OPTIONS]}
                selected={degreeType}
                onChange={(value) => setDegreeType(value as EducationDegreeType)}
              />
            </View>
            <AuthField
              label="Field of study"
              placeholder="Field of study"
              value={fieldOfStudy}
              onChangeText={setFieldOfStudy}
              autoCapitalize="words"
            />
            <AuthField
              label="University or college"
              placeholder="Institution name"
              value={institution}
              onChangeText={setInstitution}
              autoCapitalize="words"
            />
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
}
