import { createContext, ReactNode, useContext, useRef } from 'react';
import { ScrollView, View, type View as ViewType } from 'react-native';

import { EditPillButton } from '@/components/ui/EditPillButton';
import { FormScreen } from '@/components/ui/FormScreen';
import { Screen } from '@/components/ui/Screen';
import type { PageHeroGlowVariant } from '@/components/ui/PageHeroGlow';
import type { GradientAccent } from '@/theme';

type DetailScrollContextValue = {
  scrollRef: React.RefObject<ScrollView | null>;
  scrollContentRef: React.RefObject<ViewType | null>;
};

const DetailScrollContext = createContext<DetailScrollContextValue | null>(null);

/** @deprecated Use useDetailScroll */
export function useProfileDetailScroll() {
  return useDetailScroll();
}

export function useDetailScroll() {
  return useContext(DetailScrollContext);
}

type DetailScreenProps = {
  title?: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  headerRight?: ReactNode;
  headerAccessory?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  showNotifications?: boolean;
  /** When set, uses FormScreen for sticky footer + keyboard handling. */
  atmosphere?: PageHeroGlowVariant | 'none';
  accent?: GradientAccent;
};

/**
 * Authenticated detail/settings shell — Screen chrome with required back navigation.
 * Uses FormScreen when a sticky footer is provided.
 */
export function DetailScreen({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  actionLabel,
  onActionPress,
  headerRight,
  headerAccessory,
  children,
  footer,
  showNotifications = false,
  atmosphere = 'none',
  accent = 'primary',
}: DetailScreenProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<ViewType>(null);

  const titleAction =
    headerAccessory ??
    (actionLabel && onActionPress ? (
      <EditPillButton label={actionLabel} onPress={onActionPress} />
    ) : null);

  const headerAccessoryNode = (
    <>
      {headerRight}
      {titleAction}
    </>
  );

  if (footer) {
    return (
      <FormScreen
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        backLabel={backLabel}
        headerAccessory={headerAccessoryNode || undefined}
        footer={footer}
        transparentBackground
        atmosphere={atmosphere === 'none' ? 'none' : atmosphere}
        atmosphereAccent={accent}
        accent={accent}
        constrainFormWidth={false}
      >
        {children}
      </FormScreen>
    );
  }

  return (
    <DetailScrollContext.Provider value={{ scrollRef, scrollContentRef }}>
      <Screen
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        backLabel={backLabel}
        showNotifications={showNotifications}
        headerAccessory={headerAccessoryNode || undefined}
        scrollRef={scrollRef}
        scrollContentRef={scrollContentRef}
      >
        <View ref={scrollContentRef}>{children}</View>
      </Screen>
    </DetailScrollContext.Provider>
  );
}
