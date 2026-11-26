import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { SHEET_ENTER } from '@/components/ui/sheetAnimations';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useWebEscapeKey } from '@/hooks/useWebEscapeKey';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

export function getClinicLocationScopeLabel(
  locationScope: string,
  locations: { id: string; name: string }[],
): string {
  return locations.find((location) => location.id === locationScope)?.name ?? 'Select clinic';
}

type ScopeOption = {
  id: string;
  label: string;
  meta: string | null;
  logoStoragePath: string | null;
};

const DROPDOWN_ENTER = FadeInDown.duration(160).easing(Easing.out(Easing.cubic));

function LocationScopeOptionRow({
  option,
  selected,
  onPress,
  density,
}: {
  option: ScopeOption;
  selected: boolean;
  onPress: () => void;
  /** 'sheet' = roomy card rows with radio; 'menu' = compact dropdown rows. */
  density: 'sheet' | 'menu';
}) {
  const { colors } = useTheme();
  const logoUri = useClinicLogoUri(option.logoStoragePath);
  const isSheet = density === 'sheet';
  const avatarSize = isSheet ? 40 : 34;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm + 2,
      paddingVertical: isSheet ? spacing.sm + 2 : spacing.xs + 4,
      paddingHorizontal: isSheet ? spacing.md : spacing.sm,
      borderRadius: isSheet ? 12 : 10,
      ...(isSheet
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.separator,
            backgroundColor: colors.surface,
          }
        : null),
      ...webPointer(),
    },
    rowSelected: isSheet
      ? {
          borderColor: colors.primary,
          backgroundColor: colors.primarySubtle,
        }
      : {
          backgroundColor: colors.primarySubtle,
        },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: {
      opacity: 0.88,
    },
    textWrap: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    label: {
      fontSize: isSheet ? 15 : 14,
      lineHeight: isSheet ? 20 : 19,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    labelSelected: {
      color: colors.primary,
    },
    meta: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelTertiary,
    },
  }));

  const accessibilityLabel = option.meta
    ? `${option.label}, ${option.meta}`
    : option.label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.row,
        selected && styles.rowSelected,
        webHover(hovered, pressed, styles.rowHovered, selected),
        pressed && styles.rowPressed,
      ]}>
      <ClinicLogoAvatar clinicName={option.label} logoUri={logoUri} size={avatarSize} />
      <View style={styles.textWrap}>
        <Text
          style={[styles.label, selected && styles.labelSelected]}
          numberOfLines={1}>
          {option.label}
        </Text>
        {option.meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {option.meta}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
      ) : isSheet ? (
        <Ionicons name="ellipse-outline" size={20} color={colors.labelTertiary} />
      ) : null}
    </Pressable>
  );
}

function ScopeOptionList({
  options,
  selectedId,
  onSelect,
  density,
}: {
  options: ScopeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  density: 'sheet' | 'menu';
}) {
  const styles = useThemedStyles(({ spacing }) => ({
    list: {
      gap: density === 'sheet' ? spacing.xs : 2,
    },
  }));

  return (
    <View style={styles.list}>
      {options.map((option) => (
        <LocationScopeOptionRow
          key={option.id}
          option={option}
          selected={option.id === selectedId}
          onPress={() => onSelect(option.id)}
          density={density}
        />
      ))}
    </View>
  );
}

/** Native (and mobile-web fallback) bottom sheet picker. */
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
      gap: spacing.md,
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
  }));

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      {/*
        The backdrop must not be role="button": on web that renders a <button>, and the
        option rows inside it are buttons too (invalid nested <button>).
      */}
      <Pressable style={styles.backdrop} onPress={onClose} accessible={false}>
        {visible ? (
          <Animated.View entering={SHEET_ENTER} style={styles.sheetWrap}>
            <Pressable accessible={false} onPress={(event) => event.stopPropagation()}>
              <LiquidGlassSurface borderRadius={20} style={styles.sheet}>
                <View style={styles.handle} />
                <View style={styles.header}>
                  <Text style={styles.title}>Switch clinic</Text>
                  <Text style={styles.message}>
                    Choose which clinic’s fill-ins, roles and applicants to show.
                  </Text>
                </View>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  <ScopeOptionList
                    options={options}
                    selectedId={selectedId}
                    onSelect={(id) => {
                      onSelect(id);
                      onClose();
                    }}
                    density="sheet"
                  />
                </ScrollView>
              </LiquidGlassSurface>
            </Pressable>
          </Animated.View>
        ) : null}
      </Pressable>
    </Modal>
  );
}

type AnchorRect = { x: number; y: number; width: number; height: number };

/** Web: lightweight menu anchored to the trigger — no dimmed modal, no Done chrome. */
function LocationScopeDropdown({
  visible,
  anchor,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  anchor: AnchorRect | null;
  options: ScopeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  useWebEscapeKey(onClose, visible);

  const styles = useThemedStyles(({ colors, spacing, elevation }) => ({
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    panel: {
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.xs + 2,
      borderRadius: 14,
      overflow: 'hidden' as const,
      backgroundColor: colors.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      ...elevation('floating'),
    },
  }));

  if (!visible || !anchor) return null;

  const MENU_MIN_WIDTH = 264;
  const EDGE_GUTTER = 12;
  const width = Math.min(Math.max(anchor.width, MENU_MIN_WIDTH), windowWidth - EDGE_GUTTER * 2);

  const left = Math.max(EDGE_GUTTER, Math.min(anchor.x, windowWidth - width - EDGE_GUTTER));
  const top = Math.max(EDGE_GUTTER, anchor.y + anchor.height + 6);
  const maxHeight = Math.min(400, windowHeight - top - EDGE_GUTTER);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      {/* Not role="button": option rows inside are buttons (no nested <button> on web). */}
      <Pressable style={styles.backdrop} onPress={onClose} accessible={false}>
        <Animated.View
          entering={DROPDOWN_ENTER}
          style={{ position: 'absolute', left, top, width }}>
          <Pressable accessible={false} onPress={(event) => event.stopPropagation()}>
            <View style={styles.panel}>
              <ScrollView
                style={{ maxHeight }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <ScopeOptionList
                  options={options}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    onSelect(id);
                    onClose();
                  }}
                  density="menu"
                />
              </ScrollView>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/**
 * Group clinics always view exactly one location. This pill sits under the page
 * title and switches it (dropdown on web, bottom sheet on native).
 */
export function ClinicLocationScopeSwitcher() {
  const { colors } = useTheme();
  const { isGroup, accessibleLocations, locationScope, setLocationScope } = useClinicProfile();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const triggerRef = useRef<View>(null);
  const isWeb = Platform.OS === 'web';

  const selectedLocation =
    accessibleLocations.find((location) => location.id === locationScope) ?? null;
  const label = getClinicLocationScopeLabel(locationScope, accessibleLocations);
  const selectedLogoUri = useClinicLogoUri(selectedLocation?.logo_storage_path ?? null);

  const options = useMemo<ScopeOption[]>(
    () =>
      accessibleLocations.map((location) => ({
        id: location.id,
        label: location.name,
        meta: [location.city, location.province].filter(Boolean).join(', ') || null,
        logoStoragePath: location.logo_storage_path,
      })),
    [accessibleLocations],
  );

  const styles = useThemedStyles(({ colors, spacing, radii, elevation }) => ({
    trigger: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      alignSelf: 'flex-start' as const,
      gap: 8,
      maxWidth: '100%' as const,
      paddingLeft: spacing.sm,
      paddingRight: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      ...elevation('subtle'),
      ...webPointer(),
    },
    triggerPressed: {
      opacity: 0.88,
    },
    label: {
      flexShrink: 1,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
  }));

  // A switcher with one choice is noise; single-site managers see nothing here.
  if (!isGroup || accessibleLocations.length < 2) return null;

  const openPicker = () => {
    if (isWeb && triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setAnchor({ x, y, width, height });
        setPickerOpen(true);
      });
      return;
    }
    setPickerOpen(true);
  };

  const handleSelect = (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocationScope(id);
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={`Viewing ${label}. Switch clinic.`}
        onPress={openPicker}
        style={({ pressed, hovered }) => [
          styles.trigger,
          webHover(hovered, pressed, webTextLinkHoverStyles(colors)),
          pressed && styles.triggerPressed,
        ]}>
        {selectedLocation ? (
          <ClinicLogoAvatar
            clinicName={selectedLocation.name}
            logoUri={selectedLogoUri}
            size={20}
          />
        ) : (
          <Ionicons name="business-outline" size={15} color={colors.labelSecondary} />
        )}
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.labelSecondary} />
      </Pressable>
      {isWeb ? (
        <LocationScopeDropdown
          visible={pickerOpen}
          anchor={anchor}
          options={options}
          selectedId={locationScope}
          onSelect={handleSelect}
          onClose={() => setPickerOpen(false)}
        />
      ) : (
        <LocationScopePickerSheet
          visible={pickerOpen}
          options={options}
          selectedId={locationScope}
          onSelect={handleSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
