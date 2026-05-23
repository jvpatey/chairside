import { parseMapboxFeature, searchAddresses, type ParsedAddress } from '@chairside/api';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
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

export function AddressAutocomplete({ value, onChange }: AddressAutocompleteProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState(value.formatted || value.address_line1);
  const [suggestions, setSuggestions] = useState<{ id: string; label: string; parsed: ParsedAddress }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualMode, setManualMode] = useState(Boolean(value.address_line1 && !value.formatted));
  const [searchError, setSearchError] = useState<string | null>(null);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.md,
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
    },
    suggestionText: typography.body,
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
    if (manualMode || query.trim().length < 3) {
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
  }, [query, manualMode]);

  const applyParsed = (parsed: ParsedAddress) => {
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
  };

  return (
    <View style={styles.wrap}>
      {!manualMode ? (
        <>
          <AuthField
            label="Search address"
            placeholder="Start typing your clinic address"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="words"
          />
          {isSearching ? <ActivityIndicator color={colors.primary} /> : null}
          {searchError ? <Text style={styles.error}>{searchError}</Text> : null}
          {suggestions.length > 0 ? (
            <View style={styles.suggestions}>
              {suggestions.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  style={styles.suggestion}
                  onPress={() => item.parsed && applyParsed(item.parsed)}>
                  <Text style={styles.suggestionText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => setManualMode(true)}>
            <Text style={styles.link}>Enter address manually</Text>
          </Pressable>
        </>
      ) : (
        <>
          <AuthField
            label="Street address"
            placeholder="123 Main Street"
            value={value.address_line1}
            onChangeText={(address_line1) =>
              onChange({ ...value, address_line1, formatted: '', latitude: null, longitude: null })
            }
            autoCapitalize="words"
          />
          <AuthField
            label="City"
            placeholder="Halifax"
            value={value.city}
            onChangeText={(city) => onChange({ ...value, city, formatted: '', latitude: null, longitude: null })}
            autoCapitalize="words"
          />
          <AuthField
            label="Postal code"
            placeholder="B3H 1A1"
            value={value.postal_code}
            onChangeText={(postal_code) =>
              onChange({ ...value, postal_code, formatted: '', latitude: null, longitude: null })
            }
            autoCapitalize="characters"
          />
          <Pressable accessibilityRole="button" onPress={() => setManualMode(false)}>
            <Text style={styles.link}>Search with autocomplete</Text>
          </Pressable>
        </>
      )}

      <AuthField
        label="Suite or unit (optional)"
        placeholder="Suite 200"
        value={value.address_line2}
        onChangeText={(address_line2) => onChange({ ...value, address_line2 })}
        autoCapitalize="words"
      />

      {value.formatted ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Selected address</Text>
          <Text style={styles.previewText}>{value.formatted}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function createEmptyAddressValue(): AddressFormValue {
  return { ...emptyValue };
}
