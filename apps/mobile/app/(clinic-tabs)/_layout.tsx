import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { JobPostManageMenuHost } from '@/components/clinic/JobPostManageMenuHost';
import {
  DashboardTabBarButton,
  DashboardTabIcon,
} from '@/components/navigation/DashboardTabBarButton';
import { FillInPendingProvider, useFillInPending } from '@/contexts/FillInPendingContext';
import { MessageUnreadProvider, useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useTheme } from '@/theme';

function ClinicTabNavigator() {
  const { colors } = useTheme();
  const { unreadCount } = useMessageUnread();
  const { pendingCount } = useFillInPending();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.separator,
            ...(Platform.OS === 'ios' ? { borderTopWidth: 0.5 } : {}),
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          },
          headerShown: false,
          sceneStyle: {
            backgroundColor: colors.backgroundGrouped,
          },
        }}
      >
        <Tabs.Screen
          name="postings"
          options={{
            title: 'Postings',
            tabBarIcon: ({ color }) => <Ionicons name="briefcase" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Applications',
            tabBarAccessibilityLabel: 'Applications',
            tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarAccessibilityLabel: 'Dashboard',
            tabBarLabel: () => null,
            tabBarItemStyle: { paddingVertical: 6 },
            tabBarButton: (props) => <DashboardTabBarButton {...props} />,
            tabBarIcon: ({ focused }) => <DashboardTabIcon focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="fill-ins"
          options={{
            title: 'Fill-ins',
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
            tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            tabBarIcon: ({ color }) => (
              <Ionicons name="chatbubbles-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="clinic" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="application" options={{ href: null }} />
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
    <MessageUnreadProvider role="clinic">
      <FillInPendingProvider>
        <ClinicTabNavigator />
      </FillInPendingProvider>
    </MessageUnreadProvider>
  );
}
