import { updateProfileDisplayName } from '@chairside/api';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useThemedStyles } from '@/theme';

type AccountDisplayNameFieldProps = {
  userId: string;
  savedDisplayName?: string | null;
  onSaved: () => Promise<void>;
};

export function AccountDisplayNameField({
  userId,
  savedDisplayName,
  onSaved,
}: AccountDisplayNameFieldProps) {
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    section: { gap: spacing.md },
    hint: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  useEffect(() => {
    setDisplayName(savedDisplayName?.trim() ?? '');
  }, [savedDisplayName]);

  const trimmed = displayName.trim();
  const savedTrimmed = savedDisplayName?.trim() ?? '';
  const isDirty = trimmed !== savedTrimmed;
  const isSaved = Boolean(savedTrimmed) && trimmed === savedTrimmed;

  const handleSave = async () => {
    if (!trimmed) {
      Alert.alert('Missing information', 'Enter your full name to continue.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileDisplayName(userId, trimmed);
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
      <AuthField
        label="Full name"
        placeholder="Your full name"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        editable={!isSaving}
        validated={isSaved}
      />
      <Text style={styles.hint}>
        Shown on your profile and new applications to clinics. Applications you already sent keep
        the name from when you applied.
      </Text>
      {isDirty ? (
        <OnboardingButton
          label={isSaving ? 'Saving…' : 'Save name'}
          disabled={isSaving || !trimmed}
          onPress={() => void handleSave()}
        />
      ) : null}
    </View>
  );
}
