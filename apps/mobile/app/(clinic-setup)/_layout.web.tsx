import { Stack } from 'expo-router';

/**
 * No SetupWebShell sidebar — clinic signup uses focused onboarding capture screens
 * (same pattern as workers). Remaining clinic-setup routes are settings / edit only.
 */
export default function ClinicSetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="account-type" />
      <Stack.Screen name="basics" />
      <Stack.Screen name="location" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="team" />
      <Stack.Screen name="practice" />
      <Stack.Screen name="about" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
