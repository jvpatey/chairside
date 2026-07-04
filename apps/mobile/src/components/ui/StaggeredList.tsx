import { Children, isValidElement, type ReactNode } from 'react';

import { FadeInSection } from '@/components/dashboard/FadeInSection';

type StaggeredListProps = {
  children: ReactNode;
  /** Base delay before the first child animates in. */
  baseDelayMs?: number;
  /** Incremental delay between each child. */
  stepDelayMs?: number;
};

/** Applies staggered spring entrances to list children without hand-numbering delays. */
export function StaggeredList({
  children,
  baseDelayMs = 0,
  stepDelayMs = 40,
}: StaggeredListProps) {
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <>
      {items.map((child, index) => (
        <FadeInSection key={child.key ?? index} delayMs={baseDelayMs + index * stepDelayMs}>
          {child}
        </FadeInSection>
      ))}
    </>
  );
}
