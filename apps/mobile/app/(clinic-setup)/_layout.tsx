import { Stack } from 'expo-router';

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
