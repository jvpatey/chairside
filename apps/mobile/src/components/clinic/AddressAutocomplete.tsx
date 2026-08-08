import { parseMapboxFeature, searchAddresses, type ParsedAddress } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, Text, TextInput, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import {
  formFieldInputRowFocusedStyle,
  formFieldInputRowStyle,
  formFieldInputStyle,
} from '@/theme/formFieldTokens';
import { useTheme, useThemedStyles } from '@/theme';

export type AddressFormValue = {
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  formatted: string;
};

type AddressAutocompleteProps = {
  value: AddressFormValue;
  onChange: (value: AddressFormValue) => void;
  required?: boolean;
  sectionIcon?: keyof typeof Ionicons.glyphMap;
  sectionLabel?: string;
};

const emptyValue: AddressFormValue = {
  address_line1: '',
  address_line2: '',
  city: '',
  province: 'NS',
  postal_code: '',
  latitude: null,
  longitude: null,
  formatted: '',
};

function shouldUseManualMode(value: AddressFormValue): boolean {
  return Boolean(value.address_line1.trim()) && !value.formatted.trim();
}

export function AddressAutocomplete({
  value,
  onChange,
  required = false,
  sectionIcon,
  sectionLabel = 'Address',
}: AddressAutocompleteProps) {
  const { colors } = useTheme();
  const useSectionLayout = Boolean(sectionIcon);
  const [query, setQuery] = useState(value.formatted || value.address_line1);
  const [suggestions, setSuggestions] = useState<{ id: string; label: string; parsed: ParsedAddress }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualMode, setManualMode] = useState(shouldUseManualMode(value));
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const suppressSearchRef = useRef(false);

  const isQueryCommitted =
    Boolean(value.formatted.trim()) && query.trim() === value.formatted.trim();

  useEffect(() => {
    setQuery(value.formatted || value.address_line1);
    setManualMode(shouldUseManualMode(value));
    setSuggestions([]);
    setSearchError(null);
  }, [
    value.address_line1,
    value.address_line2,
    value.city,
    value.postal_code,
    value.province,
    value.latitude,
    value.longitude,
    value.formatted,
  ]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: useSectionLayout ? spacing.sm : spacing.md,
    },
    sectionBody: {
      gap: spacing.sm,
    },
    inputRow: formFieldInputRowStyle({ colors, spacing, typography }),
    inputRowFocused: formFieldInputRowFocusedStyle({ colors, spacing, typography }),
    input: formFieldInputStyle({ colors, spacing, typography }),
    manualHint: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
    },
    manualLink: {
      fontWeight: '600',
      color: colors.primary,
    },
    suggestions: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    suggestion: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      ...webPointer(),
    },
    suggestionHovered: webListRowHoverStyles(colors),
    suggestionPressed: {
      opacity: 0.88,
    },
    suggestionText: typography.body,
    linkPressable: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      marginLeft: -spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    linkHovered: webTextLinkHoverStyles(colors),
    link: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    preview: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.xs,
    },
    previewLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    previewText: typography.body,
    error: {
      ...typography.subtitle,
      color: colors.destructive,
    },
  }));

  useEffect(() => {
    if (manualMode || suppressSearchRef.current || isQueryCommitted || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      setSearchError(null);
      void searchAddresses(query)
        .then((results) => {
          setSuggestions(
            results
              .map((item) => ({
                id: item.id,
                label: item.label,
                parsed: parseMapboxFeature(item.feature),
              })),
          );
        })
        .catch(() => setSearchError('Could not search addresses. Try manual entry.'))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, manualMode, isQueryCommitted]);

  const handleQueryChange = (text: string) => {
    suppressSearchRef.current = false;
    setQuery(text);

    if (value.formatted.trim() && text.trim() !== value.formatted.trim()) {
      onChange({
        ...value,
        formatted: '',
        latitude: null,
        longitude: null,
      });
    }
  };

  const applyParsed = (parsed: ParsedAddress) => {
    suppressSearchRef.current = true;
    onChange({
      address_line1: parsed.address_line1,
      address_line2: value.address_line2,
      city: parsed.city,
      province: parsed.province || 'NS',
      postal_code: parsed.postal_code,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      formatted: parsed.formatted,
    });
    setQuery(parsed.formatted);
    setSuggestions([]);
    setManualMode(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.wrap}>
      {useSectionLayout ? (
        <FormSectionHeader icon={sectionIcon!} label={sectionLabel} required={required} />
      ) : null}

      {!manualMode ? (
        <View style={styles.sectionBody}>
          {useSectionLayout ? (
            <View
              style={[
                styles.inputRow,
                isSearchFocused && styles.inputRowFocused,
              ]}>
              <TextInput
                style={styles.input}
                placeholder="Start typing your address"
                placeholderTextColor={colors.labelTertiary}
                value={query}
                onChangeText={handleQueryChange}
                autoCapitalize="words"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                accessibilityLabel={sectionLabel}
              />
            </View>
          ) : (
            <AuthField
              label="Search address"
              placeholder="Search for your address"
              value={query}
              onChangeText={handleQueryChange}
              autoCapitalize="words"
              required={required}
            />
          )}
          {isSearching ? <ActivityIndicator color={colors.primary} /> : null}
          {searchError ? <Text style={styles.error}>{searchError}</Text> : null}
          {suggestions.length > 0 ? (
            <View style={styles.suggestions}>
              {suggestions.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  style={({ pressed, hovered }) => [
                    styles.suggestion,
                    webHover(hovered, pressed, styles.suggestionHovered),
                    pressed && styles.suggestionPressed,
                  ]}
                  onPress={() => item.parsed && applyParsed(item.parsed)}>
                  <Text style={styles.suggestionText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enter address manually"
            onPress={() => setManualMode(true)}
            style={({ pressed, hovered }) => [
              styles.linkPressable,
              webHover(hovered, pressed, styles.linkHovered),
              pressed && { opacity: 0.75 },
            ]}>
            {useSectionLayout ? (
              <Text style={styles.manualHint}>
                Can&apos;t find it?{' '}
                <Text style={styles.manualLink}>Enter manually</Text>
              </Text>
            ) : (
              <Text style={styles.link}>Enter address manually</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.sectionBody}>
          <AuthField
            label="Street address"
            placeholder="Street address"
            value={value.address_line1}
            onChangeText={(address_line1) =>
              onChange({ ...value, address_line1, formatted: '', latitude: null, longitude: null })
            }
            autoCapitalize="words"
            required={required}
          />
          <AuthField
            label="City"
            placeholder="City"
            value={value.city}
            onChangeText={(city) => onChange({ ...value, city, formatted: '', latitude: null, longitude: null })}
            autoCapitalize="words"
            required={required}
          />
          <AuthField
            label="Postal code"
            placeholder="Postal code"
            value={value.postal_code}
            onChangeText={(postal_code) =>
              onChange({ ...value, postal_code, formatted: '', latitude: null, longitude: null })
            }
            autoCapitalize="characters"
            required={required}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setManualMode(false)}
            style={({ pressed, hovered }) => [
              styles.linkPressable,
              webHover(hovered, pressed, styles.linkHovered),
              pressed && { opacity: 0.75 },
            ]}>
            {useSectionLayout ? (
              <Text style={styles.manualHint}>
                Prefer search?{' '}
                <Text style={styles.manualLink}>Look up your address</Text>
              </Text>
            ) : (
              <Text style={styles.link}>Search with autocomplete</Text>
            )}
          </Pressable>
        </View>
      )}

      <AuthField
        label="Suite or unit"
        placeholder="Unit or suite"
        value={value.address_line2}
        onChangeText={(address_line2) => onChange({ ...value, address_line2 })}
        autoCapitalize="words"
      />

      {!useSectionLayout && value.formatted ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Selected address</Text>
          <Text style={styles.previewText}>{value.formatted}</Text>
        </View>
      ) : !useSectionLayout && manualMode && value.address_line1.trim() ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Saved address</Text>
          <Text style={styles.previewText}>
            {[value.address_line1, value.city, value.postal_code].filter(Boolean).join(', ')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function createEmptyAddressValue(): AddressFormValue {
  return { ...emptyValue };
}
