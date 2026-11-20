import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { renderWorkerTabBar } from '@/components/navigation/AdaptiveTabBar';
import { WorkerSetupGate } from '@/components/onboarding/SetupGate';
import { getDashboardTabOptions } from '@/components/navigation/dashboardTabOptions';
import { useAdaptiveTabScreenOptions } from '@/components/navigation/useAdaptiveTabScreenOptions';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarCollapseProvider } from '@/contexts/SidebarCollapseContext';
import { TabAtmosphereShell } from '@/contexts/TabAtmosphereContext';
import { MessageUnreadProvider } from '@/contexts/MessageUnreadContext';
import { ApplicationTabBadgeProvider, useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { fillInTabIcon } from '@/lib/fillInIcons';

export const unstable_settings = {
  anchor: 'index',
};

function WorkerTabNavigator() {
  const { fillInPendingCount } = useApplicationTabBadge();
  const { isTablet } = useResponsiveLayout();
  const screenOptions = useAdaptiveTabScreenOptions();

  return (
    <Tabs tabBar={renderWorkerTabBar} screenOptions={screenOptions} backBehavior="initialRoute">
      <Tabs.Screen name="index" options={getDashboardTabOptions(isTablet)} />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Roles',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="applications" options={{ href: null }} />
      <Tabs.Screen
        name="fillins"
        options={{
          title: 'Fill-ins',
          tabBarBadge: fillInPendingCount > 0 ? fillInPendingCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={fillInTabIcon(focused)} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="message-clinics" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="admin" options={{ href: null }} />
      <Tabs.Screen name="application" options={{ href: null }} />
      <Tabs.Screen name="conversation/[id]" options={{ href: null }} />
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
      <Tabs.Screen name="shift/[id]" options={{ href: null }} />
      <Tabs.Screen name="clinic/[clinicId]" options={{ href: null }} />
      <Tabs.Screen name="apply" options={{ href: null }} />
      <Tabs.Screen name="apply-screening" options={{ href: null }} />
      <Tabs.Screen name="open-fill-ins" options={{ href: null }} />
      <Tabs.Screen name="past-fill-ins" options={{ href: null }} />
      <Tabs.Screen name="fill-in-availability" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? 'signed-out';

  return (
    <SidebarCollapseProvider>
      <MessageUnreadProvider role="worker">
        <ApplicationTabBadgeProvider role="worker">
          <TabAtmosphereShell role="worker">
            <WorkerSetupGate>
              <WorkerTabNavigator key={userId} />
            </WorkerSetupGate>
          </TabAtmosphereShell>
        </ApplicationTabBadgeProvider>
      </MessageUnreadProvider>
    </SidebarCollapseProvider>
  );
}
