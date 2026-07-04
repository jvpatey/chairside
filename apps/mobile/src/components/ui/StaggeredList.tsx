import { Children, Fragment, isValidElement, type ReactNode } from 'react';

type StaggeredListProps = {
  children: ReactNode;
  /** Base delay before the first child animates in. */
  baseDelayMs?: number;
  /** Incremental delay between each child. */
  stepDelayMs?: number;
};

/** List passthrough — keeps parent `gap` layout; entrance motion disabled to avoid Reanimated crashes. */
export function StaggeredList({ children }: StaggeredListProps) {
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <>
      {items.map((child, index) => (
        <Fragment key={child.key ?? index}>{child}</Fragment>
      ))}
    </>
  );
}
