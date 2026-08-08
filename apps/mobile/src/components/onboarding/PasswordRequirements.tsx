import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import {
  evaluatePassword,
  type PasswordEvaluation,
  type PasswordRequirement,
} from '@/lib/passwordPolicy';
import { useTheme, useThemedStyles } from '@/theme';

type PasswordRequirementsProps = {
  password: string;
  email?: string;
  /** Precomputed evaluation — pass when the parent already called evaluatePassword. */
  evaluation?: PasswordEvaluation;
};

function strengthBarColor(
  score: PasswordEvaluation['strength']['score'],
  colors: ReturnType<typeof useTheme>['colors'],
): string {
  if (score <= 1) return colors.destructive;
  if (score === 2) return colors.warning;
  return colors.success;
}

function RequirementRow({ requirement }: { requirement: PasswordRequirement }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    label: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: requirement.met ? colors.success : colors.labelSecondary,
      fontWeight: requirement.met ? ('500' as const) : ('400' as const),
    },
  }));

  return (
    <View style={styles.row}>
      <Ionicons
        name={requirement.met ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={requirement.met ? colors.success : colors.labelTertiary}
      />
      <Text style={styles.label}>{requirement.label}</Text>
    </View>
  );
}

export function PasswordRequirements({ password, email, evaluation }: PasswordRequirementsProps) {
  const { colors } = useTheme();
  const resolved = evaluation ?? evaluatePassword(password, { email });

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    strengthLabel: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.4,
    },
    barTrack: {
      flexDirection: 'row' as const,
      gap: 4,
      height: 4,
    },
    barSegment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.fillSubtle,
    },
    checklist: {
      gap: spacing.xs,
    },
  }));

  if (!password) {
    return null;
  }

  const activeColor = strengthBarColor(resolved.strength.score, colors);
  const metCount = resolved.requirements.filter((requirement) => requirement.met).length;
  const accessibilitySummary = `Password strength: ${resolved.strength.label}. ${metCount} of ${resolved.requirements.length} requirements met.`;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilitySummary}>
      <Text style={styles.strengthLabel}>{resolved.strength.label}</Text>
      <View style={styles.barTrack} accessibilityElementsHidden importantForAccessibility="no">
        {[0, 1, 2, 3].map((segment) => (
          <View
            key={segment}
            style={[
              styles.barSegment,
              segment <= resolved.strength.score - 1 && { backgroundColor: activeColor },
            ]}
          />
        ))}
      </View>
      <View style={styles.checklist}>
        {resolved.requirements.map((requirement) => (
          <RequirementRow key={requirement.id} requirement={requirement} />
        ))}
      </View>
    </View>
  );
}
