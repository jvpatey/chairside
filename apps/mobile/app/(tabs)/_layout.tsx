import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';

import { renderWorkerTabBar } from '@/components/navigation/AdaptiveTabBar';
import { getDashboardTabOptions } from '@/components/navigation/dashboardTabOptions';
import { useAdaptiveTabScreenOptions } from '@/components/navigation/useAdaptiveTabScreenOptions';
import { SidebarCollapseProvider } from '@/contexts/SidebarCollapseContext';
import { TabAtmosphereShell } from '@/contexts/TabAtmosphereContext';
import { MessageUnreadProvider, useMessageUnread } from '@/contexts/MessageUnreadContext';
import { ApplicationTabBadgeProvider, useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getWorkerMessagesRoute } from '@/lib/routing';

function WorkerTabNavigator() {
  const { unreadCount } = useMessageUnread();
  const { pendingCount: applicationPendingCount, fillInPendingCount } = useApplicationTabBadge();
  const { isTablet } = useResponsiveLayout();
  const screenOptions = useAdaptiveTabScreenOptions();

  return (
    <Tabs tabBar={renderWorkerTabBar} screenOptions={screenOptions}>
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Roles',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarAccessibilityLabel: 'Applications',
          tabBarBadge: applicationPendingCount > 0 ? applicationPendingCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="index" options={getDashboardTabOptions(isTablet)} />
      <Tabs.Screen
        name="fillins"
        options={{
          title: 'Fill-ins',
          tabBarBadge: fillInPendingCount > 0 ? fillInPendingCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'today' : 'today-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            const messagesRoute = navigation
              .getState()
              .routes.find((route) => route.name === 'messages');
            const stackRoutes = messagesRoute?.state?.routes;
            const stackIndex = messagesRoute?.state?.index ?? 0;
            const currentStackRoute = stackRoutes?.[stackIndex];

            if (
              currentStackRoute?.name === 'clinics' &&
              (currentStackRoute.params as { returnTo?: string } | undefined)?.returnTo ===
                'browse-tab'
            ) {
              event.preventDefault();
              router.replace(getWorkerMessagesRoute());
            }
          },
        })}
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
      <Tabs.Screen name="message-clinics" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="application" options={{ href: null }} />
      <Tabs.Screen name="conversation/[id]" options={{ href: null }} />
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
      <Tabs.Screen name="shift/[id]" options={{ href: null }} />
      <Tabs.Screen name="clinic/[id]" options={{ href: null }} />
      <Tabs.Screen name="apply" options={{ href: null }} />
      <Tabs.Screen name="apply-screening" options={{ href: null }} />
      <Tabs.Screen name="open-fill-ins" options={{ href: null }} />
      <Tabs.Screen name="past-fill-ins" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <SidebarCollapseProvider>
      <MessageUnreadProvider role="worker">
        <ApplicationTabBadgeProvider role="worker">
          <TabAtmosphereShell role="worker">
            <WorkerTabNavigator />
          </TabAtmosphereShell>
        </ApplicationTabBadgeProvider>
      </MessageUnreadProvider>
    </SidebarCollapseProvider>
  );
}
