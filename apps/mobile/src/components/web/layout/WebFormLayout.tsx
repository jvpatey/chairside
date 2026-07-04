import { ReactNode } from 'react';

/** Native passthrough — form layout is web-only. */
export function WebFormLayout({ children }: { children: ReactNode; footer?: ReactNode }) {
  return <>{children}</>;
}
