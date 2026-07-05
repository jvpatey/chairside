import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { navigateToWelcome } from '@/lib/publicRoutes';
import { webHover, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webTypography } from '@/theme/web';

type SetupStep = {
  id: string;
  label: string;
  href: string;
};

const WORKER_STEPS: SetupStep[] = [
  { id: 'basics', label: 'Basics', href: '/(worker-setup)/basics' },
  { id: 'experience', label: 'Experience', href: '/(worker-setup)/experience' },
  { id: 'skills', label: 'Skills', href: '/(worker-setup)/skills' },
  { id: 'location', label: 'Location', href: '/(worker-setup)/location' },
  { id: 'availability', label: 'Availability', href: '/(worker-setup)/availability' },
  { id: 'application-kit', label: 'Application profile', href: '/(worker-setup)/application-kit' },
  { id: 'review', label: 'Review', href: '/(worker-setup)/review' },
];

const CLINIC_STEPS: SetupStep[] = [
  { id: 'basics', label: 'Basics', href: '/(clinic-setup)/basics' },
  { id: 'location', label: 'Location', href: '/(clinic-setup)/location' },
  { id: 'practice', label: 'Practice', href: '/(clinic-setup)/practice' },
  { id: 'about', label: 'About', href: '/(clinic-setup)/about' },
  { id: 'review', label: 'Review', href: '/(clinic-setup)/review' },
];

type SetupWebShellProps = {
  role: 'worker' | 'clinic';
  children: ReactNode;
};

function getActiveStepIndex(pathname: string, steps: SetupStep[]): number {
  const index = steps.findIndex((step) => pathname.includes(step.id));
  return index >= 0 ? index : 0;
}

export function SetupWebShell({ role, children }: SetupWebShellProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isWide } = useResponsiveLayout();
  const steps = role === 'worker' ? WORKER_STEPS : CLINIC_STEPS;
  const activeIndex = getActiveStepIndex(pathname, steps);

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
      borderRightWidth: isWide ? 1 : 0,
      borderBottomWidth: isWide ? 0 : 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      ...(isWide
        ? webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object)
        : {}),
    },
    railTitle: {
      ...webTypography.title,
      fontSize: 20,
      color: colors.labelPrimary,
      marginBottom: spacing.xs,
    },
    railSubtitle: {
      fontSize: 14,
      color: colors.labelSecondary,
      marginBottom: spacing.lg,
    },
    step: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
      ...webPointer(),
    },
    stepActive: {
      backgroundColor: colors.primarySubtle,
    },
    stepComplete: {
      opacity: 0.85,
    },
    stepHovered: {
      backgroundColor: colors.fillSubtle,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    stepNumberActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    stepNumberComplete: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    stepNumberText: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: colors.labelSecondary,
    },
    stepNumberTextActive: {
      color: colors.primaryOnPrimary,
    },
    stepLabel: {
      fontSize: 15,
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
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          return (
            <Pressable
              key={step.id}
              accessibilityRole="button"
              accessibilityState={isActive ? { selected: true } : {}}
              onPress={() => {
                if (index <= activeIndex) router.push(step.href);
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
                  styles.stepNumber,
                  isActive && styles.stepNumberActive,
                  isComplete && styles.stepNumberComplete,
                ]}
              >
                {isComplete ? (
                  <Ionicons name="checkmark" size={14} color={colors.primaryOnPrimary} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumberText,
                      (isActive || isComplete) && styles.stepNumberTextActive,
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
      <View style={styles.content}>{children}</View>
    </View>
  );
}
