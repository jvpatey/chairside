import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { JobPostManageMenuHost } from '@/components/clinic/JobPostManageMenuHost';
import { renderClinicTabBar } from '@/components/navigation/AdaptiveTabBar';
import { getDashboardTabOptions } from '@/components/navigation/dashboardTabOptions';
import { useAdaptiveTabScreenOptions } from '@/components/navigation/useAdaptiveTabScreenOptions';
import { SidebarCollapseProvider } from '@/contexts/SidebarCollapseContext';
import { TabAtmosphereShell } from '@/contexts/TabAtmosphereContext';
import { FillInPendingProvider, useFillInPending } from '@/contexts/FillInPendingContext';
import { MessageUnreadProvider, useMessageUnread } from '@/contexts/MessageUnreadContext';
import { ApplicationTabBadgeProvider, useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

function ClinicTabNavigator() {
  const { unreadCount } = useMessageUnread();
  const { pendingCount } = useFillInPending();
  const { pendingCount: applicationPendingCount } = useApplicationTabBadge();
  const { isTablet } = useResponsiveLayout();
  const screenOptions = useAdaptiveTabScreenOptions();

  return (
    <>
      <Tabs tabBar={renderClinicTabBar} screenOptions={screenOptions}>
        <Tabs.Screen
          name="postings"
          options={{
            title: 'Postings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Apps',
            tabBarAccessibilityLabel: 'Applications',
            tabBarBadge: applicationPendingCount > 0 ? applicationPendingCount : undefined,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="index" options={getDashboardTabOptions(isTablet)} />
        <Tabs.Screen
          name="fill-ins"
          options={{
            title: 'Fill-ins',
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen name="clinic" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="application" options={{ href: null }} />
        <Tabs.Screen name="conversation/[id]" options={{ href: null }} />
        <Tabs.Screen name="post-job" options={{ href: null }} />
        <Tabs.Screen name="post-shift" options={{ href: null }} />
        <Tabs.Screen name="job/[id]" options={{ href: null }} />
        <Tabs.Screen name="shift/[id]" options={{ href: null }} />
        <Tabs.Screen name="role-applicants/[jobId]" options={{ href: null }} />
        <Tabs.Screen name="shift-applicants/[shiftId]" options={{ href: null }} />
        <Tabs.Screen name="role-history" options={{ href: null }} />
      </Tabs>
      <JobPostManageMenuHost />
    </>
  );
}

export default function ClinicTabLayout() {
  return (
    <SidebarCollapseProvider>
      <MessageUnreadProvider role="clinic">
        <FillInPendingProvider>
          <ApplicationTabBadgeProvider role="clinic">
            <TabAtmosphereShell role="clinic">
              <ClinicTabNavigator />
            </TabAtmosphereShell>
          </ApplicationTabBadgeProvider>
        </FillInPendingProvider>
      </MessageUnreadProvider>
    </SidebarCollapseProvider>
  );
}
