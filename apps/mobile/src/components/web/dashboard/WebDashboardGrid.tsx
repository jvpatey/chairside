import { ReactNode } from 'react';

type WebDashboardGridProps = {
  children?: ReactNode;
  main?: ReactNode;
  aside?: ReactNode | null;
};

/** Native passthrough — grid layout is web-only. */
export function WebDashboardGrid({ children, main, aside }: WebDashboardGridProps) {
  if (main || aside) {
    return (
      <>
        {main}
        {aside}
      </>
    );
  }
  return <>{children}</>;
}
