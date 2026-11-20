import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { JobPostManageMenuHost } from '@/components/clinic/JobPostManageMenuHost';
import { ClinicSetupGate } from '@/components/onboarding/SetupGate';
import { renderClinicTabBar } from '@/components/navigation/AdaptiveTabBar';
import { getDashboardTabOptions } from '@/components/navigation/dashboardTabOptions';
import { useAdaptiveTabScreenOptions } from '@/components/navigation/useAdaptiveTabScreenOptions';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarCollapseProvider } from '@/contexts/SidebarCollapseContext';
import { TabAtmosphereShell } from '@/contexts/TabAtmosphereContext';
import { FillInPendingProvider, useFillInPending } from '@/contexts/FillInPendingContext';
import { MessageUnreadProvider } from '@/contexts/MessageUnreadContext';
import { ApplicationTabBadgeProvider } from '@/contexts/ApplicationTabBadgeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { fillInTabIcon } from '@/lib/fillInIcons';

export const unstable_settings = {
  anchor: 'index',
};

function ClinicTabNavigator() {
  const { pendingCount } = useFillInPending();
  const { isTablet } = useResponsiveLayout();
  const screenOptions = useAdaptiveTabScreenOptions();

  return (
    <>
      <Tabs tabBar={renderClinicTabBar} screenOptions={screenOptions} backBehavior="initialRoute">
        <Tabs.Screen name="index" options={getDashboardTabOptions(isTablet)} />
        <Tabs.Screen
          name="postings"
          options={{
            title: 'Roles',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'briefcase' : 'briefcase-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen name="discover" options={{ href: null }} />
        <Tabs.Screen name="applications" options={{ href: null }} />
        <Tabs.Screen
          name="fill-ins"
          options={{
            title: 'Fill-ins',
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={fillInTabIcon(focused)} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="calendar" options={{ href: null }} />
        <Tabs.Screen name="messages" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="admin" options={{ href: null }} />
        <Tabs.Screen name="application" options={{ href: null }} />
        <Tabs.Screen name="conversation/[id]" options={{ href: null }} />
        <Tabs.Screen name="post-job" options={{ href: null }} />
        <Tabs.Screen name="post-shift" options={{ href: null }} />
        <Tabs.Screen name="find-available-workers" options={{ href: null }} />
        <Tabs.Screen name="open-inquiry-candidates" options={{ href: null }} />
        <Tabs.Screen name="outreach-compose" options={{ href: null }} />
        <Tabs.Screen name="job/[id]" options={{ href: null }} />
        <Tabs.Screen name="shift/[id]" options={{ href: null }} />
        <Tabs.Screen name="clinic/[clinicId]" options={{ href: null }} />
        <Tabs.Screen name="role-applicants/[jobId]" options={{ href: null }} />
        <Tabs.Screen name="shift-applicants/[shiftId]" options={{ href: null }} />
        <Tabs.Screen name="role-history" options={{ href: null }} />
      </Tabs>
      <JobPostManageMenuHost />
    </>
  );
}

export default function ClinicTabLayout() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? 'signed-out';

  return (
    <SidebarCollapseProvider>
      <MessageUnreadProvider role="clinic">
        <FillInPendingProvider>
          <ApplicationTabBadgeProvider role="clinic">
            <TabAtmosphereShell role="clinic">
              <ClinicSetupGate>
                <ClinicTabNavigator key={userId} />
              </ClinicSetupGate>
            </TabAtmosphereShell>
          </ApplicationTabBadgeProvider>
        </FillInPendingProvider>
      </MessageUnreadProvider>
    </SidebarCollapseProvider>
  );
}
