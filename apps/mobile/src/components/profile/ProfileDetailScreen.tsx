import { createContext, ReactNode, useContext, useRef } from 'react';
import { Platform, Pressable, ScrollView, Text, View, type View as ViewType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageHeroGlow } from '@/components/ui/PageHeroGlow';
import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import { EditPillButton } from '@/components/ui/EditPillButton';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useShellAtmosphere, useTabAtmosphere, useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ProfileDetailScrollContextValue = {
  scrollRef: React.RefObject<ScrollView | null>;
  scrollContentRef: React.RefObject<ViewType | null>;
};

const ProfileDetailScrollContext = createContext<ProfileDetailScrollContextValue | null>(null);

export function useProfileDetailScroll() {
  return useContext(ProfileDetailScrollContext);
}

type ProfileDetailScreenProps = {
  title?: string;
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
  const scrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<ViewType>(null);
  const insets = useSafeAreaInsets();
  const tabDockInset = useMobileTabDockInset();
  const { contentMaxWidth } = useResponsiveLayout();
  const { colors } = useTheme();
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const shellAtmosphere = useShellAtmosphere();
  const showAtmosphere = tabAtmosphere !== 'none' && !shellAtmosphere;
  const passThroughAtmosphere = showAtmosphere || shellAtmosphere;
  const atmosphereLayer =
    showAtmosphere && Platform.OS === 'web' ? (
      <PageHeroGlow variant="subtle" accent={tabAtmosphereAccent} />
    ) : null;
  const containerBackground = passThroughAtmosphere ? 'transparent' : colors.backgroundGrouped;

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    container: {
      flex: 1,
      overflow: 'hidden',
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      width: '100%',
      ...(contentMaxWidth
        ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const }
        : {}),
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
      borderRadius: radii.sm,
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
    <ProfileDetailScrollContext.Provider value={{ scrollRef, scrollContentRef }}>
    <View style={[styles.container, { backgroundColor: containerBackground }]}>
      {atmosphereLayer}
      <ScrollView
        ref={scrollRef}
        style={[
          {
            flex: 1,
            backgroundColor: passThroughAtmosphere ? 'transparent' : colors.backgroundGrouped,
          },
          webScrollbarStyles(),
        ]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom:
              24 + (tabDockInset > 0 ? tabDockInset : insets.bottom),
          },
        ]}>
        <WebPageEnter>
          <View ref={scrollContentRef}>
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
            {title || subtitle || (actionLabel && onActionPress) ? (
              <View style={styles.titleRow}>
                <View style={styles.titleBlock}>
                  {title ? <Text style={styles.title}>{title}</Text> : null}
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
            ) : null}
            </View>
            <View style={styles.body}>{children}</View>
          </View>
        </WebPageEnter>
      </ScrollView>
    </View>
    </ProfileDetailScrollContext.Provider>
  );
}
