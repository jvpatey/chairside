import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { View } from 'react-native';

import { ConfettiBurst } from '@/components/celebration/ConfettiBurst';
import { DashboardWelcomeCelebrationContent } from '@/components/celebration/DashboardWelcomeCelebrationContent';
import { WebDialogShell } from '@/components/ui/WebDialogShell.web';
import type { DashboardWelcomeRole } from '@/lib/dashboardWelcomeCopy';

type DashboardWelcomeCelebrationProps = {
  visible: boolean;
  role: DashboardWelcomeRole;
  isGroup?: boolean;
  onDismiss: () => void;
};

export function DashboardWelcomeCelebration({
  visible,
  role,
  isGroup,
  onDismiss,
}: DashboardWelcomeCelebrationProps) {
  useEffect(() => {
    if (visible) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible]);

  return (
    <WebDialogShell
      visible={visible}
      onClose={onDismiss}
      maxWidth={460}
      backdropLabel="Dismiss welcome celebration"
    >
      <View style={{ position: 'relative' }}>
        <ConfettiBurst active={visible} />
        <DashboardWelcomeCelebrationContent
          role={role}
          isGroup={isGroup}
          onDismiss={onDismiss}
        />
      </View>
    </WebDialogShell>
  );
}
