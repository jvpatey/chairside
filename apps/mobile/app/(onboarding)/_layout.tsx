import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="role" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="capture-name" />
      <Stack.Screen name="capture-phone" />
      <Stack.Screen name="capture-location" />
      <Stack.Screen name="capture-clinic-name" />
      <Stack.Screen name="capture-clinic-phone" />
      <Stack.Screen name="capture-clinic-address" />
    </Stack>
  );
}
