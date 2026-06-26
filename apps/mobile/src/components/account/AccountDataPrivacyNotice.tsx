import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AccountSettingsCard } from '@/components/account/AccountSettingsCard';
import { ACCOUNT_DATA_PRIVACY_POINTS } from '@/lib/accountDeletionCopy';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

export function AccountDataPrivacyNotice() {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    toggle: {
      padding: spacing.xs,
      margin: -spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    toggleHovered: webListRowHoverStyles(colors),
    togglePressed: {
      opacity: 0.88,
    },
    list: {
      gap: spacing.xs,
    },
    bulletRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    bullet: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    bulletText: {
      flex: 1,
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

  const accessibilityAction = expanded ? 'Collapse' : 'Expand';

  return (
    <AccountSettingsCard
      title="Privacy & data"
      icon="shield-checkmark-outline"
      headerAccessory={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityAction} Privacy & data`}
          accessibilityState={{ expanded }}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setExpanded((current) => !current);
          }}
          style={({ pressed, hovered }) => [
            styles.toggle,
            webHover(hovered, pressed, styles.toggleHovered),
            pressed && styles.togglePressed,
          ]}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.labelTertiary}
          />
        </Pressable>
      }>
      {expanded ? (
        <View style={styles.list}>
          {ACCOUNT_DATA_PRIVACY_POINTS.map((point) => (
            <View key={point} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </AccountSettingsCard>
  );
}
