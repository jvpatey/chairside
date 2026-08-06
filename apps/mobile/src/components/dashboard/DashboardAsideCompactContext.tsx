import { createContext, useContext, type ReactNode } from 'react';

const DashboardAsideCompactContext = createContext(false);

/** When true, aside meta widgets (plan usage, insights) render in a narrow paired rail cell. */
export function DashboardAsideCompactProvider({
  compact,
  children,
}: {
  compact: boolean;
  children: ReactNode;
}) {
  return (
    <DashboardAsideCompactContext.Provider value={compact}>
      {children}
    </DashboardAsideCompactContext.Provider>
  );
}

export function useDashboardAsideCompact() {
  return useContext(DashboardAsideCompactContext);
}
