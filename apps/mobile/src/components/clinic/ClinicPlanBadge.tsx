import { Ionicons } from '@expo/vector-icons';
import { CLINIC_PLAN_LABELS, type ClinicPlan } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import {
  CLINIC_PLAN_ICONS,
  getClinicPlanBrandAccentColor,
  getClinicPlanSubtleBackground,
  getClinicPlanTierLabel,
} from '@/lib/clinicPlanPresentation';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';
import { webPointer } from '@/lib/webPressableStyles';

type ClinicPlanBadgeProps = {
  plan: ClinicPlan;
  onPress?: () => void;
  /** Sidebar — short label ("Free") instead of "Free plan". */
  compact?: boolean;
};

/** Tonal plan badge with icon — matches plan brand color. */
export function ClinicPlanBadge({ plan, onPress, compact = false }: ClinicPlanBadgeProps) {
  const { colors } = useTheme();
  const accent = getClinicPlanBrandAccentColor(plan, colors);
  const backgroundColor = getClinicPlanSubtleBackground(plan, colors);
  const icon = CLINIC_PLAN_ICONS[plan];
  const label = compact ? CLINIC_PLAN_LABELS[plan] : getClinicPlanTierLabel(plan);

  const styles = useThemedStyles(({ radii, spacing }) => ({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexShrink: 0,
      gap: 4,
      paddingHorizontal: spacing.sm - 2,
      paddingVertical: 3,
      borderRadius: radii.pill,
      backgroundColor,
      maxWidth: '100%',
      ...webPointer(),
    },
    label: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: accent,
      flexShrink: 0,
    },
  }));

  const content = (
    <>
      <Ionicons name={icon} size={12} color={accent} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.badge} accessibilityLabel={label}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. Open plans and billing.`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={styles.badge}>
      {content}
    </Pressable>
  );
}
