import { Stack } from 'expo-router';

export default function WorkerSetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="basics" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="skills" />
      <Stack.Screen name="location" />
      <Stack.Screen name="application" />
      <Stack.Screen name="availability-schedule" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
