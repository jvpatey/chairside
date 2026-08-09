import { COMMON_PASSWORDS } from '@/lib/commonPasswords';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export type PasswordRequirement = {
  id: string;
  label: string;
  met: boolean;
};

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  ratio: number;
};

export type PasswordEvaluation = {
  requirements: PasswordRequirement[];
  isValid: boolean;
  strength: PasswordStrength;
  /** Submit-time only — not shown in the live checklist. */
  maxLengthError: string | null;
};

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;

const SEQUENTIAL_PATTERN =
  /(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|password)/i;

function emailLocalPart(email: string | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return null;
  const at = trimmed.indexOf('@');
  const local = at === -1 ? trimmed : trimmed.slice(0, at);
  return local.length >= 3 ? local : null;
}

function containsEmailLocalPart(password: string, email: string | undefined): boolean {
  const local = emailLocalPart(email);
  if (!local) return false;
  return password.toLowerCase().includes(local);
}

function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}

function meetsMinLength(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

function meetsMaxLength(password: string): boolean {
  return password.length <= PASSWORD_MAX_LENGTH;
}

export function computePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: STRENGTH_LABELS[0], ratio: 0 };
  }

  let points = 0;

  if (password.length >= PASSWORD_MIN_LENGTH) points += 1;
  if (password.length >= 12) points += 1;
  if (password.length >= 16) points += 1;

  const variety = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  if (variety >= 2) points += 0.5;
  if (variety >= 3) points += 0.5;

  if (/(.)\1{2,}/.test(password)) points -= 0.5;
  if (SEQUENTIAL_PATTERN.test(password)) points -= 0.5;
  if (isCommonPassword(password)) points -= 1;

  const score = Math.max(0, Math.min(4, Math.round(points))) as PasswordStrength['score'];

  return {
    score,
    label: STRENGTH_LABELS[score],
    ratio: score / 4,
  };
}

export function evaluatePassword(
  password: string,
  options?: { email?: string },
): PasswordEvaluation {
  const minLengthMet = meetsMinLength(password);
  const commonMet = password.length === 0 || !isCommonPassword(password);
  const emailContextMet = password.length === 0 || !containsEmailLocalPart(password, options?.email);
  const withinMaxLength = meetsMaxLength(password);

  const requirements: PasswordRequirement[] = [
    {
      id: 'minLength',
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      met: minLengthMet,
    },
    {
      id: 'notCommon',
      label: 'Not a commonly used password',
      met: commonMet,
    },
    {
      id: 'noEmailContext',
      label: "Doesn't contain your email",
      met: emailContextMet,
    },
  ];

  const isValid =
    minLengthMet && commonMet && emailContextMet && withinMaxLength && password.length > 0;

  return {
    requirements,
    isValid,
    strength: computePasswordStrength(password),
    maxLengthError: withinMaxLength
      ? null
      : `Use at most ${PASSWORD_MAX_LENGTH} characters.`,
  };
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

export function getPasswordPlaceholder(): string {
  return `At least ${PASSWORD_MIN_LENGTH} characters`;
}

export function getPasswordTooShortMessage(): string {
  return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
}
