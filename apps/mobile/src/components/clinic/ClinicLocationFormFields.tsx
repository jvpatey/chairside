import {
  SPECIALTY_OPTIONS,
  type ClinicSpecialty,
  type TeamSizeRange,
} from '@chairside/config';
import { View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { SoftwareUsedSelector } from '@/components/clinic/SoftwareUsedSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { useThemedStyles } from '@/theme';

export type ClinicLocationPracticeFields = {
  phone: string;
  specialty: ClinicSpecialty;
  softwareUsed: string[];
  operatories: string;
  teamSizeRange: TeamSizeRange | null;
};

export const EMPTY_LOCATION_PRACTICE_FIELDS: ClinicLocationPracticeFields = {
  phone: '',
  specialty: 'general',
  softwareUsed: [],
  operatories: '',
  teamSizeRange: null,
};

type ClinicLocationFormFieldsProps = {
  values: ClinicLocationPracticeFields;
  onChange: (next: ClinicLocationPracticeFields) => void;
  showValidation?: boolean;
  softwareRequired?: boolean;
};

export function ClinicLocationFormFields({
  values,
  onChange,
  showValidation = false,
  softwareRequired = false,
}: ClinicLocationFormFieldsProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    section: { gap: spacing.sm },
  }));

  return (
    <View style={styles.section}>
      <AuthField
        label="Phone"
        placeholder={PHONE_NUMBER_PLACEHOLDER}
        value={values.phone}
        onChangeText={(text) => onChange({ ...values, phone: formatPhoneNumber(text) })}
        keyboardType="phone-pad"
        icon="call-outline"
      />
      <View style={styles.section}>
        <FormSectionHeader
          icon="medkit-outline"
          label="Specialty"
          hint="Defaults to General dentistry if unchanged."
        />
        <ChipSelector
          options={SPECIALTY_OPTIONS}
          selected={values.specialty}
          onChange={(value) => onChange({ ...values, specialty: value as ClinicSpecialty })}
        />
      </View>
      <SoftwareUsedSelector
        value={values.softwareUsed}
        onChange={(softwareUsed) => onChange({ ...values, softwareUsed })}
        required={softwareRequired}
        showValidation={showValidation}
      />
    </View>
  );
}
