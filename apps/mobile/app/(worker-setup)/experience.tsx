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
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useThemedStyles } from '@/theme';

const CURRENT_YEAR = new Date().getFullYear();

export default function WorkerExperienceScreen() {
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [degreeType, setDegreeType] = useState<EducationDegreeType | null>(null);
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [institution, setInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    step: { marginBottom: spacing.sm },
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
    const years = yearsOfExperience.trim() ? Number(yearsOfExperience) : NaN;
    const gradYear = graduationYear.trim() ? Number(graduationYear) : NaN;

    if (!Number.isFinite(years) || years < 0) {
      Alert.alert('Missing information', 'Enter your years of experience.');
      return;
    }
    if (!Number.isFinite(gradYear) || gradYear < 1950 || gradYear > CURRENT_YEAR + 1) {
      Alert.alert('Missing information', 'Enter a valid graduation year.');
      return;
    }
    if (!degreeType) {
      Alert.alert('Missing information', 'Select your degree or credential type.');
      return;
    }
    if (!fieldOfStudy.trim()) {
      Alert.alert('Missing information', 'Enter your field of study.');
      return;
    }
    if (!institution.trim()) {
      Alert.alert('Missing information', 'Enter your university or college.');
      return;
    }

    setIsSubmitting(true);
    try {
      await save({
        years_of_experience: years,
        education_graduation_year: gradYear,
        education_degree_type: degreeType,
        education_field: fieldOfStudy.trim(),
        education_institution: institution.trim(),
        education: null,
      });
      router.push(WORKER_SETUP_SKILLS);
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
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : 'Continue'}
            disabled={isSubmitting}
            onPress={handleContinue}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Experience & education"
        subtitle="Clinics will receive this with every application."
        onBack={() => router.back()}
      />
      <Text style={styles.step}>Step 2 of 6</Text>
      <View style={styles.form}>
        <AuthField
          label="Years of experience"
          placeholder="5"
          value={yearsOfExperience}
          onChangeText={setYearsOfExperience}
          keyboardType="number-pad"
        />

        <View style={styles.section}>
          <Text style={styles.label}>Education</Text>
          <Text style={styles.hint}>Your highest relevant credential.</Text>
          <View style={styles.educationBlock}>
            <AuthField
              label="Graduation year"
              placeholder={String(CURRENT_YEAR)}
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
              placeholder="Dental Hygiene"
              value={fieldOfStudy}
              onChangeText={setFieldOfStudy}
              autoCapitalize="words"
            />
            <AuthField
              label="University or college"
              placeholder="Dalhousie University"
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
