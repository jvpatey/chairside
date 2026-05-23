import {
  createShiftPost,
  getShiftPost,
  updateShiftPost,
  type RoleType,
  type ShiftPost,
} from '@chairside/api';
import { ROLE_TYPE_OPTIONS } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { navigateAfterFillInSave, type FillInReturnTarget } from '@/lib/routing';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { CompensationInput } from '@/components/clinic/CompensationInput';
import { ShiftDateInput } from '@/components/clinic/ShiftDateInput';
import { TimeRangeInput } from '@/components/clinic/TimeRangeInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { todayISO } from '@/lib/dates';
import { isValidTimeRange, normalizeTime24h, parseTime24h } from '@/lib/time';
import { useTheme, useThemedStyles } from '@/theme';

function applyShiftToForm(shift: ShiftPost) {
  return {
    roleType: shift.role_type,
    shiftDate: shift.shift_date,
    startTime: normalizeTime24h(shift.start_time),
    endTime: normalizeTime24h(shift.end_time),
    compensation: shift.compensation ?? '',
    description: shift.description ?? '',
  };
}

export default function PostShiftScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { id, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: FillInReturnTarget }>();
  const shiftId = typeof id === 'string' ? id : undefined;
  const isEditing = Boolean(shiftId);

  const [roleType, setRoleType] = useState<RoleType>('hygienist');
  const [shiftDate, setShiftDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [compensation, setCompensation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [formKey, setFormKey] = useState(0);

  const handleCompensationChange = useCallback((value: string) => {
    setCompensation(value);
  }, []);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    form: { gap: spacing.lg },
    section: { gap: spacing.sm },
    label: {
      ...typography.body,
      fontWeight: '600',
    },
    loading: typography.subtitle,
    notice: {
      backgroundColor: colors.primarySubtle,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    noticeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    noticeIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noticeTextBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    noticeTitle: {
      ...typography.body,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    noticeBody: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

  const loadShift = useCallback(async () => {
    if (!shiftId || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const shift = await getShiftPost(user.id, shiftId);
      if (!shift) {
        Alert.alert('Fill-in not found', 'This shift may have been removed.');
        router.back();
        return;
      }

      const form = applyShiftToForm(shift);
      setRoleType(form.roleType);
      setShiftDate(form.shiftDate);
      setStartTime(form.startTime);
      setEndTime(form.endTime);
      setCompensation(form.compensation);
      setDescription(form.description);
      setFormKey((current) => current + 1);
    } catch (error) {
      Alert.alert(
        'Could not load fill-in',
        error instanceof Error ? error.message : 'Please try again.',
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [shiftId, user?.id]);

  useEffect(() => {
    void loadShift();
  }, [loadShift]);

  const handleSubmit = async () => {
    if (!user?.id || !shiftDate.trim()) {
      Alert.alert('Missing information', 'Select a shift date to continue.');
      return;
    }

    if (!parseTime24h(startTime) || !parseTime24h(endTime)) {
      Alert.alert('Invalid times', 'Choose a valid start and end time.');
      return;
    }

    if (!isValidTimeRange(startTime, endTime)) {
      Alert.alert('Invalid times', 'End time must be after start time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        role_type: roleType,
        shift_date: shiftDate.trim(),
        start_time: startTime.trim(),
        end_time: endTime.trim(),
        compensation: compensation.trim() || undefined,
        description: description.trim() || undefined,
      };

      if (isEditing && shiftId) {
        await updateShiftPost(user.id, shiftId, payload);
        navigateAfterFillInSave(router, returnTo);
      } else {
        await createShiftPost(user.id, {
          ...payload,
          status: 'live',
        });
        navigateAfterFillInSave(router, returnTo);
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
        <Text style={styles.loading}>Loading fill-in…</Text>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell>
      <View style={styles.form}>
        <AuthScreenHeader
          title={isEditing ? 'Edit fill-in' : 'Post a fill-in'}
          subtitle={
            isEditing
              ? 'Update your fill-in shift details.'
              : 'Publish a short-notice or temp shift.'
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

        <ShiftDateInput key={`date-${formKey}`} value={shiftDate} onChange={setShiftDate} />

        <TimeRangeInput
          sectionLabel="Shift hours"
          schedule={{ startTime, endTime }}
          onChange={({ startTime: nextStart, endTime: nextEnd }) => {
            setStartTime(nextStart);
            setEndTime(nextEnd);
          }}
          showPreview
        />

        <CompensationInput
          key={`comp-${formKey}`}
          initialValue={compensation}
          onChange={handleCompensationChange}
        />

        <AuthField
          label="Description"
          placeholder="Shift details"
          value={description}
          onChangeText={setDescription}
          multiline
          autoCapitalize="sentences"
        />

        {!isEditing ? (
          <View style={styles.notice}>
            <View style={styles.noticeRow}>
              <View style={styles.noticeIconWrap}>
                <Ionicons name="notifications" size={18} color={colors.primaryOnPrimary} />
              </View>
              <View style={styles.noticeTextBlock}>
                <Text style={styles.noticeTitle}>Publishing notifies available workers</Text>
                <Text style={styles.noticeBody}>
                  This fill-in will be sent to workers marked as available for short-notice shifts
                  in your area.
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <OnboardingButton
          label={
            isSubmitting
              ? isEditing
                ? 'Saving…'
                : 'Publishing…'
              : isEditing
                ? 'Save changes'
                : 'Publish fill-in'
          }
          disabled={isSubmitting}
          onPress={handleSubmit}
        />
      </View>
    </OnboardingShell>
  );
}
