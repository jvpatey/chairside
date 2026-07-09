import { isClinicBillingLimitError } from '@chairside/api';
import { useCallback, useState } from 'react';

import {
  ClinicUpgradePrompt,
  getClinicOutreachUpgradeMessage,
  getClinicPublishLimitMessage,
  getClinicSmsUpgradeMessage,
} from '@/components/billing/ClinicUpgradePrompt';
import { useClinicBilling } from '@/contexts/ClinicBillingContext';

type UpgradeReason = 'publish_role' | 'publish_fill_in' | 'outreach' | 'sms' | null;

export function useClinicUpgradePrompt() {
  const { billing, isBillingReady, refreshBilling } = useClinicBilling();
  const [reason, setReason] = useState<UpgradeReason>(null);

  const closeUpgradePrompt = useCallback(() => setReason(null), []);

  const showPublishUpgrade = useCallback((publishType: 'role' | 'fill-in' = 'role') => {
    setReason(publishType === 'fill-in' ? 'publish_fill_in' : 'publish_role');
  }, []);
  const showOutreachUpgrade = useCallback(() => setReason('outreach'), []);
  const showSmsUpgrade = useCallback(() => setReason('sms'), []);

  const handleBillingError = useCallback(
    (error: unknown): boolean => {
      const message = error instanceof Error ? error.message : String(error);
      if (!isClinicBillingLimitError(message)) return false;

      const normalized = message.toLowerCase();
      if (normalized.includes('sms fill-in alerts')) {
        setReason('sms');
      } else if (normalized.includes('fill-in outreach')) {
        setReason('outreach');
      } else if (normalized.includes('fill-in limit')) {
        setReason('publish_fill_in');
      } else {
        setReason('publish_role');
      }
      return true;
    },
    [],
  );

  const promptTitle =
    reason === 'outreach'
      ? 'Upgrade for outreach'
      : reason === 'sms'
        ? 'Upgrade for SMS alerts'
        : 'Upgrade to publish more';

  const promptMessage =
    reason === 'outreach'
      ? getClinicOutreachUpgradeMessage()
      : reason === 'sms'
        ? getClinicSmsUpgradeMessage()
        : getClinicPublishLimitMessage(
            billing?.plan ?? 'free',
            reason === 'publish_fill_in' ? 'fill-in' : 'role',
          );

  const upgradePrompt = (
    <ClinicUpgradePrompt
      visible={reason != null}
      title={promptTitle}
      message={promptMessage}
      onClose={closeUpgradePrompt}
    />
  );

  return {
    billing,
    isBillingReady,
    refreshBilling,
    upgradePrompt,
    closeUpgradePrompt,
    showPublishUpgrade,
    showOutreachUpgrade,
    showSmsUpgrade,
    handleBillingError,
  };
}
