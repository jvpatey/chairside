import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { renderWorkerTabBar } from '@/components/navigation/AdaptiveTabBar';
import { getDashboardTabOptions } from '@/components/navigation/dashboardTabOptions';
import { useAdaptiveTabScreenOptions } from '@/components/navigation/useAdaptiveTabScreenOptions';
import { MessageUnreadProvider, useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

function WorkerTabNavigator() {
  const { unreadCount } = useMessageUnread();
  const { isTablet } = useResponsiveLayout();
  const screenOptions = useAdaptiveTabScreenOptions();

  return (
    <Tabs tabBar={renderWorkerTabBar} screenOptions={screenOptions}>
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Roles',
          tabBarIcon: ({ color }) => <Ionicons name="briefcase-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="index" options={getDashboardTabOptions(isTablet)} />
      <Tabs.Screen
        name="fillins"
        options={{
          title: 'Fill-ins',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="application" options={{ href: null }} />
      <Tabs.Screen name="conversation/[id]" options={{ href: null }} />
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
      <Tabs.Screen name="shift/[id]" options={{ href: null }} />
      <Tabs.Screen name="apply" options={{ href: null }} />
      <Tabs.Screen name="apply-screening" options={{ href: null }} />
      <Tabs.Screen name="open-fill-ins" options={{ href: null }} />
      <Tabs.Screen name="past-fill-ins" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <MessageUnreadProvider role="worker">
      <WorkerTabNavigator />
    </MessageUnreadProvider>
  );
}
