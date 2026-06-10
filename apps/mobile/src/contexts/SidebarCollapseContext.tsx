import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getTabletSidebarWidth } from '@/components/navigation/sidebarDimensions';

type SidebarCollapseContextValue = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  sidebarWidth: number;
};

const SidebarCollapseContext = createContext<SidebarCollapseContextValue | null>(null);

export function SidebarCollapseProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((current) => !current);
  }, []);

  const value = useMemo(
    () => ({
      isCollapsed,
      toggleCollapsed,
      sidebarWidth: getTabletSidebarWidth(isCollapsed),
    }),
    [isCollapsed, toggleCollapsed],
  );

  return (
    <SidebarCollapseContext.Provider value={value}>{children}</SidebarCollapseContext.Provider>
  );
}

export function useSidebarCollapse(): SidebarCollapseContextValue {
  const context = useContext(SidebarCollapseContext);
  if (!context) {
    throw new Error('useSidebarCollapse must be used within SidebarCollapseProvider');
  }
  return context;
}
