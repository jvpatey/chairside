import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';

export function WorkerOpenInquiryPreferences() {
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [optIn, setOptIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!workerProfile) return;
    setOptIn(workerProfile.accepts_general_clinic_messages ?? false);
  }, [workerProfile]);

  const persist = async (value: boolean) => {
    setIsSaving(true);
    try {
      await save({ accepts_general_clinic_messages: value });
      await refreshWorkerProfile();
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
      setOptIn(!value);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsToggleRow
      title="Let clinics message you about opportunities"
      hint="Clinics in your province can start a conversation even if you have not applied. Applications and fill-ins are unchanged."
      value={optIn}
      disabled={isSaving}
      onValueChange={(value) => {
        setOptIn(value);
        void persist(value);
      }}
    />
  );
}
