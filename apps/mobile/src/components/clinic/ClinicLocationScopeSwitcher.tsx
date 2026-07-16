import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { SHEET_ENTER } from '@/components/ui/sheetAnimations';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useWebEscapeKey } from '@/hooks/useWebEscapeKey';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import {
  colorWithAlpha,
  fontSemibold,
  useTheme,
  useThemedStyles,
} from '@/theme';

export type ClinicLocationScopeSwitcherVariant = 'sidebar' | 'hero';

type ClinicLocationScopeSwitcherProps = {
  variant?: ClinicLocationScopeSwitcherVariant;
  /** Icon-only trigger for the narrow collapsed sidebar rail. */
  collapsed?: boolean;
  /** Placed beside the sidebar trigger (e.g. collapse chevron). */
  endAccessory?: ReactNode;
};

export function getClinicAllLocationsLabel(isOwner: boolean): string {
  return isOwner ? 'All locations' : 'My locations';
}

export function getClinicLocationScopeLabel(
  locationScope: string,
  locations: { id: string; name: string }[],
  isOwner = true,
): string {
  if (locationScope === 'all') return getClinicAllLocationsLabel(isOwner);
  return locations.find((location) => location.id === locationScope)?.name ?? 'Selected location';
}

type ScopeOption = {
  id: string;
  label: string;
};

function LocationScopePickerSheet({
  visible,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  options: ScopeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  useWebEscapeKey(onClose, visible);

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
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    message: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
    list: {
      gap: spacing.xs,
    },
    option: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      ...webPointer(),
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    optionHovered: webListRowHoverStyles(colors),
    optionPressed: {
      opacity: 0.88,
    },
    optionLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    optionLabelSelected: {
      color: colors.primary,
    },
    footer: {
      gap: spacing.sm,
    },
  }));

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button">
        {visible ? (
          <Animated.View entering={SHEET_ENTER} style={styles.sheetWrap}>
            <Pressable onPress={(event) => event.stopPropagation()}>
              <LiquidGlassSurface borderRadius={20} style={styles.sheet}>
                <View style={styles.handle} />
                <View style={styles.header}>
                  <Text style={styles.title}>Viewing</Text>
                  <Text style={styles.message}>
                    Choose which location’s data to show across the clinic home.
                  </Text>
                </View>
                <ScrollView
                  contentContainerStyle={styles.list}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  {options.map((option) => {
                    const selected = option.id === selectedId;
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          onSelect(option.id);
                          onClose();
                        }}
                        style={({ pressed, hovered }) => [
                          styles.option,
                          selected && styles.optionSelected,
                          webHover(hovered, pressed, styles.optionHovered),
                          pressed && styles.optionPressed,
                        ]}>
                        <Text
                          style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                          numberOfLines={2}>
                          {option.label}
                        </Text>
                        {selected ? (
                          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                        ) : (
                          <Ionicons
                            name="ellipse-outline"
                            size={22}
                            color={colors.labelTertiary}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <View style={styles.footer}>
                  <OnboardingButton label="Done" onPress={onClose} />
                </View>
              </LiquidGlassSurface>
            </Pressable>
          </Animated.View>
        ) : null}
      </Pressable>
    </Modal>
  );
}

/** Compact location-scope trigger with sheet picker for group clinics. */
export function ClinicLocationScopeSwitcher({
  variant = 'sidebar',
  collapsed = false,
  endAccessory,
}: ClinicLocationScopeSwitcherProps) {
  const { colors, isDark } = useTheme();
  const {
    isGroup,
    accessibleLocations,
    locationScope,
    setLocationScope,
    isOwner,
  } = useClinicProfile();
  const [pickerOpen, setPickerOpen] = useState(false);

  const showAllOption = isOwner || accessibleLocations.length > 1;
  const allLocationsLabel = getClinicAllLocationsLabel(isOwner);
  const label = getClinicLocationScopeLabel(
    locationScope,
    accessibleLocations,
    isOwner,
  );

  const options = useMemo(() => {
    const next: ScopeOption[] = [];
    if (showAllOption) {
      next.push({ id: 'all', label: allLocationsLabel });
    }
    for (const location of accessibleLocations) {
      next.push({ id: location.id, label: location.name });
    }
    return next;
  }, [accessibleLocations, allLocationsLabel, showAllOption]);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    sidebarWrap: {
      gap: 4,
      minWidth: 0,
    },
    sidebarEyebrow: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.4,
    },
    sidebarTriggerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      minWidth: 0,
    },
    sidebarTrigger: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      minWidth: 0,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    sidebarTriggerPressed: {
      opacity: 0.88,
    },
    sidebarLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    collapsedWrap: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.xs,
    },
    collapsedTrigger: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    collapsedTriggerPressed: {
      opacity: 0.88,
    },
    heroTrigger: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      alignSelf: 'flex-start' as const,
      gap: 4,
      maxWidth: '100%' as const,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: radii.pill,
      backgroundColor: colorWithAlpha(colors.surface, isDark ? 0.16 : 0.72),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(colors.primaryOnPrimary, isDark ? 0.18 : 0.35),
      ...webPointer(),
    },
    heroTriggerPressed: {
      opacity: 0.88,
    },
    heroLabel: {
      flexShrink: 1,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
  }));

  if (!isGroup || accessibleLocations.length === 0) return null;

  const accessibilityLabel = `Viewing ${label}. Change location.`;

  const trigger =
    variant === 'hero' ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setPickerOpen(true)}
        style={({ pressed, hovered }) => [
          styles.heroTrigger,
          webHover(hovered, pressed, webTextLinkHoverStyles(colors)),
          pressed && styles.heroTriggerPressed,
        ]}>
        <Text style={styles.heroLabel} numberOfLines={1}>
          Change location
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.labelSecondary} />
      </Pressable>
    ) : collapsed ? (
      <View style={styles.collapsedWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={() => setPickerOpen(true)}
          style={({ pressed, hovered }) => [
            styles.collapsedTrigger,
            webHover(hovered, pressed, webTextLinkHoverStyles(colors)),
            pressed && styles.collapsedTriggerPressed,
          ]}>
          <Ionicons name="business-outline" size={16} color={colors.labelPrimary} />
        </Pressable>
        {endAccessory}
      </View>
    ) : (
      <View style={styles.sidebarWrap}>
        <Text style={styles.sidebarEyebrow}>Viewing</Text>
        <View style={styles.sidebarTriggerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={() => setPickerOpen(true)}
            style={({ pressed, hovered }) => [
              styles.sidebarTrigger,
              webHover(hovered, pressed, webTextLinkHoverStyles(colors)),
              pressed && styles.sidebarTriggerPressed,
            ]}>
            <Text style={styles.sidebarLabel} numberOfLines={1}>
              {label}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.labelSecondary} />
          </Pressable>
          {endAccessory}
        </View>
      </View>
    );

  return (
    <>
      {trigger}
      <LocationScopePickerSheet
        visible={pickerOpen}
        options={options}
        selectedId={locationScope === 'all' ? 'all' : locationScope}
        onSelect={(id) => setLocationScope(id === 'all' ? 'all' : id)}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
