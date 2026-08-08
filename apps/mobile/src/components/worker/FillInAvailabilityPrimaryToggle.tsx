import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { ThemedSwitch } from '@/components/ui/ThemedSwitch';
import { useFillInAvailabilityToggle } from '@/hooks/useFillInAvailabilityToggle';
import { useTheme } from '@/theme';

type FillInAvailabilityPrimaryToggleProps = {
  bleedPadding?: number;
  /** Switch only — for ProfileSettingsCard header accessory. */
  variant?: 'full' | 'switchOnly';
};

export function FillInAvailabilityPrimaryToggle({
  bleedPadding,
  variant = 'full',
}: FillInAvailabilityPrimaryToggleProps) {
  const { colors } = useTheme();
  const { shortNoticeAvailable, isSaving, handleToggle } = useFillInAvailabilityToggle();

  if (variant === 'switchOnly') {
    return (
      <ThemedSwitch
        value={shortNoticeAvailable}
        disabled={isSaving}
        trackColorTrue={colors.secondary}
        onValueChange={(value) => void handleToggle(value)}
      />
    );
  }

  return (
    <SettingsToggleRow
      prominence="primary"
      title="Available for fill-ins"
      hint={
        shortNoticeAvailable
          ? 'You appear open to short-notice fill-in opportunities.'
          : 'Turn on when you can cover urgent shifts.'
      }
      value={shortNoticeAvailable}
      disabled={isSaving}
      accentColor={colors.secondary}
      bleedPadding={bleedPadding}
      onValueChange={(value) => void handleToggle(value)}
    />
  );
}
