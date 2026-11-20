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
      return `On by default at ${formatted}. Turn off anytime — reply STOP to opt out.`;
    case 'off_ready':
      return `Off. Turn on to resume texts at ${formatted}.`;
    case 'finishing':
      return 'Add your mobile number below. Texts turn on automatically when you save.';
    case 'changing_number':
      return 'Enter the new number for fill-in texts.';
    default:
      return 'On by default when you add a mobile number. You can turn texts off anytime.';
  }
}
