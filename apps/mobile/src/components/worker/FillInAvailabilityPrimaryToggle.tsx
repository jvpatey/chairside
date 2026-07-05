import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { useFillInAvailabilityToggle } from '@/hooks/useFillInAvailabilityToggle';
import { useTheme } from '@/theme';

type FillInAvailabilityPrimaryToggleProps = {
  bleedPadding?: number;
};

export function FillInAvailabilityPrimaryToggle({
  bleedPadding,
}: FillInAvailabilityPrimaryToggleProps) {
  const { colors } = useTheme();
  const { shortNoticeAvailable, isSaving, handleToggle } = useFillInAvailabilityToggle();

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
