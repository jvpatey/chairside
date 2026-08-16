import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useRef, useState, type ReactNode } from 'react';
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
  /** Placed before the sidebar trigger (e.g. collapse chevron). */
  startAccessory?: ReactNode;
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
  meta: string | null;
  logoStoragePath: string | null;
  isAll: boolean;
};

const DROPDOWN_ENTER = FadeInDown.duration(160).easing(Easing.out(Easing.cubic));

function AllLocationsGlyph({ size }: { size: number }) {
  const styles = useThemedStyles(({ colors }) => ({
    wrap: {
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.fillSubtle,
    },
  }));
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Ionicons
        name="business-outline"
        size={Math.round(size * 0.5)}
        color={colors.labelSecondary}
      />
    </View>
  );
}

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
  const logoUri = useClinicLogoUri(option.isAll ? null : option.logoStoragePath);
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
      {option.isAll ? (
        <AllLocationsGlyph size={avatarSize} />
      ) : (
        <ClinicLogoAvatar clinicName={option.label} logoUri={logoUri} size={avatarSize} />
      )}
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
  const styles = useThemedStyles(({ colors, spacing }) => ({
    list: {
      gap: density === 'sheet' ? spacing.xs : 2,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginVertical: spacing.xs,
      marginHorizontal: density === 'sheet' ? 0 : spacing.xs,
    },
  }));

  const allOption = options.find((option) => option.isAll) ?? null;
  const locationOptions = options.filter((option) => !option.isAll);

  return (
    <View style={styles.list}>
      {allOption ? (
        <LocationScopeOptionRow
          option={allOption}
          selected={allOption.id === selectedId}
          onPress={() => onSelect(allOption.id)}
          density={density}
        />
      ) : null}
      {allOption && locationOptions.length > 0 ? <View style={styles.divider} /> : null}
      {locationOptions.map((option) => (
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
  placement,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  anchor: AnchorRect | null;
  /** 'below' anchors under the trigger; 'side' opens beside the collapsed rail. */
  placement: 'below' | 'side';
  options: ScopeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  useWebEscapeKey(onClose, visible);

  const styles = useThemedStyles(({ spacing }) => ({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    panel: {
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.xs + 2,
    },
  }));

  if (!visible || !anchor) return null;

  const MENU_MIN_WIDTH = 264;
  const EDGE_GUTTER = 12;
  const width = Math.min(Math.max(anchor.width, MENU_MIN_WIDTH), windowWidth - EDGE_GUTTER * 2);

  let left = placement === 'side' ? anchor.x + anchor.width + 10 : anchor.x;
  let top = placement === 'side' ? anchor.y : anchor.y + anchor.height + 6;
  left = Math.max(EDGE_GUTTER, Math.min(left, windowWidth - width - EDGE_GUTTER));
  top = Math.max(EDGE_GUTTER, top);
  const maxHeight = Math.min(400, windowHeight - top - EDGE_GUTTER);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close location menu">
        <Animated.View
          entering={DROPDOWN_ENTER}
          style={{ position: 'absolute', left, top, width }}>
          <Pressable onPress={(event) => event.stopPropagation()}>
            <LiquidGlassSurface borderRadius={14} style={styles.panel}>
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
            </LiquidGlassSurface>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/** Compact location-scope trigger with platform-native picker for group clinics. */
export function ClinicLocationScopeSwitcher({
  variant = 'sidebar',
  collapsed = false,
  startAccessory,
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
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const triggerRef = useRef<View>(null);
  const isWeb = Platform.OS === 'web';

  const showAllOption = isOwner || accessibleLocations.length > 1;
  const allLocationsLabel = getClinicAllLocationsLabel(isOwner);
  const label = getClinicLocationScopeLabel(
    locationScope,
    accessibleLocations,
    isOwner,
  );

  const selectedLocation =
    locationScope === 'all'
      ? null
      : accessibleLocations.find((location) => location.id === locationScope) ?? null;
  const selectedLogoUri = useClinicLogoUri(selectedLocation?.logo_storage_path ?? null);

  const options = useMemo(() => {
    const next: ScopeOption[] = [];
    if (showAllOption) {
      next.push({
        id: 'all',
        label: allLocationsLabel,
        meta:
          accessibleLocations.length > 1
            ? `${accessibleLocations.length} clinics`
            : null,
        logoStoragePath: null,
        isAll: true,
      });
    }
    for (const location of accessibleLocations) {
      next.push({
        id: location.id,
        label: location.name,
        meta: [location.city, location.province].filter(Boolean).join(', ') || null,
        logoStoragePath: location.logo_storage_path,
        isAll: false,
      });
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
      gap: spacing.xs + 2,
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
      gap: 6,
      maxWidth: '100%' as const,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
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
    setLocationScope(id === 'all' ? 'all' : id);
  };

  const accessibilityLabel = `Viewing ${label}. Change location.`;

  const triggerGlyph = selectedLocation ? (
    <ClinicLogoAvatar
      clinicName={selectedLocation.name}
      logoUri={selectedLogoUri}
      size={20}
    />
  ) : (
    <Ionicons name="business-outline" size={15} color={colors.labelSecondary} />
  );

  const trigger =
    variant === 'hero' ? (
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={openPicker}
        style={({ pressed, hovered }) => [
          styles.heroTrigger,
          webHover(hovered, pressed, webTextLinkHoverStyles(colors)),
          pressed && styles.heroTriggerPressed,
        ]}>
        {selectedLocation ? (
          <ClinicLogoAvatar
            clinicName={selectedLocation.name}
            logoUri={selectedLogoUri}
            size={16}
          />
        ) : (
          <Ionicons name="business-outline" size={13} color={colors.labelSecondary} />
        )}
        <Text style={styles.heroLabel} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.labelSecondary} />
      </Pressable>
    ) : collapsed ? (
      <View style={styles.collapsedWrap}>
        {startAccessory}
        <Pressable
          ref={triggerRef}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={openPicker}
          style={({ pressed, hovered }) => [
            styles.collapsedTrigger,
            webHover(hovered, pressed, webTextLinkHoverStyles(colors)),
            pressed && styles.collapsedTriggerPressed,
          ]}>
          {selectedLocation ? (
            <ClinicLogoAvatar
              clinicName={selectedLocation.name}
              logoUri={selectedLogoUri}
              size={22}
            />
          ) : (
            <Ionicons name="business-outline" size={16} color={colors.labelPrimary} />
          )}
        </Pressable>
      </View>
    ) : (
      <View style={styles.sidebarWrap}>
        <Text style={styles.sidebarEyebrow}>Viewing</Text>
        <View style={styles.sidebarTriggerRow}>
          {startAccessory}
          <Pressable
            ref={triggerRef}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={openPicker}
            style={({ pressed, hovered }) => [
              styles.sidebarTrigger,
              webHover(hovered, pressed, webTextLinkHoverStyles(colors)),
              pressed && styles.sidebarTriggerPressed,
            ]}>
            {triggerGlyph}
            <Text style={styles.sidebarLabel} numberOfLines={1}>
              {label}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.labelSecondary} />
          </Pressable>
        </View>
      </View>
    );

  const selectedId = locationScope === 'all' ? 'all' : locationScope;

  return (
    <>
      {trigger}
      {isWeb ? (
        <LocationScopeDropdown
          visible={pickerOpen}
          anchor={anchor}
          placement={variant === 'sidebar' && collapsed ? 'side' : 'below'}
          options={options}
          selectedId={selectedId}
          onSelect={handleSelect}
          onClose={() => setPickerOpen(false)}
        />
      ) : (
        <LocationScopePickerSheet
          visible={pickerOpen}
          options={options}
          selectedId={selectedId}
          onSelect={handleSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
