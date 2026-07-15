import { Pressable, ScrollView, Text, View } from 'react-native';

import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useThemedStyles } from '@/theme';

/** Compact location scope switcher for group clinic dashboards and sidebars. */
export function ClinicLocationScopeSwitcher() {
  const {
    isGroup,
    accessibleLocations,
    locationScope,
    setLocationScope,
    isOwner,
  } = useClinicProfile();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.xs,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
      fontWeight: '600' as const,
    },
    row: {
      flexDirection: 'row' as const,
      gap: spacing.xs,
    },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    chipLabel: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelPrimary,
      fontWeight: '600' as const,
    },
    chipLabelSelected: {
      color: colors.primary,
    },
  }));

  if (!isGroup || accessibleLocations.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Viewing</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {isOwner || accessibleLocations.length > 1 ? (
          <Pressable
            style={[styles.chip, locationScope === 'all' && styles.chipSelected]}
            onPress={() => setLocationScope('all')}>
            <Text style={[styles.chipLabel, locationScope === 'all' && styles.chipLabelSelected]}>
              All locations
            </Text>
          </Pressable>
        ) : null}
        {accessibleLocations.map((location) => {
          const selected = locationScope === location.id;
          return (
            <Pressable
              key={location.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setLocationScope(location.id)}>
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                {location.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function getClinicLocationScopeLabel(
  locationScope: string,
  locations: { id: string; name: string }[],
): string {
  if (locationScope === 'all') return 'All locations';
  return locations.find((location) => location.id === locationScope)?.name ?? 'Selected location';
}
