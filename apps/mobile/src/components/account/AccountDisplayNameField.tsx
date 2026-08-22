import { joinDisplayName, resolveAuthNameParts, updateProfileName } from '@chairside/api';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useThemedStyles } from '@/theme';

type AccountDisplayNameFieldProps = {
  userId: string;
  savedFirstName?: string | null;
  savedLastName?: string | null;
  savedDisplayName?: string | null;
  audience?: 'worker' | 'clinic';
  onSaved: () => Promise<unknown>;
};

const DISPLAY_NAME_HINTS = {
  worker:
    'Shown on your profile and new applications to clinics. Applications you already sent keep the name from when you applied.',
  clinic:
    'Shown on your profile and on new postings and messages. Existing conversations keep the name from when they started.',
} as const;

export function AccountDisplayNameField({
  userId,
  savedFirstName,
  savedLastName,
  savedDisplayName,
  audience = 'worker',
  onSaved,
}: AccountDisplayNameFieldProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    section: { gap: spacing.md },
    row: { gap: spacing.md },
    hint: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  const savedParts = resolveAuthNameParts({
    firstName: savedFirstName,
    lastName: savedLastName,
    displayName: savedDisplayName,
  });

  useEffect(() => {
    setFirstName(savedParts.firstName);
    setLastName(savedParts.lastName);
  }, [savedParts.firstName, savedParts.lastName]);

  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const isDirty =
    trimmedFirst !== savedParts.firstName || trimmedLast !== savedParts.lastName;
  const isSaved =
    Boolean(joinDisplayName(savedParts.firstName, savedParts.lastName)) &&
    trimmedFirst === savedParts.firstName &&
    trimmedLast === savedParts.lastName &&
    Boolean(trimmedFirst) &&
    Boolean(trimmedLast);

  const handleSave = async () => {
    if (!trimmedFirst || !trimmedLast) {
      Alert.alert('Missing information', 'Enter your first and last name.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileName(userId, { firstName: trimmedFirst, lastName: trimmedLast });
      await onSaved();
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <AuthField
          label="First name"
          placeholder="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          editable={!isSaving}
          validated={isSaved}
        />
        <AuthField
          label="Last name"
          placeholder="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          editable={!isSaving}
          validated={isSaved}
        />
      </View>
      <Text style={styles.hint}>{DISPLAY_NAME_HINTS[audience]}</Text>
      {isDirty ? (
        <OnboardingButton
          label={isSaving ? 'Saving…' : 'Save name'}
          disabled={isSaving || !trimmedFirst || !trimmedLast}
          onPress={() => void handleSave()}
        />
      ) : null}
    </View>
  );
}
