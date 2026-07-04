import { ReactNode, useState } from 'react';

import { FilterSheet } from '@/components/ui/FilterSheet';
import { FilterTriggerButton } from '@/components/ui/FilterTriggerButton';
import type { GradientAccent } from '@/theme';

type AdaptiveFilterShellProps = {
  activeCount: number;
  onReset: () => void;
  title: string;
  accessibilityLabel?: string;
  accent?: GradientAccent;
  children: ReactNode;
};

/** Filter trigger + bottom sheet — native and mobile web. */
export function AdaptiveFilterShell({
  activeCount,
  onReset,
  title,
  accessibilityLabel,
  accent,
  children,
}: AdaptiveFilterShellProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <FilterTriggerButton
        activeCount={activeCount}
        onPress={() => setSheetOpen(true)}
        accessibilityLabel={accessibilityLabel}
        accent={accent}
      />
      <FilterSheet
        visible={sheetOpen}
        title={title}
        onClose={() => setSheetOpen(false)}
        onReset={onReset}
        accent={accent}
      >
        {children}
      </FilterSheet>
    </>
  );
}
