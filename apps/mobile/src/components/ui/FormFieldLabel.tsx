import { Text, View } from 'react-native';

import { PillBadge } from '@/components/ui/PillBadge';
import { formFieldLabelStylePlain } from '@/theme/formFieldTokens';
import { useTheme, useThemedStyles } from '@/theme';

type FormFieldLabelProps = {
  label: string;
  required?: boolean;
};

/** Sentence-case form label with optional mint Required badge. */
export function FormFieldLabel({ label, required = false }: FormFieldLabelProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles((theme) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flexWrap: 'wrap' as const,
      gap: theme.spacing.xs,
    },
    label: formFieldLabelStylePlain(theme),
  }));

  return (
    <View style={styles.row} accessibilityRole="text">
      <Text style={styles.label}>{label}</Text>
      {required ? (
        <PillBadge
          label="Required"
          size="xs"
          color={colors.tertiary}
          backgroundColor={colors.tertiarySubtle}
          borderColor={colors.tertiary}
        />
      ) : null}
    </View>
  );
}
