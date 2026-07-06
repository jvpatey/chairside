import { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useTabAtmosphere, useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { WEB_SIDEBAR_OUTER_INSET } from '@/lib/breakpoints';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { webTypography } from '@/theme/web';

type ScreenProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  showHeader?: boolean;
  showNotifications?: boolean;
  onBack?: () => void;
  backLabel?: string;
  headerAccessory?: ReactNode;
  constrainWidth?: boolean;
  scroll?: boolean;
  scrollEnabled?: boolean;
  fillsContainer?: boolean;
  animateEntry?: boolean;
  transparentBackground?: boolean;
  /** When true, skip the tab atmosphere layer (e.g. master/detail panes paint their own). */
  hideAtmosphere?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/** Web Screen with sticky header and refined typography. */
export function Screen({
  title,
  subtitle,
  children,
  showHeader = true,
  showNotifications = true,
  onBack,
  backLabel = 'Back',
  headerAccessory,
  constrainWidth = true,
  scroll = true,
  scrollEnabled = true,
  fillsContainer = false,
  animateEntry = true,
  transparentBackground = false,
  hideAtmosphere = false,
  contentContainerStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const { contentMaxWidth, isTablet } = useResponsiveLayout();
  const tabDockInset = useMobileTabDockInset();
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const showAtmosphere = tabAtmosphere !== 'none' && !hideAtmosphere;
  const atmosphereLayer =
    showAtmosphere && Platform.OS === 'web' ? (
      <AppAtmosphere intensity={tabAtmosphere} accent={tabAtmosphereAccent} />
    ) : null;
  const containerBackground =
    showAtmosphere || transparentBackground ? 'transparent' : colors.backgroundGrouped;
  const showTopBar = showHeader || showNotifications || Boolean(headerAccessory);
  const topPadding =
    isTablet && !showHeader ? WEB_SIDEBAR_OUTER_INSET : insets.top + 16;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    container: {
      flex: 1,
      overflow: 'hidden',
    },
    stickyHeader: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
      paddingTop: insets.top + spacing.sm,
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: 'transparent',
    },
    stickyInner: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
      width: '100%' as const,
      maxWidth: constrainWidth ? contentMaxWidth : undefined,
      alignSelf: 'center' as const,
    },
    content: {
      flexGrow: fillsContainer ? 1 : undefined,
      paddingHorizontal: spacing.lg,
      width: '100%',
      ...(constrainWidth && contentMaxWidth
        ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const }
        : {}),
    },
    contentFill: {
      flex: 1,
      minHeight: 0,
      flexDirection: 'column',
    },
    body: {
      flex: fillsContainer ? 1 : undefined,
      minHeight: fillsContainer ? 0 : undefined,
      width: fillsContainer ? '100%' : undefined,
      flexDirection: fillsContainer ? ('column' as const) : undefined,
    },
    headerText: { flex: 1, minWidth: 0, gap: spacing.xs },
    title: {
      ...webTypography.title,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...webTypography.subtitle,
      fontSize: 15,
      color: colors.labelSecondary,
    },
    headerActions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      flexShrink: 0,
    },
    back: {
      alignSelf: 'flex-start' as const,
      paddingVertical: spacing.xs,
      minHeight: 44,
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.xs,
      marginLeft: -spacing.xs,
      marginBottom: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    backHovered: webTextLinkHoverStyles(colors),
    backText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.primary,
    },
  }));

  const paddingStyle = {
    paddingTop: showTopBar && scroll ? spacing.md : topPadding,
    paddingBottom: spacing.lg + tabDockInset,
  };

  const headerBlock = showTopBar ? (
    <View style={styles.stickyHeader}>
      <View style={styles.stickyInner}>
        <View style={styles.headerText}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={backLabel}
              onPress={onBack}
              style={({ pressed, hovered }) => [
                styles.back,
                webHover(hovered, pressed, styles.backHovered),
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={styles.backText}>{backLabel}</Text>
            </Pressable>
          ) : null}
          {showHeader && title ? <Text style={styles.title}>{title}</Text> : null}
          {showHeader && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {headerAccessory || showNotifications ? (
          <View style={styles.headerActions}>
            {headerAccessory}
            {showNotifications ? <NotificationBell /> : null}
          </View>
        ) : null}
      </View>
    </View>
  ) : null;

  if (!scroll) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: containerBackground },
          fillsContainer && { minHeight: 0 },
        ]}
      >
        {atmosphereLayer}
        {headerBlock}
        <WebPageEnter
          animate={animateEntry}
          style={fillsContainer ? { flex: 1, minHeight: 0 } : { flex: 1 }}
        >
          <View
            style={[
              styles.content,
              paddingStyle,
              fillsContainer && styles.contentFill,
              contentContainerStyle,
            ]}
          >
            <View style={styles.body}>{children}</View>
          </View>
        </WebPageEnter>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: containerBackground }]}>
      {atmosphereLayer}
      {headerBlock}
      <ScrollView
        scrollEnabled={scrollEnabled}
        style={[
          { flex: 1, backgroundColor: showAtmosphere ? 'transparent' : colors.backgroundGrouped },
          webScrollbarStyles(),
        ]}
        contentContainerStyle={[styles.content, paddingStyle, contentContainerStyle]}
        stickyHeaderIndices={undefined}
      >
        <WebPageEnter animate={animateEntry}>{children}</WebPageEnter>
      </ScrollView>
    </View>
  );
}
