import type { ReactNode } from 'react';

import { WebDialogShell } from '@/components/ui/WebDialogShell.web';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

type AdaptiveWebSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  bottomSheet: ReactNode;
  maxWidth?: number;
  showCloseButton?: boolean;
  backdropLabel?: string;
};

/** Web: bottom sheet below tablet width, centered dialog at tablet+. */
export function AdaptiveWebSheet({
  visible,
  onClose,
  children,
  bottomSheet,
  maxWidth = 480,
  showCloseButton = true,
  backdropLabel = 'Close dialog',
}: AdaptiveWebSheetProps) {
  const { isTablet } = useResponsiveLayout();

  if (!isTablet) {
    return bottomSheet;
  }

  return (
    <WebDialogShell
      visible={visible}
      onClose={onClose}
      maxWidth={maxWidth}
      showCloseButton={showCloseButton}
      backdropLabel={backdropLabel}
    >
      {children}
    </WebDialogShell>
  );
}
