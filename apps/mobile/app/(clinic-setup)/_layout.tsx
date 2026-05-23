import { Stack } from 'expo-router';

export default function ClinicSetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="basics" />
      <Stack.Screen name="location" />
      <Stack.Screen name="practice" />
      <Stack.Screen name="about" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
