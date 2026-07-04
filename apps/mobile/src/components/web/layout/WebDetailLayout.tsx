import { ReactNode } from 'react';

/** Native passthrough — detail rail layout is web-only. */
export function WebDetailLayout({ children }: { children: ReactNode; main?: ReactNode; rail?: ReactNode }) {
  return <>{children}</>;
}
