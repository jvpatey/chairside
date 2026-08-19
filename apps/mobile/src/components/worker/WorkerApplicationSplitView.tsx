import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { MasterDetailLayout } from '@/components/ui/MasterDetailLayout';
import { WorkerApplicationDetailPane } from '@/components/worker/WorkerApplicationDetailPane';
import { WorkerApplicationsInboxPanel } from '@/components/worker/WorkerApplicationsInboxPanel';
import { useTabAtmosphere } from '@/contexts/TabAtmosphereContext';
import { scheduleSplitViewUpdate } from '@/lib/scheduleSplitViewUpdate';
import { useThemedStyles } from '@/theme';

const MASTER_WIDTH = 380;

type WorkerApplicationSplitViewProps = {
  initialApplicationId?: string;
};

function ApplicationDetailPlaceholder() {
  const tabAtmosphere = useTabAtmosphere();
  const showTabAtmosphere = tabAtmosphere !== 'none';
  const styles = useThemedStyles(({ colors }) => ({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        showTabAtmosphere || Platform.OS === 'web' ? 'transparent' : colors.background,
    },
  }));

  return (
    <View style={styles.container}>
      <EmptyState
        embedded
        icon="document-text-outline"
        title="Select an application"
        message="Choose an application from the list to review status, messages, and next steps."
      />
    </View>
  );
}

/** Web Applications hub: persistent list + detail split (Messages-style). iPad stays stacked. */
export function WorkerApplicationSplitView({
  initialApplicationId,
}: WorkerApplicationSplitViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialApplicationId ?? null);

  useEffect(() => {
    if (initialApplicationId) {
      setSelectedId(initialApplicationId);
    }
  }, [initialApplicationId]);

  const handleSelect = useCallback((applicationId: string) => {
    scheduleSplitViewUpdate(() => {
      setSelectedId(applicationId);
    });
  }, []);

  const handleClose = useCallback(() => {
    scheduleSplitViewUpdate(() => {
      setSelectedId(null);
    });
  }, []);

  return (
    <MasterDetailLayout
      roundedPanes
      masterWidth={MASTER_WIDTH}
      showDetail
      master={
        <WorkerApplicationsInboxPanel
          compact
          selectedApplicationId={selectedId}
          onApplicationSelect={handleSelect}
        />
      }
      detail={
        selectedId ? (
          <WorkerApplicationDetailPane
            key={selectedId}
            applicationId={selectedId}
            returnTo="applications-tab"
            embedded
            onClose={handleClose}
          />
        ) : (
          <ApplicationDetailPlaceholder />
        )
      }
    />
  );
}
