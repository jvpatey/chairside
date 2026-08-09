import {
  buildSoftwareUsedFromParts,
  matchStandardSoftwareOption,
  normalizeCustomSoftwareLabel,
  parseCustomSoftwareInput,
  resolveSoftwareSelection,
  SOFTWARE_NONE_OPTION,
  SOFTWARE_OPTIONS,
  SOFTWARE_OTHER_OPTION,
  splitSoftwareUsed,
} from '@chairside/config';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type SoftwareUsedSelectorProps = {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  required?: boolean;
  showValidation?: boolean;
};

export function SoftwareUsedSelector({
  value,
  onChange,
  label = 'Software used',
  icon = 'desktop-outline',
  required = false,
  showValidation = false,
}: SoftwareUsedSelectorProps) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');
  // "Other" only opens the composer; confirmed entries become their own chips.
  const [composerOpen, setComposerOpen] = useState(false);

  const { presetChips, customSoftware } = useMemo(() => {
    const split = splitSoftwareUsed(value);
    return {
      presetChips: split.chipSelection.filter((item) => item !== SOFTWARE_OTHER_OPTION),
      customSoftware: split.customSoftware,
    };
  }, [value]);

  const presetSelection = composerOpen ? [...presetChips, SOFTWARE_OTHER_OPTION] : presetChips;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    section: { gap: spacing.sm },
    hint: typography.subtitle,
    composer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
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
      minHeight: 50,
      justifyContent: 'center' as const,
    },
    addButtonHovered: { opacity: 0.92 },
    addButtonDisabled: { opacity: 0.45 },
    addButtonText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.primaryOnPrimary,
    },
  }));

  const emit = (chips: string[], customEntries: string[]) => {
    onChange(buildSoftwareUsedFromParts(chips, customEntries));
  };

  const handlePresetChange = (next: string[]) => {
    const resolved = resolveSoftwareSelection(presetSelection, next);

    if (resolved.includes(SOFTWARE_NONE_OPTION)) {
      setComposerOpen(false);
      setDraft('');
      onChange([SOFTWARE_NONE_OPTION]);
      return;
    }

    const wantsComposer = resolved.includes(SOFTWARE_OTHER_OPTION);
    setComposerOpen(wantsComposer);
    if (!wantsComposer) setDraft('');
    emit(resolved, customSoftware);
  };

  const handleCustomChange = (next: string[]) => {
    emit(presetChips, next);
  };

  const commitDraft = () => {
    const entries = parseCustomSoftwareInput(draft);
    setDraft('');
    setComposerOpen(false);

    if (entries.length === 0) return;

    const nextPresets = [...presetChips];
    const nextCustom = [...customSoftware];

    for (const entry of entries) {
      const preset = matchStandardSoftwareOption(entry);
      if (preset) {
        if (!nextPresets.includes(preset)) nextPresets.push(preset);
        continue;
      }
      const entryLabel = normalizeCustomSoftwareLabel(entry);
      const duplicate = nextCustom.some((item) => item.toLowerCase() === entryLabel.toLowerCase());
      if (!duplicate) nextCustom.push(entryLabel);
    }

    emit(nextPresets, nextCustom);
  };

  const canAdd = draft.trim().length > 0;

  return (
    <View style={styles.section}>
      <FormSectionHeader icon={icon} label={label} required={required} />
      <ChipSelector
        options={SOFTWARE_OPTIONS.map((item) => ({ value: item, label: item }))}
        selected={presetSelection}
        multiple
        onChange={(next) => handlePresetChange(next as string[])}
      />
      {composerOpen ? (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Dentrix Ascend"
            placeholderTextColor={colors.labelTertiary}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={commitDraft}
            onBlur={commitDraft}
            returnKeyType="done"
            blurOnSubmit={false}
            autoCapitalize="words"
            autoFocus
            accessibilityLabel="Other software name"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add software"
            disabled={!canAdd}
            onPress={commitDraft}
            style={({ pressed, hovered }) => [
              styles.addButton,
              canAdd && webPointer(),
              canAdd && webHover(hovered, pressed, styles.addButtonHovered),
              !canAdd && styles.addButtonDisabled,
            ]}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      ) : customSoftware.length > 0 ? (
        <ChipSelector
          options={customSoftware.map((item) => ({ value: item, label: item }))}
          selected={customSoftware}
          multiple
          onChange={(next) => handleCustomChange(next as string[])}
        />
      ) : null}
      {showValidation && value.length === 0 ? (
        <Text style={styles.hint}>Select at least one software system.</Text>
      ) : null}
    </View>
  );
}
