import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { SHEET_ENTER } from '@/components/ui/sheetAnimations';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

export function FilterSheetSection<T extends string>({
  label,
  options,
  selected,
  onChange,
  accent = 'primary',
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
  accent?: GradientAccent;
}) {
  const styles = useThemedStyles(({ spacing, colors }) => ({
    section: {
      gap: spacing.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <ChipSelector
        options={options}
        selected={selected}
        onChange={(value) => onChange(value as T)}
        accent={accent}
      />
    </View>
  );
}

type FilterSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onReset: () => void;
  children: ReactNode;
  accent?: GradientAccent;
};

export function FilterSheet({
  visible,
  title,
  onClose,
  onReset,
  children,
  accent = 'primary',
}: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheetWrap: {
      maxHeight: '80%',
    },
    sheet: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      gap: spacing.lg,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    title: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600',
    },
    reset: {
      fontSize: 15,
      fontWeight: '600',
      color: brandColor,
    },
    content: {
      gap: spacing.lg,
    },
    footer: {
      gap: spacing.sm,
    },
  }));

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {visible ? (
          <Animated.View entering={SHEET_ENTER} style={styles.sheetWrap}>
            <Pressable onPress={(event) => event.stopPropagation()}>
              <LiquidGlassSurface borderRadius={20} style={styles.sheet}>
                <View style={styles.handle} />
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  <Pressable onPress={onReset} accessibilityRole="button" accessibilityLabel="Reset filters">
                    <Text style={styles.reset}>Reset</Text>
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                  {children}
                </ScrollView>
                <View style={styles.footer}>
                  <OnboardingButton label="Done" accent={accent} onPress={onClose} />
                </View>
              </LiquidGlassSurface>
            </Pressable>
          </Animated.View>
        ) : null}
      </Pressable>
    </Modal>
  );
}
