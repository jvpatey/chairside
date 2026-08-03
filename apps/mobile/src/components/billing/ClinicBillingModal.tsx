import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, type ScrollView as ScrollViewType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ClinicPlan } from '@chairside/config';

import {
  ClinicBillingScreenContent,
  type ClinicBillingScrollFocus,
} from '@/components/billing/ClinicBillingScreenContent';
import { getClinicPlanLabel, useClinicBilling } from '@/contexts/ClinicBillingContext';
import { useToast } from '@/contexts/ToastContext';
import { CLINIC_PROFILE_BILLING } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export type { ClinicBillingScrollFocus };

type OpenClinicBillingModalOptions = {
  /** Scroll to Group or Clinic plan sections when the sheet opens. */
  focus?: ClinicBillingScrollFocus;
  /** Called after the modal closes (after a refresh attempt). */
  onClose?: () => void;
};

let openClinicBillingModalImpl: ((options?: OpenClinicBillingModalOptions) => void) | null =
  null;

/** Opens plans UI as a modal so setup (and other flows) stay on-stack. */
export function openClinicBillingModal(options?: OpenClinicBillingModalOptions) {
  if (openClinicBillingModalImpl) {
    openClinicBillingModalImpl(options);
    return;
  }
  router.push(CLINIC_PROFILE_BILLING);
}

export function ClinicBillingModalHost() {
  const insets = useSafeAreaInsets();
  const { refreshBilling } = useClinicBilling();
  const { showToast } = useToast();
  const scrollRef = useRef<ScrollViewType>(null);
  const scrollContentRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [scrollFocus, setScrollFocus] = useState<ClinicBillingScrollFocus>('default');
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | null>(null);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      backgroundColor: colors.surface,
    },
    title: {
      ...typography.body,
      fontWeight: '700' as const,
      fontSize: 17,
      color: colors.labelPrimary,
    },
    close: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    closeLabel: {
      ...typography.body,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xl * 2,
      gap: spacing.lg,
    },
  }));

  useEffect(() => {
    openClinicBillingModalImpl = (options) => {
      setScrollFocus(options?.focus ?? 'default');
      setOnCloseCallback(() => options?.onClose ?? null);
      setVisible(true);
    };
    return () => {
      openClinicBillingModalImpl = null;
    };
  }, []);

  const finishClose = useCallback(() => {
    void refreshBilling().finally(() => {
      onCloseCallback?.();
      setOnCloseCallback(null);
    });
  }, [onCloseCallback, refreshBilling]);

  const handleClose = () => {
    setVisible(false);
    finishClose();
  };

  const handlePurchaseSuccess = useCallback(
    (plan: ClinicPlan) => {
      showToast(`You're on ${getClinicPlanLabel(plan)}`, 'success');
      setVisible(false);
      finishClose();
    },
    [finishClose, showToast],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Plans & billing</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close plans"
            style={styles.close}
            onPress={handleClose}>
            <Text style={styles.closeLabel}>Done</Text>
          </Pressable>
        </View>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
          <View ref={scrollContentRef} collapsable={false}>
            {visible ? (
              <ClinicBillingScreenContent
                parentScrollRef={scrollRef}
                scrollContentRef={scrollContentRef}
                scrollFocus={scrollFocus}
                onPurchaseSuccess={handlePurchaseSuccess}
              />
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
