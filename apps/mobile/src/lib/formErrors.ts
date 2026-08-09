import { Alert, Platform } from 'react-native';

type FormErrorOptions = {
  title?: string;
  alertOnNative?: boolean;
};

/** Sets a banner message and optionally shows a native alert (skipped on web). */
export function showFormError(
  message: string,
  { title = 'Missing information', alertOnNative = true }: FormErrorOptions = {},
): string {
  if (alertOnNative && Platform.OS !== 'web') {
    Alert.alert(title, message);
  }
  return message;
}
