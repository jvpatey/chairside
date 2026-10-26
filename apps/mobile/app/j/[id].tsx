import { useLocalSearchParams } from 'expo-router';

import { PublicListingPage } from '@/components/worker/PublicListingPage';
import { parseListingOpenSource } from '@/lib/analytics/events';

export default function PublicJobListingScreen() {
  const { id, src } = useLocalSearchParams<{ id?: string; src?: string }>();
  return (
    <PublicListingPage
      kind="job"
      id={typeof id === 'string' ? id : ''}
      source={parseListingOpenSource(src)}
    />
  );
}
