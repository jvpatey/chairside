import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebDialogShell } from '@/components/ui/WebDialogShell.web';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { radii } from '@/theme/tokens';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';
import { webTypography } from '@/theme/web';

import { FilterSheet as FilterSheetBottom, FilterSheetSection } from './FilterSheet.tsx';

export { FilterSheetSection };

type FilterSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onReset: () => void;
  children: ReactNode;
  accent?: GradientAccent;
};

function FilterSheetDialog({
  visible,
  title,
  onClose,
  onReset,
  children,
  accent = 'primary',
}: FilterSheetProps) {
  const { colors } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingRight: spacing.xl,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    title: {
      ...webTypography.title,
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.35,
      color: colors.labelPrimary,
      flex: 1,
    },
    reset: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.pill,
      backgroundColor: brandSubtle,
      borderWidth: 1,
      borderColor: `${brandColor}33`,
      ...webPointer(),
    },
    resetHovered: {
      backgroundColor: `${brandColor}22`,
      borderColor: `${brandColor}55`,
    },
    resetPressed: {
      opacity: 0.8,
    },
    resetLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: brandColor,
    },
    scroll: {
      maxHeight: 420,
    },
    content: {
      gap: spacing.lg,
      paddingVertical: spacing.md,
    },
    footer: {
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      width: '100%' as const,
    },
  }));

  return (
    <WebDialogShell
      visible={visible}
      onClose={onClose}
      maxWidth={600}
      showCloseButton
      backdropLabel="Close filters"
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          onPress={onReset}
          accessibilityRole="button"
          accessibilityLabel="Reset filters"
          style={({ pressed, hovered }) => [
            styles.reset,
            webHover(hovered, pressed, styles.resetHovered),
            pressed && styles.resetPressed,
          ]}
        >
          <Text style={styles.resetLabel}>Reset</Text>
        </Pressable>
      </View>
      <ScrollView
        style={[styles.scroll, webScrollbarStyles()]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      <View style={styles.footer}>
        <OnboardingButton label="Done" accent={accent} onPress={onClose} />
      </View>
    </WebDialogShell>
  );
}

/** Web: bottom sheet below tablet width, centered dialog at tablet+. */
export function FilterSheet(props: FilterSheetProps) {
  const { isTablet } = useResponsiveLayout();

  if (!isTablet) {
    return <FilterSheetBottom {...props} />;
  }

  return <FilterSheetDialog {...props} />;
}
