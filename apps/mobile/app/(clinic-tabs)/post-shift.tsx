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
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { CompensationInput } from '@/components/clinic/CompensationInput';
import { ShiftDateInput } from '@/components/clinic/ShiftDateInput';
import { TimeRangeInput } from '@/components/clinic/TimeRangeInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { PlanUpgradeCallout } from '@/components/billing/PlanUpgradeCallout';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicActingContext } from '@/hooks/useClinicActingContext';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { useFormSectionScroll } from '@/hooks/useFormSectionScroll';
import { usePostingFormScreenProps } from '@/hooks/usePostingFormScreenProps';
import { todayISO } from '@/lib/dates';
import {
  getClinicPostingLimitReachedMessage,
  getClinicPostingLimitTitle,
  isFillInPostingLimitReached,
} from '@/lib/clinicPlanPresentation';
import { showFormError } from '@/lib/formErrors';
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
  const {
    clinicId,
    accessibleLocations,
    isGroup,
    attribution,
    attributionLabel,
  } = useClinicActingContext();
  const { billing, upgradePrompt, showPublishUpgrade, handleBillingError } = useClinicUpgradePrompt();
  const { colors } = useTheme();
  const brandColor = colors.secondary;
  const brandSubtle = colors.secondarySubtle;
  const { id, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: FillInReturnTarget }>();
  const shiftId = typeof id === 'string' ? id : undefined;
  const isEditing = Boolean(shiftId);
  const resolvedReturnTo = (typeof returnTo === 'string' ? returnTo : 'fill-ins-tab') as FillInReturnTarget;
  const { setSectionRef, scrollToFirstSection } = useFormSectionScroll();
  const postingFormProps = usePostingFormScreenProps();

  const handleBack = useCallback(() => {
    navigateAfterFillInSave(router, resolvedReturnTo);
  }, [resolvedReturnTo]);

  const [roleType, setRoleType] = useState<RoleType>('hygienist');
  const [shiftDate, setShiftDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [compensation, setCompensation] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState<string | null>(
    accessibleLocations.find((location) => location.is_primary)?.id ??
      accessibleLocations[0]?.id ??
      null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [formKey, setFormKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const countsTowardLimit = shiftDate.trim() >= todayISO();
  const fillInLimitReached =
    !isEditing && countsTowardLimit && isFillInPostingLimitReached(billing);

  const handleCompensationChange = useCallback((value: string) => {
    setCompensation(value);
    setFormError(null);
  }, []);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    form: { gap: spacing.lg },
    section: { gap: spacing.sm },
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
      const shift = await getShiftPost(clinicId ?? user.id, shiftId);
      if (!shift) {
        const message = 'This shift may have been removed.';
        setFormError(showFormError(message, { title: 'Fill-in not found' }));
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
      setLocationId(shift.location_id ?? null);
      setFormKey((current) => current + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(showFormError(message, { title: 'Could not load fill-in' }));
      handleBack();
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, handleBack, shiftId, user?.id]);

  useEffect(() => {
    void loadShift();
  }, [loadShift]);

  const handleSubmit = async () => {
    if (!user?.id || !clinicId || !shiftDate.trim()) {
      const message = 'Select a shift date to continue.';
      setFormError(showFormError(message));
      scrollToFirstSection(['date']);
      return;
    }

    if (isGroup && !locationId) {
      const message = 'Choose which location this fill-in is for.';
      setFormError(showFormError(message));
      scrollToFirstSection(['location']);
      return;
    }

    if (!parseTime24h(startTime) || !parseTime24h(endTime)) {
      const message = 'Choose a valid start and end time.';
      setFormError(showFormError(message, { title: 'Invalid times' }));
      scrollToFirstSection(['hours']);
      return;
    }

    if (!isValidTimeRange(startTime, endTime)) {
      const message = 'End time must be after start time.';
      setFormError(showFormError(message, { title: 'Invalid times' }));
      scrollToFirstSection(['hours']);
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
        ...(isGroup ? { location_id: locationId } : {}),
      };

      if (isEditing && shiftId) {
        await updateShiftPost(clinicId, shiftId, payload);
        navigateAfterFillInSave(router, resolvedReturnTo);
      } else {
        await createShiftPost(clinicId, {
          ...payload,
          status: 'live',
          organization_id: clinicId,
          location_id: locationId,
          ...attribution,
        });
        navigateAfterFillInSave(router, resolvedReturnTo);
      }
    } catch (error) {
      if (handleBillingError(error)) {
        return;
      }
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(
        showFormError(message, {
          title: isEditing ? 'Could not save changes' : 'Could not publish',
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButton = (
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
      disabled={isSubmitting || fillInLimitReached || pickerOpen}
      accent={FILL_IN_ACCENT}
      onPress={handleSubmit}
    />
  );

  if (isLoading) {
    return (
      <FormScreen
        {...postingFormProps}
        title={isEditing ? 'Edit fill-in' : 'Post a fill-in'}
        accent={FILL_IN_ACCENT}
        onBack={handleBack}
      >
        <PageLoadingDetail />
      </FormScreen>
    );
  }

  return (
    <>
      {upgradePrompt}
      <FormScreen
        {...postingFormProps}
        title={isEditing ? 'Edit fill-in' : 'Post a fill-in'}
        subtitle={
          isEditing
            ? 'Update your fill-in shift details.'
            : 'Publish a short-notice or temp shift.'
        }
        accent={FILL_IN_ACCENT}
        onBack={handleBack}
        footer={submitButton}
      >
        <FormErrorBanner message={formError} />

        <View style={styles.form}>
        {isGroup ? (
          <View ref={setSectionRef('location')} style={styles.section} collapsable={false}>
            <FormSectionHeader icon="location-outline" label="Location" required accent="secondary" />
            <ChipSelector
              options={accessibleLocations.map((location) => ({
                value: location.id,
                label: location.name,
              }))}
              selected={locationId}
              onChange={(value) => {
                setLocationId(value as string);
                setFormError(null);
              }}
              accent={FILL_IN_ACCENT}
            />
            {attributionLabel ? (
              <Text style={styles.loading}>Will show as posted by {attributionLabel}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <FormSectionHeader icon="person-outline" label="Role type" accent="secondary" />
          <ChipSelector
            options={ROLE_TYPE_OPTIONS}
            selected={roleType}
            onChange={(value) => setRoleType(value as RoleType)}
            accent={FILL_IN_ACCENT}
          />
        </View>

        <View ref={setSectionRef('date')} style={styles.section} collapsable={false}>
          <FormSectionHeader icon="calendar-outline" label="Shift date" required accent="secondary" />
          <ShiftDateInput
            key={`date-${formKey}`}
            value={shiftDate}
            onChange={(value) => {
              setShiftDate(value);
              setFormError(null);
            }}
            accent={FILL_IN_ACCENT}
            required
            embedded
            onPickerOpenChange={setPickerOpen}
          />
        </View>

        <View ref={setSectionRef('hours')} style={styles.section} collapsable={false}>
          <FormSectionHeader icon="time-outline" label="Shift hours" required accent="secondary" />
          <TimeRangeInput
            schedule={{ startTime, endTime }}
            onChange={({ startTime: nextStart, endTime: nextEnd }) => {
              setStartTime(nextStart);
              setEndTime(nextEnd);
              setFormError(null);
            }}
            showPreview
            required
            accent={FILL_IN_ACCENT}
            embedded
            onPickerOpenChange={setPickerOpen}
          />
        </View>

        <View style={styles.section}>
          <FormSectionHeader icon="cash-outline" label="Compensation (optional)" accent="secondary" />
          <CompensationInput
            key={`comp-${formKey}`}
            initialValue={compensation}
            onChange={handleCompensationChange}
            embedded
          />
        </View>

        <AuthField
          label="Description"
          placeholder="Shift details"
          value={description}
          onChangeText={setDescription}
          multiline
          autoCapitalize="sentences"
          accent={FILL_IN_ACCENT}
          icon="document-text-outline"
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

        {fillInLimitReached && billing ? (
          <PlanUpgradeCallout
            title={getClinicPostingLimitTitle('fill-in')}
            message={getClinicPostingLimitReachedMessage(billing, 'fill-in')}
            accent="secondary"
            compact
          />
        ) : null}
        </View>
      </FormScreen>
    </>
  );
}
