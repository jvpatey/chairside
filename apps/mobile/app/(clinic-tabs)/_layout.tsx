import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { JobPostManageMenuHost } from '@/components/clinic/JobPostManageMenuHost';
import { ClinicSetupGate } from '@/components/onboarding/SetupGate';
import { renderClinicTabBar } from '@/components/navigation/AdaptiveTabBar';
import { getDashboardTabOptions } from '@/components/navigation/dashboardTabOptions';
import { hiddenTabScreenOptions } from '@/components/navigation/hiddenTabScreenOptions';
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
  const screenOptions = useAdaptiveTabScreenOptions('clinic');

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
        <Tabs.Screen name="discover" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="applications" options={hiddenTabScreenOptions} />
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
        <Tabs.Screen name="calendar" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="messages" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="profile" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="admin" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="application" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="conversation/[id]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="post-job" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="post-shift" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="find-available-workers" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="open-inquiry-candidates" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="outreach-compose" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="job/[id]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="shift/[id]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="clinic/[clinicId]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="role-applicants/[jobId]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="shift-applicants/[shiftId]" options={hiddenTabScreenOptions} />
        <Tabs.Screen name="role-history" options={hiddenTabScreenOptions} />
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
