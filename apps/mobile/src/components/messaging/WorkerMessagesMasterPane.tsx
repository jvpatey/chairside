import { router } from 'expo-router';
import { useCallback } from 'react';

import { WorkerMessageClinicsPanel } from '@/components/messaging/WorkerMessageClinicsPanel';
import {
  WorkerMessagesInboxPanel,
  type WorkerMessagesInboxPanelProps,
} from '@/components/messaging/WorkerMessagesInboxPanel';
import { getWorkerMessageClinicsRoute, getWorkerMessagesRoute } from '@/lib/routing';

export type WorkerMessagesMasterView = 'inbox' | 'clinics';

type WorkerMessagesMasterPaneProps = {
  masterView: WorkerMessagesMasterView;
  inboxProps: Omit<WorkerMessagesInboxPanelProps, 'onMessageClinicPress'>;
  onConversationStarted: (conversationId: string) => void;
};

export function WorkerMessagesMasterPane({
  masterView,
  inboxProps,
  onConversationStarted,
}: WorkerMessagesMasterPaneProps) {
  const handleConversationStarted = useCallback(
    (conversationId: string) => {
      onConversationStarted(conversationId);
      router.replace(getWorkerMessagesRoute(conversationId));
    },
    [onConversationStarted],
  );

  if (masterView === 'clinics') {
    return (
      <WorkerMessageClinicsPanel
        embedded
        scroll={false}
        fillsContainer
        onBack={() => router.back()}
        onConversationStarted={handleConversationStarted}
      />
    );
  }

  return (
    <WorkerMessagesInboxPanel
      {...inboxProps}
      onMessageClinicPress={() => router.push(getWorkerMessageClinicsRoute())}
    />
  );
}
