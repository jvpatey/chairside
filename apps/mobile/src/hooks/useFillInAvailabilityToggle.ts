import { type FillInNotificationMode } from '@chairside/config';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';

export function useFillInAvailabilityToggle() {
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [shortNoticeAvailable, setShortNoticeAvailable] = useState(false);
  const [notificationMode, setNotificationMode] = useState<FillInNotificationMode>('off');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workerProfile) return;
    setShortNoticeAvailable(workerProfile.short_notice_available ?? false);
    setNotificationMode(
      (workerProfile.fill_in_notification_mode as FillInNotificationMode) ?? 'off',
    );
    setSmsOptIn(workerProfile.fill_in_sms_opt_in ?? false);
  }, [workerProfile]);

  const persist = async (
    available: boolean,
    mode: FillInNotificationMode,
    sms: boolean = smsOptIn,
  ) => {
    setIsSaving(true);
    setError(null);
    try {
      await save({
        short_notice_available: available,
        fill_in_notification_mode: available ? mode : 'off',
        fill_in_sms_opt_in: available && sms && Boolean(workerProfile?.phone?.trim()),
        accepts_clinic_fill_in_outreach: available,
      });
      await refreshWorkerProfile();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Please try again.';
      setError(message);
      setShortNoticeAvailable(workerProfile?.short_notice_available ?? false);
      if (Platform.OS !== 'web') Alert.alert('Could not save', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    const mode =
      value && notificationMode === 'off' ? ('all' as FillInNotificationMode) : notificationMode;
    const hasPhone = Boolean(workerProfile?.phone?.trim());
    const smsWhenOn = value && (smsOptIn || hasPhone);
    setShortNoticeAvailable(value);
    if (value) {
      setNotificationMode(mode);
      if (hasPhone) setSmsOptIn(true);
    }
    if (!value) {
      setSmsOptIn(false);
    }
    await persist(value, value ? mode : 'off', smsWhenOn);
  };

  return {
    shortNoticeAvailable,
    isSaving,
    error,
    handleToggle,
  };
}
