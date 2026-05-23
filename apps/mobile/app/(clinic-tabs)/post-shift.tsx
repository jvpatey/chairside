import { createShiftPost, type RoleType, type ShiftUrgency } from '@chairside/api';
import { ROLE_TYPE_OPTIONS, URGENCY_OPTIONS } from '@chairside/config';
import { router } from 'expo-router';
import { CLINIC_POSTINGS } from '@/lib/routing';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/theme';

export default function PostShiftScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [roleType, setRoleType] = useState<RoleType>('hygienist');
  const [shiftDate, setShiftDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [compensation, setCompensation] = useState('');
  const [urgency, setUrgency] = useState<ShiftUrgency>('normal');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: insets.bottom + spacing.lg,
      gap: spacing.lg,
    },
    section: { gap: spacing.sm },
    label: {
      ...typography.body,
      fontWeight: '600',
    },
  }));

  const handlePublish = async () => {
    if (!user?.id || !shiftDate.trim()) {
      Alert.alert('Missing information', 'Enter a shift date to publish.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createShiftPost(user.id, {
        role_type: roleType,
        shift_date: shiftDate.trim(),
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        compensation: compensation.trim() || undefined,
        urgency,
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <AuthScreenHeader
        title="Post a fill-in"
        subtitle="Publish a short-notice or temp shift."
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

      <AuthField
        label="Shift date"
        placeholder="2026-05-22"
        value={shiftDate}
        onChangeText={setShiftDate}
        autoCapitalize="none"
      />
      <AuthField label="Start time" placeholder="08:00" value={startTime} onChangeText={setStartTime} />
      <AuthField label="End time" placeholder="17:00" value={endTime} onChangeText={setEndTime} />
      <AuthField
        label="Compensation"
        placeholder="$45/hr"
        value={compensation}
        onChangeText={setCompensation}
      />

      <View style={styles.section}>
        <Text style={styles.label}>Urgency</Text>
        <ChipSelector
          options={URGENCY_OPTIONS}
          selected={urgency}
          onChange={(value) => setUrgency(value as ShiftUrgency)}
        />
      </View>

      <AuthField
        label="Description"
        placeholder="Shift details"
        value={description}
        onChangeText={setDescription}
        multiline
        autoCapitalize="sentences"
      />

      <OnboardingButton
        label={isSubmitting ? 'Publishing…' : 'Publish fill-in'}
        disabled={isSubmitting}
        onPress={handlePublish}
      />
    </ScrollView>
  );
}
