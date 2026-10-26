import { useLocalSearchParams } from 'expo-router';

import { PublicListingPage } from '@/components/worker/PublicListingPage';
import { parseListingOpenSource } from '@/lib/analytics/events';

export default function PublicFillInListingScreen() {
  const { id, src } = useLocalSearchParams<{ id?: string; src?: string }>();
  return (
    <PublicListingPage
      kind="shift"
      id={typeof id === 'string' ? id : ''}
      source={parseListingOpenSource(src)}
    />
  );
}
