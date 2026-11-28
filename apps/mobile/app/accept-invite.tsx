import { Redirect } from 'expo-router';

/**
 * Manager invitations are retired (one login per clinic or group).
 * Old invite links land here and continue to the normal app entry.
 */
export default function RetiredAcceptInviteScreen() {
  return <Redirect href="/" />;
}
