import {
  type FillInNotificationMode,
} from '@chairside/config';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';

export function useFillInAvailabilityToggle() {
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [shortNoticeAvailable, setShortNoticeAvailable] = useState(false);
  const [notificationMode, setNotificationMode] = useState<FillInNotificationMode>('off');
  const [acceptsClinicOutreach, setAcceptsClinicOutreach] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!workerProfile) return;
    setShortNoticeAvailable(workerProfile.short_notice_available ?? false);
    setAcceptsClinicOutreach(workerProfile.accepts_clinic_fill_in_outreach ?? false);
    setNotificationMode(
      (workerProfile.fill_in_notification_mode as FillInNotificationMode) ?? 'off',
    );
    setSmsOptIn(workerProfile.fill_in_sms_opt_in ?? false);
  }, [workerProfile]);

  const persist = async (
    available: boolean,
    mode: FillInNotificationMode,
    sms: boolean = smsOptIn,
    outreach: boolean = acceptsClinicOutreach,
  ) => {
    setIsSaving(true);
    try {
      await save({
        short_notice_available: available,
        fill_in_notification_mode: available ? mode : 'off',
        fill_in_sms_opt_in: available && sms && Boolean(workerProfile?.phone?.trim()),
        accepts_clinic_fill_in_outreach: available && outreach,
      });
      await refreshWorkerProfile();
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    const mode =
      value && notificationMode === 'off' ? ('all' as FillInNotificationMode) : notificationMode;
    setShortNoticeAvailable(value);
    if (value) setNotificationMode(mode);
    if (!value) {
      setSmsOptIn(false);
      setAcceptsClinicOutreach(false);
    }
    await persist(
      value,
      value ? mode : 'off',
      value ? smsOptIn : false,
      value ? acceptsClinicOutreach : false,
    );
  };

  return {
    shortNoticeAvailable,
    isSaving,
    handleToggle,
  };
}
