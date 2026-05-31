import type { ConversationInboxFilter, ConversationFilterCounts } from '@/lib/conversationInbox';
import { CONVERSATION_INBOX_FILTERS } from '@/lib/conversationInbox';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type ConversationFilterBarProps = {
  selected: ConversationInboxFilter;
  counts: ConversationFilterCounts;
  onChange: (filter: ConversationInboxFilter) => void;
};

export function ConversationFilterBar({
  selected,
  counts,
  onChange,
}: ConversationFilterBarProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    content: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingRight: spacing.xs,
    },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    labelSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
    count: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.labelTertiary,
      minWidth: 14,
      textAlign: 'center',
    },
    countSelected: {
      color: colors.primary,
    },
  }));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.content}>
        {CONVERSATION_INBOX_FILTERS.map((option) => {
          const isSelected = selected === option.value;
          const count = counts[option.value];

          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(option.value);
              }}
              style={[styles.chip, isSelected && styles.chipSelected]}>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
              <Text style={[styles.count, isSelected && styles.countSelected]}>{count}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
