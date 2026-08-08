import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { navigateToWelcome } from '@/lib/publicRoutes';
import {
  getSetupStepIndexFromPath,
  getSetupSteps,
  type SetupRole,
} from '@/lib/setupSteps';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { radii } from '@/theme/tokens';
import { webOnboardingAtmosphereStyle, webTypography } from '@/theme/web';

type SetupWebShellProps = {
  role: SetupRole;
  children: ReactNode;
};

export function SetupWebShell({ role, children }: SetupWebShellProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isWide } = useResponsiveLayout();
  const { isGroup } = useClinicProfile();

  const steps = useMemo(() => getSetupSteps(role, isGroup), [isGroup, role]);
  const activeIndex = getSetupStepIndexFromPath(role, pathname, isGroup);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    root: {
      flex: 1,
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      backgroundColor: colors.backgroundGrouped,
    },
    rail: {
      width: isWide ? 280 : undefined,
      paddingTop: insets.top + spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      borderRightWidth: isWide ? StyleSheet.hairlineWidth : 0,
      borderBottomWidth: isWide ? 0 : StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
    },
    railTitle: {
      ...webTypography.title,
      fontSize: 20,
      lineHeight: 28,
      color: colors.labelPrimary,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    railSubtitle: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.labelSecondary,
      marginBottom: spacing.xl,
    },
    steps: {
      gap: spacing.xs,
    },
    step: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.sm,
      ...webPointer(),
    },
    stepActive: {
      backgroundColor: colors.primarySubtle,
    },
    stepComplete: {
      opacity: 0.9,
    },
    stepHovered: {
      backgroundColor: colors.fillSubtle,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.fillSubtle,
      flexShrink: 0,
    },
    stepBadgeActive: {
      backgroundColor: colors.primarySubtle,
    },
    stepBadgeComplete: {
      backgroundColor: colors.success,
    },
    stepNumberText: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: colors.labelSecondary,
    },
    stepNumberTextActive: {
      color: colors.primary,
    },
    stepLabel: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
    },
    stepLabelActive: {
      fontWeight: '600' as const,
      color: colors.primary,
    },
    content: {
      flex: 1,
      minWidth: 0,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      backgroundColor: colors.backgroundGrouped,
    },
    contentAtmosphere: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: 'none' as const,
      ...webOnboardingAtmosphereStyle(isDark),
    },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.rail}>
        <ChairsideWordmark variant="small" onPress={navigateToWelcome} />
        <Text style={styles.railTitle}>
          {role === 'worker' ? 'Set up your profile' : 'Set up your clinic'}
        </Text>
        <Text style={styles.railSubtitle}>
          Step {activeIndex + 1} of {steps.length}
        </Text>
        <View style={styles.steps}>
          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            const isComplete = index < activeIndex;
            return (
              <Pressable
                key={step.id}
                accessibilityRole="button"
                accessibilityState={isActive ? { selected: true } : {}}
                onPress={() => {
                  if (index <= activeIndex) router.push(step.href as never);
                }}
                style={({ pressed, hovered }) => [
                  styles.step,
                  isActive && styles.stepActive,
                  isComplete && styles.stepComplete,
                  webHover(hovered, pressed, styles.stepHovered, index > activeIndex),
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View
                  style={[
                    styles.stepBadge,
                    isActive && styles.stepBadgeActive,
                    isComplete && styles.stepBadgeComplete,
                  ]}
                >
                  {isComplete ? (
                    <Ionicons name="checkmark" size={14} color={colors.primaryOnPrimary} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumberText,
                        isActive && styles.stepNumberTextActive,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                  {step.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.contentAtmosphere} />
        {children}
      </View>
    </View>
  );
}
