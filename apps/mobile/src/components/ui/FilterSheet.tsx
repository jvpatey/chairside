import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useThemedStyles } from '@/theme';

export function FilterSheetSection<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
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
      <ChipSelector options={options} selected={selected} onChange={(value) => onChange(value as T)} />
    </View>
  );
}

type FilterSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onReset: () => void;
  children: ReactNode;
};

export function FilterSheet({ visible, title, onClose, onReset, children }: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      gap: spacing.lg,
      maxHeight: '80%',
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
      color: colors.primary,
    },
    content: {
      gap: spacing.lg,
    },
    footer: {
      gap: spacing.sm,
    },
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
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
            <OnboardingButton label="Done" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
