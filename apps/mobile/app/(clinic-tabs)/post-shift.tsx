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
import { Alert, Platform, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { CompensationInput } from '@/components/clinic/CompensationInput';
import { ShiftDateInput } from '@/components/clinic/ShiftDateInput';
import { TimeRangeInput } from '@/components/clinic/TimeRangeInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { todayISO } from '@/lib/dates';
import { isValidTimeRange, normalizeTime24h, parseTime24h } from '@/lib/time';
import { useTheme, useThemedStyles } from '@/theme';

const FILL_IN_ACCENT = 'secondary' as const;

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
  const { billing, upgradePrompt, showPublishUpgrade, handleBillingError } = useClinicUpgradePrompt();
  const { colors } = useTheme();
  const brandColor = colors.secondary;
  const brandSubtle = colors.secondarySubtle;
  const { id, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: FillInReturnTarget }>();
  const shiftId = typeof id === 'string' ? id : undefined;
  const isEditing = Boolean(shiftId);
  const resolvedReturnTo = (typeof returnTo === 'string' ? returnTo : 'fill-ins-tab') as FillInReturnTarget;

  const handleBack = useCallback(() => {
    navigateAfterFillInSave(router, resolvedReturnTo);
  }, [resolvedReturnTo]);

  const [roleType, setRoleType] = useState<RoleType>('hygienist');
  const [shiftDate, setShiftDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [compensation, setCompensation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [formKey, setFormKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

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
      backgroundColor: brandSubtle,
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
      backgroundColor: brandColor,
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
        const message = 'This shift may have been removed.';
        setFormError(message);
        if (Platform.OS !== 'web') {
          Alert.alert('Fill-in not found', message);
        }
        handleBack();
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
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not load fill-in', message);
      }
      handleBack();
    } finally {
      setIsLoading(false);
    }
  }, [handleBack, shiftId, user?.id]);

  useEffect(() => {
    void loadShift();
  }, [loadShift]);

  const handleSubmit = async () => {
    if (!user?.id || !shiftDate.trim()) {
      const message = 'Select a shift date to continue.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Missing information', message);
      }
      return;
    }

    if (!parseTime24h(startTime) || !parseTime24h(endTime)) {
      const message = 'Choose a valid start and end time.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Invalid times', message);
      }
      return;
    }

    if (!isValidTimeRange(startTime, endTime)) {
      const message = 'End time must be after start time.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Invalid times', message);
      }
      return;
    }

    const countsTowardLimit = shiftDate.trim() >= todayISO();
    if (!isEditing && countsTowardLimit && billing && !billing.canPublishFillIn) {
      showPublishUpgrade('fill-in');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
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
      if (handleBillingError(error)) {
        return;
      }
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert(isEditing ? 'Could not save changes' : 'Could not publish', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <OnboardingShell atmosphere="accent" atmosphereAccent="secondary">
        <AuthScreenHeader
          title={isEditing ? 'Edit fill-in' : 'Post a fill-in'}
          accent={FILL_IN_ACCENT}
          onBack={handleBack}
        />
        <PageLoadingDetail />
      </OnboardingShell>
    );
  }

  return (
    <>
      {upgradePrompt}
      <OnboardingShell atmosphere="accent" atmosphereAccent="secondary">
      <View style={styles.form}>
        <AuthScreenHeader
          title={isEditing ? 'Edit fill-in' : 'Post a fill-in'}
          subtitle={
            isEditing
              ? 'Update your fill-in shift details.'
              : 'Publish a short-notice or temp shift.'
          }
          accent={FILL_IN_ACCENT}
          onBack={handleBack}
        />

        <FormErrorBanner message={formError} />

        <View style={styles.section}>
          <Text style={styles.label}>Role type</Text>
          <ChipSelector
            options={ROLE_TYPE_OPTIONS}
            selected={roleType}
            onChange={(value) => setRoleType(value as RoleType)}
            accent={FILL_IN_ACCENT}
          />
        </View>

        <ShiftDateInput
          key={`date-${formKey}`}
          value={shiftDate}
          onChange={setShiftDate}
          accent={FILL_IN_ACCENT}
        />

        <TimeRangeInput
          sectionLabel="Shift hours"
          schedule={{ startTime, endTime }}
          onChange={({ startTime: nextStart, endTime: nextEnd }) => {
            setStartTime(nextStart);
            setEndTime(nextEnd);
          }}
          showPreview
          accent={FILL_IN_ACCENT}
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
                <Ionicons name="notifications" size={18} color={colors.secondaryOnSecondary} />
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
          accent={FILL_IN_ACCENT}
          onPress={handleSubmit}
        />
      </View>
    </OnboardingShell>
    </>
  );
}
