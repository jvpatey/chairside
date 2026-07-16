import {
  SPECIALTY_OPTIONS,
  SOFTWARE_OPTIONS,
  TEAM_SIZE_RANGE_OPTIONS,
  resolveSoftwareSelection,
  type ClinicSpecialty,
  type TeamSizeRange,
} from '@chairside/config';
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
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
};

export function ClinicLocationFormFields({
  values,
  onChange,
  showValidation = false,
}: ClinicLocationFormFieldsProps) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    section: { gap: spacing.sm },
    label: {
      ...typography.body,
      fontWeight: '600' as const,
    },
    hint: typography.subtitle,
  }));

  return (
    <View style={styles.section}>
      <AuthField
        label="Phone (optional)"
        placeholder={PHONE_NUMBER_PLACEHOLDER}
        value={values.phone}
        onChangeText={(text) => onChange({ ...values, phone: formatPhoneNumber(text) })}
        keyboardType="phone-pad"
      />
      <View style={styles.section}>
        <Text style={styles.label}>Specialty</Text>
        <Text style={styles.hint}>Defaults to General dentistry if unchanged.</Text>
        <ChipSelector
          options={SPECIALTY_OPTIONS}
          selected={values.specialty}
          onChange={(value) => onChange({ ...values, specialty: value as ClinicSpecialty })}
        />
      </View>
      <AuthField
        label="Operatories (optional)"
        placeholder="4"
        value={values.operatories}
        onChangeText={(text) => onChange({ ...values, operatories: text })}
        keyboardType="number-pad"
      />
      <View style={styles.section}>
        <Text style={styles.label}>Team size (optional)</Text>
        <ChipSelector
          options={TEAM_SIZE_RANGE_OPTIONS}
          selected={values.teamSizeRange}
          onChange={(value) =>
            onChange({ ...values, teamSizeRange: value as TeamSizeRange })
          }
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Software used</Text>
        <ChipSelector
          options={SOFTWARE_OPTIONS.map((item) => ({ value: item, label: item }))}
          selected={values.softwareUsed}
          multiple
          onChange={(value) =>
            onChange({
              ...values,
              softwareUsed: resolveSoftwareSelection(values.softwareUsed, value as string[]),
            })
          }
        />
        {showValidation && values.softwareUsed.length === 0 ? (
          <Text style={styles.hint}>Select at least one software system.</Text>
        ) : null}
      </View>
    </View>
  );
}
