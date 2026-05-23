import { Ionicons } from '@expo/vector-icons';
import { OFFERING_PRESET_OPTIONS, type OfferingPreset } from '@chairside/config';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { useTheme, useThemedStyles } from '@/theme';

type OfferingsInputProps = {
  onChange: (offerings: string[]) => void;
};

function hasOffering(items: string[], label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return items.some((item) => item.trim().toLowerCase() === normalized);
}

function withoutOffering(items: string[], label: string): string[] {
  const normalized = label.trim().toLowerCase();
  return items.filter((item) => item.trim().toLowerCase() !== normalized);
}

export function OfferingsInput({ onChange }: OfferingsInputProps) {
  const { colors } = useTheme();
  const [items, setItems] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  const selectedPresets = useMemo(
    () =>
      OFFERING_PRESET_OPTIONS.filter((preset) => hasOffering(items, preset.label)).map(
        (preset) => preset.value,
      ),
    [items],
  );

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.md,
    },
    section: {
      gap: spacing.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    list: {
      gap: spacing.sm,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    bullet: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '700',
      lineHeight: 22,
    },
    itemText: {
      ...typography.body,
      flex: 1,
      lineHeight: 22,
    },
    removeButton: {
      padding: spacing.xs,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: typography.body.fontSize,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.labelPrimary,
      minHeight: 50,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      minHeight: 50,
      justifyContent: 'center',
    },
    addButtonDisabled: {
      opacity: 0.45,
    },
    addButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryOnPrimary,
    },
    empty: {
      ...typography.subtitle,
      fontSize: 13,
      fontStyle: 'italic',
    },
  }));

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const addCustomItem = () => {
    const trimmed = draft.trim();
    if (!trimmed || hasOffering(items, trimmed)) {
      setDraft('');
      return;
    }

    setItems((current) => [...current, trimmed]);
    setDraft('');
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handlePresetChange = (value: string | string[]) => {
    const nextPresets = value as OfferingPreset[];
    const previousPresets = selectedPresets;

    setItems((current) => {
      let nextItems = [...current];

      for (const presetValue of nextPresets) {
        if (previousPresets.includes(presetValue)) continue;
        const preset = OFFERING_PRESET_OPTIONS.find((option) => option.value === presetValue);
        if (preset && !hasOffering(nextItems, preset.label)) {
          nextItems.push(preset.label);
        }
      }

      for (const presetValue of previousPresets) {
        if (nextPresets.includes(presetValue)) continue;
        const preset = OFFERING_PRESET_OPTIONS.find((option) => option.value === presetValue);
        if (preset) {
          nextItems = withoutOffering(nextItems, preset.label);
        }
      }

      return nextItems;
    });
  };

  const canAdd = draft.trim().length > 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Perks & offerings (optional)</Text>

      <View style={styles.section}>
        <ChipSelector
          options={OFFERING_PRESET_OPTIONS.map((preset) => ({
            value: preset.value,
            label: preset.label,
          }))}
          selected={selectedPresets}
          multiple
          onChange={handlePresetChange}
        />
      </View>

      {items.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.label}>Selected perks</Text>
          <View style={styles.list}>
            {items.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.itemRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.itemText}>{item}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item}`}
                  hitSlop={8}
                  onPress={() => removeItem(index)}
                  style={styles.removeButton}>
                  <Ionicons name="close-circle" size={20} color={colors.labelTertiary} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text style={styles.empty}>No perks added yet.</Text>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Custom perk</Text>
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sterilization float"
            placeholderTextColor={colors.labelTertiary}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={addCustomItem}
            returnKeyType="done"
            blurOnSubmit={false}
            autoCapitalize="sentences"
            accessibilityLabel="Custom perk"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add custom perk"
            disabled={!canAdd}
            onPress={addCustomItem}
            style={[styles.addButton, !canAdd && styles.addButtonDisabled]}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
