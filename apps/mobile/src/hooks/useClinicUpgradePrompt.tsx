import { getErrorMessage, isClinicBillingLimitError } from '@chairside/api';
import { FILL_IN_PRICE_CAD } from '@chairside/config';
import { useCallback, useState } from 'react';

import {
  ClinicUpgradePrompt,
  getClinicUpgradePromptMessage,
  getClinicUpgradePromptTitle,
  type ClinicUpgradeReason,
} from '@/components/billing/ClinicUpgradePrompt';
import { useClinicBilling } from '@/contexts/ClinicBillingContext';

export function useClinicUpgradePrompt() {
  const {
    billing,
    isBillingReady,
    refreshBilling,
    isHealingSubscription,
    revenueCatPlan,
    fillInCreditPackage,
    purchaseFillInCredit,
  } = useClinicBilling();
  const [reason, setReason] = useState<ClinicUpgradeReason | null>(null);

  const closeUpgradePrompt = useCallback(() => setReason(null), []);

  const showPublishUpgrade = useCallback((publishType: 'role' | 'fill-in' = 'role') => {
    setReason(publishType === 'fill-in' ? 'publish_fill_in' : 'publish_role');
  }, []);
  const showOutreachUpgrade = useCallback(() => setReason('outreach'), []);
  const showSmsUpgrade = useCallback(() => setReason('sms'), []);
  const showScreeningUpgrade = useCallback(() => setReason('screening'), []);
  const showScreeningCapUpgrade = useCallback(() => setReason('screening_cap'), []);
  const showHiringInsightsUpgrade = useCallback(() => setReason('hiring_insights'), []);
  const showBulkOutreachUpgrade = useCallback(() => setReason('bulk_outreach'), []);
  const showCrmUpgrade = useCallback(() => setReason('crm'), []);
  const showPdfExportUpgrade = useCallback(() => setReason('pdf_export'), []);
  const showDiscoverUpgrade = useCallback(() => setReason('discover'), []);
  const showGeneralMessagingUpgrade = useCallback(() => setReason('general_messaging'), []);
  const showAddLocationUpgrade = useCallback(() => setReason('add_location'), []);

  const handleBillingError = useCallback((error: unknown): boolean => {
    const message = getErrorMessage(error, '');
    if (!message || !isClinicBillingLimitError(message)) return false;

    const normalized = message.toLowerCase();
    if (normalized.includes('sms fill-in alerts')) {
      setReason('sms');
    } else if (normalized.includes('fill-in outreach')) {
      setReason('outreach');
    } else if (normalized.includes('custom screening question limit')) {
      setReason('screening_cap');
    } else if (normalized.includes('screening')) {
      setReason('screening');
    } else if (normalized.includes('hiring insights')) {
      setReason('hiring_insights');
    } else if (normalized.includes('bulk fill-in outreach')) {
      setReason('bulk_outreach');
    } else if (normalized.includes('crm') || normalized.includes('follow-up')) {
      setReason('crm');
    } else if (normalized.includes('pdf')) {
      setReason('pdf_export');
    } else if (normalized.includes('discover')) {
      setReason('discover');
    } else if (
      normalized.includes('general candidate messaging') ||
      normalized.includes('open inquiries require')
    ) {
      setReason('general_messaging');
    } else if (normalized.includes('location limit')) {
      setReason('add_location');
    } else if (normalized.includes('fill-in limit') || normalized.includes('no fill-in credits left')) {
      setReason('publish_fill_in');
    } else {
      setReason('publish_role');
    }
    return true;
  }, []);

  const plan = billing?.plan ?? 'free';
  const planFamily = billing?.planFamily ?? 'clinic';

  const promptTitle = reason ? getClinicUpgradePromptTitle(reason) : 'Upgrade';
  const promptMessage = reason
    ? getClinicUpgradePromptMessage(reason, {
        plan,
        planFamily,
        maxLocations: billing?.maxLocations,
      })
    : '';

  // Fill-ins are pay-per-post: the primary action buys one credit instead of opening plans.
  const fillInPrimaryAction =
    reason === 'publish_fill_in' && fillInCreditPackage
      ? {
          label: `Buy a fill-in (CA$${FILL_IN_PRICE_CAD})`,
          onPress: () => {
            void purchaseFillInCredit()
              .then(() => setReason(null))
              .catch(() => {
                // Errors (and cancellations) are surfaced through billingError.
              });
          },
        }
      : undefined;

  const upgradePrompt = (
    <ClinicUpgradePrompt
      visible={reason != null}
      title={promptTitle}
      message={promptMessage}
      onClose={closeUpgradePrompt}
      primaryAction={fillInPrimaryAction}
    />
  );

  return {
    billing,
    isBillingReady,
    isHealingSubscription,
    revenueCatPlan,
    refreshBilling,
    upgradePrompt,
    closeUpgradePrompt,
    showPublishUpgrade,
    showOutreachUpgrade,
    showSmsUpgrade,
    showScreeningUpgrade,
    showScreeningCapUpgrade,
    showHiringInsightsUpgrade,
    showBulkOutreachUpgrade,
    showCrmUpgrade,
    showPdfExportUpgrade,
    showDiscoverUpgrade,
    showGeneralMessagingUpgrade,
    showAddLocationUpgrade,
    handleBillingError,
  };
}
