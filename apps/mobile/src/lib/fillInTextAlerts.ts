import { formatPhoneNumber } from '@/lib/phone';

export type FillInTextAlertsState =
  /** Opted in with a saved number. */
  | 'on'
  /** Off, but a saved number means one tap turns texts on. */
  | 'off_ready'
  /** Off with no saved number. */
  | 'off_needs_phone'
  /** Switch turned on with no saved number — waiting for the number to finish. */
  | 'finishing'
  /** Changing an already-saved number. */
  | 'changing_number';

export function getFillInTextAlertsState(params: {
  smsOptIn: boolean;
  savedPhone: string | null;
  isFinishing: boolean;
  isChangingNumber: boolean;
}): FillInTextAlertsState {
  const hasPhone = Boolean(params.savedPhone?.trim());
  if (params.isChangingNumber && hasPhone) return 'changing_number';
  if (params.smsOptIn && hasPhone) return 'on';
  if (params.isFinishing) return 'finishing';
  return hasPhone ? 'off_ready' : 'off_needs_phone';
}

/** The switch shows on while finishing setup so it never looks unresponsive. */
export function isFillInTextAlertsSwitchOn(state: FillInTextAlertsState, smsOptIn: boolean): boolean {
  if (state === 'changing_number') return smsOptIn;
  return state === 'on' || state === 'finishing';
}

export function getFillInTextAlertsHint(
  state: FillInTextAlertsState,
  savedPhone: string | null,
): string {
  const formatted = savedPhone ? formatPhoneNumber(savedPhone) : '';
  switch (state) {
    case 'on':
      // Number is shown in its own row — keep this line about consent / opt-out.
      return 'Turn off anytime. Reply STOP on any text to opt out.';
    case 'off_ready':
      return formatted
        ? `Off. Turn on to resume texts at ${formatted}.`
        : 'Off. Turn on to resume texts.';
    case 'finishing':
      return 'Add your mobile number below. Texts turn on automatically when you save.';
    case 'changing_number':
      return 'Update the number that receives fill-in texts.';
    default:
      return 'On by default when you add a mobile number. You can turn texts off anytime.';
  }
}
