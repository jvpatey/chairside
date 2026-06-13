import { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { EditPillButton } from '@/components/ui/EditPillButton';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
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
  const insets = useSafeAreaInsets();
  const tabDockInset = useMobileTabDockInset();
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      overflow: 'hidden',
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
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.xs,
      marginLeft: -spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    backHovered: webTextLinkHoverStyles(colors),
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
      minWidth: 0,
    },
    title: {
      ...typography.title,
      fontSize: 28,
    },
    subtitle: typography.subtitle,
    titleAction: {
      marginTop: 2,
    },
    body: {
      gap: spacing.lg,
    },
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundGrouped }]}>
      <AppAtmosphere intensity="subtle" />
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom:
              24 + (tabDockInset > 0 ? tabDockInset : insets.bottom),
          },
        ]}>
        <WebPageEnter>
          <View style={styles.header}>
            <View style={styles.topRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={onBack}
                style={({ pressed, hovered }) => [
                  styles.back,
                  webHover(hovered, pressed, styles.backHovered),
                  pressed && { opacity: 0.75 },
                ]}>
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
                <EditPillButton
                  label={actionLabel}
                  onPress={onActionPress}
                  style={styles.titleAction}
                />
              ) : null}
            </View>
          </View>
          <View style={styles.body}>{children}</View>
        </WebPageEnter>
      </ScrollView>
    </View>
  );
}
