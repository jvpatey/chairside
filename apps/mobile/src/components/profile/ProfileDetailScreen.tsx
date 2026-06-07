import { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useTheme, useThemedStyles } from '@/theme';

type ProfileDetailScreenProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
  headerRight?: ReactNode;
  children?: ReactNode;
};

export function ProfileDetailScreen({
  title,
  subtitle,
  onBack,
  actionLabel,
  onActionPress,
  headerRight,
  children,
}: ProfileDetailScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    back: {
      paddingVertical: spacing.xs,
      minHeight: 44,
      justifyContent: 'center',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    backText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    titleBlock: {
      flex: 1,
      gap: spacing.sm,
    },
    title: {
      ...typography.title,
      fontSize: 28,
    },
    subtitle: typography.subtitle,
    action: {
      paddingTop: spacing.xs + 2,
      paddingVertical: spacing.xs,
    },
    actionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    body: {
      gap: spacing.lg,
    },
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}>
      <WebPageEnter>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              style={styles.back}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            {headerRight}
          </View>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {actionLabel && onActionPress ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                style={styles.action}
                onPress={onActionPress}>
                <Text style={styles.actionLabel}>{actionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={styles.body}>{children}</View>
      </WebPageEnter>
    </ScrollView>
  );
}
