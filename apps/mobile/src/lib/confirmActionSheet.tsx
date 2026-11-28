import { useEffect, useState } from 'react';

import { ActionMenuSheet, type ActionMenuSheetDetail } from '@/components/ui/ActionMenuSheet';

export type ConfirmActionSheetRequest = {
  title: string;
  message?: string;
  /** Optional checklist shown under the message. */
  details?: ActionMenuSheetDetail[];
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

let openConfirmActionSheet: ((request: ConfirmActionSheetRequest) => void) | null = null;

export function showConfirmActionSheet(request: ConfirmActionSheetRequest) {
  openConfirmActionSheet?.(request);
}

export function ConfirmActionSheetHost() {
  const [request, setRequest] = useState<ConfirmActionSheetRequest | null>(null);

  useEffect(() => {
    openConfirmActionSheet = setRequest;
    return () => {
      openConfirmActionSheet = null;
    };
  }, []);

  return (
    <ActionMenuSheet
      visible={request != null}
      title={request?.title}
      message={request?.message}
      details={request?.details}
      actions={
        request
          ? [
              {
                label: request.confirmLabel,
                destructive: request.destructive,
                onPress: () => {
                  void request.onConfirm();
                },
              },
            ]
          : []
      }
      onClose={() => setRequest(null)}
    />
  );
}
