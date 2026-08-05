import {
  getConversation,
  getErrorMessage,
  startClinicFillInOutreach,
  startClinicFillInOutreachBulk,
  type RoleType,
} from '@chairside/api';
import { getRoleTypeLabel, ROLE_TYPE_OPTIONS } from '@chairside/config';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { ShiftDateInput } from '@/components/clinic/ShiftDateInput';
import { TimeRangeInput } from '@/components/clinic/TimeRangeInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { getClinicSmsUpgradeMessage } from '@/components/billing/ClinicUpgradePrompt';
import { PlanUpgradeCallout } from '@/components/billing/PlanUpgradeCallout';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { todayISO } from '@/lib/dates';
import { getClinicConversationRoute, navigateAfterFillInSave, type FillInReturnTarget } from '@/lib/routing';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import { formatShiftPostDateLabel } from '@/lib/shiftPostDisplay';
import { isValidTimeRange, normalizeTime24h, formatTimeRangePreview } from '@/lib/time';
import { useThemedStyles } from '@/theme';

export default function OutreachComposeScreen() {
  const { user } = useAuth();
  const { billing, upgradePrompt, showSmsUpgrade, showBulkOutreachUpgrade, handleBillingError } =
    useClinicUpgradePrompt();
  const params = useLocalSearchParams<{
    workerId?: string;
    workerName?: string;
    workerIds?: string;
    workerNames?: string;
    roleType?: string;
    smsOptIn?: string;
    bulk?: string;
    returnTo?: FillInReturnTarget;
  }>();

  const isBulk = params.bulk === '1';
  const bulkWorkerIds =
    typeof params.workerIds === 'string'
      ? params.workerIds.split(',').map((id) => id.trim()).filter(Boolean)
      : [];
  const bulkWorkerNames =
    typeof params.workerNames === 'string'
      ? params.workerNames.split('|').map((name) => name.trim()).filter(Boolean)
      : [];
  const workerId = typeof params.workerId === 'string' ? params.workerId : '';
  const workerName = typeof params.workerName === 'string' ? params.workerName : 'Candidate';
  const defaultRoleType = (
    typeof params.roleType === 'string' ? params.roleType : 'hygienist'
  ) as RoleType;
  const workerSmsOptIn = params.smsOptIn === '1';

  const [message, setMessage] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const [showShiftDetails, setShowShiftDetails] = useState(false);
  const [roleType, setRoleType] = useState<RoleType>(defaultRoleType);
  const [shiftDate, setShiftDate] = useState(todayISO());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const canOfferSms = !isBulk && workerSmsOptIn && (billing?.canUseFillInSms ?? false);
  const resolvedReturnTo = params.returnTo ?? 'fill-ins-tab';
  const composeTitle = isBulk
    ? `Message ${bulkWorkerIds.length} workers`
    : `Message ${workerName}`;
  const composeSubtitle = isBulk
    ? 'Send the same fill-in outreach message to every selected worker.'
    : 'Ask if they can cover a fill-in. Add shift details only if you want.';

  const resetForm = useCallback(() => {
    setMessage('');
    setSendSms(false);
    setShowShiftDetails(false);
    setRoleType(defaultRoleType);
    setShiftDate(todayISO());
    setStartTime('');
    setEndTime('');
    setFormError(null);
    setIsSubmitting(false);
    setFormKey((current) => current + 1);
  }, [defaultRoleType]);

  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, [resetForm]),
  );

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    form: { gap: spacing.lg },
    summary: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    summaryTitle: { ...typography.body, fontWeight: '600' },
    summaryMeta: { ...typography.subtitle, fontSize: 14, lineHeight: 20 },
    helper: { ...typography.subtitle, fontSize: 13, lineHeight: 18, color: colors.labelTertiary },
    section: { gap: spacing.sm },
    label: { ...typography.body, fontWeight: '600' },
    shiftToggle: {
      paddingVertical: spacing.sm,
    },
    shiftToggleText: {
      ...typography.body,
      fontWeight: '600',
      color: colors.primary,
    },
    shiftPanel: { gap: spacing.lg },
  }));

  const shiftSummary = useMemo(() => {
    if (!showShiftDetails) return null;
    const normalizedStart = normalizeTime24h(startTime);
    const normalizedEnd = normalizeTime24h(endTime);
    if (!shiftDate || !isValidTimeRange(normalizedStart, normalizedEnd)) return null;
    return [
      getRoleTypeLabel(roleType),
      formatShiftPostDateLabel(shiftDate),
      formatTimeRangePreview(normalizedStart, normalizedEnd),
    ]
      .filter(Boolean)
      .join(' · ');
  }, [endTime, roleType, shiftDate, showShiftDetails, startTime]);

  const openConversation = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      const conversation = await getConversation(user.id, 'clinic', conversationId);
      if (!conversation) {
        router.replace(getClinicConversationRoute(conversationId));
        return;
      }

      const preview = getMessageThreadPreview(conversation, 'clinic');
      router.replace(
        getClinicConversationRoute(conversationId, {
          conversationId,
          title: preview.title,
          subtitle: preview.subtitle,
        }),
      );
    } catch {
      router.replace(getClinicConversationRoute(conversationId));
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!isBulk && !workerId) return;
    if (isBulk && bulkWorkerIds.length === 0) return;

    const trimmed = message.trim();
    if (!trimmed) {
      setFormError('Write a message before sending.');
      return;
    }

    if (isBulk && !billing?.canUseBulkOutreach) {
      showBulkOutreachUpgrade();
      return;
    }

    let outreachShiftDate: string | null = null;
    let outreachStartTime: string | null = null;
    let outreachEndTime: string | null = null;
    let outreachRoleType: RoleType | null = null;

    if (showShiftDetails) {
      const normalizedStart = normalizeTime24h(startTime);
      const normalizedEnd = normalizeTime24h(endTime);
      if (!shiftDate.trim() || !isValidTimeRange(normalizedStart, normalizedEnd)) {
        setFormError('Add a valid role, date, and time range or hide shift details.');
        return;
      }
      outreachShiftDate = shiftDate;
      outreachStartTime = normalizedStart;
      outreachEndTime = normalizedEnd;
      outreachRoleType = roleType;
    }

    if (sendSms && !billing?.canUseFillInSms) {
      showSmsUpgrade();
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      if (isBulk) {
        const result = await startClinicFillInOutreachBulk({
          workerIds: bulkWorkerIds,
          message: trimmed,
          roleType: outreachRoleType,
          shiftDate: outreachShiftDate,
          startTime: outreachStartTime,
          endTime: outreachEndTime,
        });

        const successCount = result.successes.length;
        const failureCount = result.failures.length;
        if (successCount === 0) {
          setFormError('Could not send outreach to any selected workers.');
          return;
        }

        Alert.alert(
          'Bulk outreach sent',
          failureCount > 0
            ? `Sent to ${successCount} worker${successCount === 1 ? '' : 's'}. ${failureCount} could not be reached.`
            : `Sent to ${successCount} worker${successCount === 1 ? '' : 's'}.`,
          [{ text: 'OK', onPress: () => navigateAfterFillInSave(router, resolvedReturnTo) }],
        );
        return;
      }

      const conversationId = await startClinicFillInOutreach({
        workerId,
        message: trimmed,
        roleType: outreachRoleType,
        shiftDate: outreachShiftDate,
        startTime: outreachStartTime,
        endTime: outreachEndTime,
        sendSms: canOfferSms && sendSms,
      });
      await openConversation(conversationId);
    } catch (error) {
      if (handleBillingError(error)) {
        return;
      }
      setFormError(getErrorMessage(error, 'Could not send outreach message.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {upgradePrompt}
      <OnboardingShell>
      <View style={styles.form}>
        <AuthScreenHeader
          title={composeTitle}
          subtitle={composeSubtitle}
          onBack={() => router.back()}
        />

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            {isBulk ? 'Bulk fill-in outreach' : 'Fill-in outreach'}
          </Text>
          <Text style={styles.summaryMeta}>
            {isBulk
              ? bulkWorkerNames.slice(0, 3).join(', ') +
                (bulkWorkerNames.length > 3
                  ? ` + ${bulkWorkerNames.length - 3} more`
                  : '')
              : shiftSummary ?? 'Send a direct message without posting a fill-in first.'}
          </Text>
        </View>

        <AuthField
          key={`message-${formKey}`}
          label="Message"
          value={message}
          onChangeText={setMessage}
          multiline
          autoCapitalize="sentences"
          placeholder="Hi! We need a hygienist this Tuesday from 9–4. Are you available?"
          editable={!isSubmitting}
        />

        <Pressable
          style={styles.shiftToggle}
          onPress={() => setShowShiftDetails((current) => !current)}
          disabled={isSubmitting}
        >
          <Text style={styles.shiftToggleText}>
            {showShiftDetails ? 'Hide shift details' : 'Add shift details'}
          </Text>
        </Pressable>

        {showShiftDetails ? (
          <View key={`shift-${formKey}`} style={styles.shiftPanel}>
            <View style={styles.section}>
              <Text style={styles.label}>Role</Text>
              <ChipSelector
                options={ROLE_TYPE_OPTIONS}
                selected={roleType}
                onChange={(value) => setRoleType(value as RoleType)}
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Shift date</Text>
              <ShiftDateInput value={shiftDate} onChange={setShiftDate} />
            </View>
            <TimeRangeInput
              sectionLabel="Shift hours"
              schedule={{ startTime, endTime }}
              onChange={({ startTime: nextStart, endTime: nextEnd }) => {
                setStartTime(nextStart);
                setEndTime(nextEnd);
              }}
              showPreview
            />
          </View>
        ) : null}

        {workerSmsOptIn && billing && !billing.canUseFillInSms ? (
          <PlanUpgradeCallout
            compact
            title="SMS alerts need Starter or Pro"
            message={getClinicSmsUpgradeMessage()}
            accent="secondary"
          />
        ) : null}

        {canOfferSms ? (
          <SettingsToggleRow
            title="Send text alert too"
            hint="Urgent request. Sends an app-managed SMS that brings them back here. Their number stays private."
            value={sendSms}
            disabled={isSubmitting}
            onValueChange={setSendSms}
          />
        ) : null}

        {formError ? <FormErrorBanner message={formError} /> : null}

        <OnboardingButton
          label={
            isSubmitting
              ? 'Sending…'
              : isBulk
                ? `Send to ${bulkWorkerIds.length} workers`
                : 'Send message'
          }
          disabled={isSubmitting}
          onPress={() => void handleSubmit()}
        />
      </View>
    </OnboardingShell>
    </>
  );
}
