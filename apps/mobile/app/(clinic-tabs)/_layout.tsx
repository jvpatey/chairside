import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import {
  DashboardTabBarButton,
  DashboardTabIcon,
} from '@/components/navigation/DashboardTabBarButton';
import { useTheme } from '@/theme';

export default function ClinicTabLayout() {
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
        name="clinic"
        options={{
          title: 'Clinic',
          tabBarIcon: ({ color }) => <Ionicons name="business" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="post-job" options={{ href: null }} />
      <Tabs.Screen name="post-shift" options={{ href: null }} />
      <Tabs.Screen name="job/[id]" options={{ href: null }} />
      <Tabs.Screen name="shift/[id]" options={{ href: null }} />
      <Tabs.Screen name="role-applicants/[jobId]" options={{ href: null }} />
    </Tabs>
  );
}
