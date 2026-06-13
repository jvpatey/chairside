import { Text } from 'react-native';

import { formatPostedDateLabel } from '@/lib/dates';
import { useThemedStyles } from '@/theme';

type RoleListingPostedMetaProps = {
  postedAt: string | null | undefined;
  hasApplied?: boolean;
};

export function RoleListingPostedMeta({ postedAt, hasApplied }: RoleListingPostedMetaProps) {
  const posted = formatPostedDateLabel(postedAt);
  if (!posted && !hasApplied) return null;

  const styles = useThemedStyles(({ colors }) => ({
    posted: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
    applied: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  return (
    <Text style={styles.posted} numberOfLines={1}>
      {posted}
      {hasApplied ? (
        <Text style={styles.applied}>{posted ? ' · Applied' : 'Applied'}</Text>
      ) : null}
    </Text>
  );
}
