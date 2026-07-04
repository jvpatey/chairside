import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  CONVERSATION_INBOX_FILTERS,
  type ConversationFilterCounts,
  type ConversationInboxFilter,
} from '@/lib/conversationInbox';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type ConversationInboxFiltersProps = {
  selected: ConversationInboxFilter;
  counts: ConversationFilterCounts;
  onChange: (filter: ConversationInboxFilter) => void;
};

function shouldShowFilter(value: ConversationInboxFilter, counts: ConversationFilterCounts): boolean {
  if (value === 'all' || value === 'unread') return true;
  return counts[value] > 0;
}

export function ConversationInboxFilters({
  selected,
  counts,
  onChange,
}: ConversationInboxFiltersProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingRight: spacing.xs,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 34,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    chipActive: {
      backgroundColor: colors.primary,
    },
    chipPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    chipHovered: {
      backgroundColor: colors.surface,
    },
    chipActiveHovered: {
      opacity: 0.94,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
      letterSpacing: -0.1,
    },
    labelActive: {
      color: colors.primaryOnPrimary,
    },
    count: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.separator,
    },
    countActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    countText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.labelTertiary,
    },
    countTextActive: {
      color: colors.primaryOnPrimary,
    },
  }));

  const visibleFilters = CONVERSATION_INBOX_FILTERS.filter((option) =>
    shouldShowFilter(option.value, counts),
  );

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {visibleFilters.map((option) => {
        const active = selected === option.value;
        const count = counts[option.value];

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${option.label}, ${count} conversations`}
            onPress={() => onChange(option.value)}
            style={({ pressed, hovered }) => [
              styles.chip,
              active && styles.chipActive,
              !active && webHover(hovered, pressed, styles.chipHovered),
              active && webHover(hovered, pressed, styles.chipActiveHovered),
              pressed && styles.chipPressed,
            ]}>
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
            {count > 0 ? (
              <View style={[styles.count, active && styles.countActive]}>
                <Text style={[styles.countText, active && styles.countTextActive]}>{count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
