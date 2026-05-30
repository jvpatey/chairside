import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import {
  DashboardTabBarButton,
  DashboardTabIcon,
} from '@/components/navigation/DashboardTabBarButton';
import { useTheme } from '@/theme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
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
      }}>
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => <Ionicons name="search" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: () => null,
          tabBarItemStyle: { paddingVertical: 6 },
          tabBarButton: (props) => <DashboardTabBarButton {...props} />,
          tabBarIcon: ({ focused }) => <DashboardTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="fillins"
        options={{
          title: 'Fill-ins',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
      <Tabs.Screen name="shift/[id]" options={{ href: null }} />
      <Tabs.Screen name="application/[id]" options={{ href: null }} />
      <Tabs.Screen name="apply" options={{ href: null }} />
      <Tabs.Screen name="apply-screening" options={{ href: null }} />
      <Tabs.Screen name="open-fill-ins" options={{ href: null }} />
    </Tabs>
  );
}
