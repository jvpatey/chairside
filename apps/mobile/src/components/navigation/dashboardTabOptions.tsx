import { Ionicons } from '@expo/vector-icons';

export function getDashboardTabOptions(isTablet: boolean) {
  return {
    title: isTablet ? 'Dashboard' : 'Home',
    tabBarAccessibilityLabel: 'Dashboard',
    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
      <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
    ),
  };
}
