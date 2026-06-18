import { type Href } from 'expo-router';
import { View } from 'react-native';

import { DashboardHeroActions } from '@/components/dashboard/DashboardHeroActions';
import {
  DASHBOARD_HERO_TEXT_GAP,
  DashboardHeroGreeting,
  DashboardHeroName,
  DashboardHeroSubtitle,
} from '@/components/dashboard/DashboardHeroIdentity';

type DashboardHeroCardProps = {
  profileHref: Href;
  avatarKind: 'worker' | 'clinic';
  displayName?: string | null;
  photoUri?: string | null;
  namePlaceholder: string;
  subtitle: string;
  showActions?: boolean;
};

export function DashboardHeroCard({
  profileHref,
  avatarKind,
  displayName,
  photoUri,
  namePlaceholder,
  subtitle,
  showActions = true,
}: DashboardHeroCardProps) {
  const identity = (
    <View style={{ gap: DASHBOARD_HERO_TEXT_GAP, minWidth: 0, paddingTop: DASHBOARD_HERO_TEXT_GAP }}>
      <DashboardHeroGreeting />
      <DashboardHeroName displayName={displayName} namePlaceholder={namePlaceholder} />
      <DashboardHeroSubtitle subtitle={subtitle} />
    </View>
  );

  if (!showActions) {
    return <View>{identity}</View>;
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
      <View style={{ flex: 1 }}>{identity}</View>
      <DashboardHeroActions
        profileHref={profileHref}
        avatarKind={avatarKind}
        displayName={displayName}
        photoUri={photoUri}
      />
    </View>
  );
}
