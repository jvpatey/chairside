import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

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
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.backgroundGrouped,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={22} color={color} />,
        }}
      />
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
          tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clinic"
        options={{
          title: 'Clinic',
          tabBarIcon: ({ color }) => <Ionicons name="business" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="post-job" options={{ href: null }} />
      <Tabs.Screen name="post-shift" options={{ href: null }} />
    </Tabs>
  );
}
