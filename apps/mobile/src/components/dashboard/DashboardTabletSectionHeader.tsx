import { Platform } from 'react-native';

import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { PageHeader } from '@/components/ui/PageHeader';

type DashboardTabletSectionHeaderProps = {
  title: string;
};

/** Top dashboard row on iPad — aligns section title with sidebar profile name. */
export function DashboardTabletSectionHeader({ title }: DashboardTabletSectionHeaderProps) {
  const showSignOut = Platform.OS === 'web';

  return (
    <PageHeader
      variant="tabletSection"
      title={title}
      showNotifications
      trailing={showSignOut ? <SignOutHeaderButton /> : undefined}
    />
  );
}
