import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getClinicNewApplicationCount,
  getMatchingLiveShiftPostCount,
  getWorkerApplicationUpdateCount,
  getWorkerShiftApplicationUpdateCount,
  isClinicNewApplication,
  isWorkerApplicationUpdateUnseen,
  isWorkerFillInApplicationUpdateCountable,
  type Application,
} from '@chairside/api';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useRefreshOnForeground } from '@/hooks/useRefreshOnForeground';
import {
  getApplicationBadgeSeenMap,
  markApplicationBadgeSeen,
  markApplicationBadgesSeen,
  seedApplicationBadgeBaselines,
} from '@/lib/applicationBadgeStorage';
import {
  getSeenShiftPostIds,
  markShiftPostsSeen as persistShiftPostsSeen,
} from '@/lib/shiftPostSeenStorage';

type ApplicationTabBadgeContextValue = {
  /** Unseen role application updates — Applications tab. */
  pendingCount: number;
  /** Unseen fill-in application updates + new matching shift postings — Fill-ins tab (worker only). */
  fillInPendingCount: number;
  refreshPending: () => Promise<void>;
  markApplicationSeen: (applicationId: string, updatedAt: string) => Promise<void>;
  markApplicationsSeen: (
    applications: { id: string; updated_at: string }[],
  ) => Promise<void>;
  seedApplicationBaselines: (
    applications: { id: string; updated_at: string }[],
  ) => Promise<void>;
  markShiftPostsSeen: (shiftPostIds: string[]) => Promise<void>;
  isApplicationHighlighted: (
    application: Pick<
      Application,
      | 'id'
      | 'post_type'
      | 'status'
      | 'created_at'
      | 'updated_at'
      | 'worker_hidden_at'
      | 'clinic_hidden_at'
    >,
  ) => boolean;
  getApplicationHighlightLabel: (
    application: Pick<
      Application,
      | 'id'
      | 'post_type'
      | 'status'
      | 'created_at'
      | 'updated_at'
      | 'worker_hidden_at'
      | 'clinic_hidden_at'
    >,
  ) => string | null;
};

const ApplicationTabBadgeContext = createContext<ApplicationTabBadgeContextValue | null>(null);

type ApplicationTabBadgeProviderProps = {
  role: 'worker' | 'clinic';
  children: ReactNode;
};

export function ApplicationTabBadgeProvider({
  role,
  children,
}: ApplicationTabBadgeProviderProps) {
  const { user } = useAuth();
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const [pendingCount, setPendingCount] = useState(0);
  const [fillInPendingCount, setFillInPendingCount] = useState(0);
  const [seenMap, setSeenMap] = useState<Record<string, string>>({});
  const [seenMapReady, setSeenMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getApplicationBadgeSeenMap()
      .then((map) => {
        if (!cancelled) {
          setSeenMap(map);
          setSeenMapReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSeenMapReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshPending = useCallback(async () => {
    if (!user?.id) {
      setPendingCount(0);
      setFillInPendingCount(0);
      setSeenMap({});
      return;
    }

    try {
      if (role === 'clinic') {
        const count = await getClinicNewApplicationCount(user.id);
        setPendingCount(count);
        setFillInPendingCount(0);
        return;
      }

      const nextSeenMap = await getApplicationBadgeSeenMap();
      setSeenMap(nextSeenMap);
      setSeenMapReady(true);

      const province = workerProfile?.province ?? 'NS';
      const roleType = workerProfile?.role_type ?? null;
      const availabilityDaySet = availabilityBlocks.map((block) => block.day_of_week);

      const [jobCount, shiftCount, matchingShifts, seenShiftPostIds] = await Promise.all([
        getWorkerApplicationUpdateCount(user.id, nextSeenMap),
        getWorkerShiftApplicationUpdateCount(user.id, nextSeenMap),
        getMatchingLiveShiftPostCount(province, roleType, availabilityDaySet),
        getSeenShiftPostIds(),
      ]);

      const newShiftPostingCount = matchingShifts.shifts.filter(
        (shift) => !seenShiftPostIds.has(shift.id),
      ).length;

      setPendingCount(jobCount);
      setFillInPendingCount(shiftCount + newShiftPostingCount);
    } catch {
      setPendingCount(0);
      setFillInPendingCount(0);
    }
  }, [availabilityBlocks, role, user?.id, workerProfile?.province, workerProfile?.role_type]);

  const markApplicationSeen = useCallback(
    async (applicationId: string, updatedAt: string) => {
      const nextSeenMap = await markApplicationBadgeSeen(applicationId, updatedAt);
      setSeenMap(nextSeenMap);
      await refreshPending();
    },
    [refreshPending],
  );

  const markApplicationsSeen = useCallback(
    async (applications: { id: string; updated_at: string }[]) => {
      const nextSeenMap = await markApplicationBadgesSeen(applications);
      setSeenMap(nextSeenMap);
      setSeenMapReady(true);
      await refreshPending();
    },
    [refreshPending],
  );

  const seedApplicationBaselines = useCallback(
    async (applications: { id: string; updated_at: string }[]) => {
      const nextSeenMap = await seedApplicationBadgeBaselines(applications);
      setSeenMap(nextSeenMap);
      setSeenMapReady(true);
      await refreshPending();
    },
    [refreshPending],
  );

  const markShiftPostsSeen = useCallback(
    async (shiftPostIds: string[]) => {
      await persistShiftPostsSeen(shiftPostIds);
      await refreshPending();
    },
    [refreshPending],
  );

  const isApplicationHighlighted = useCallback(
    (
      application: Pick<
        Application,
        | 'id'
        | 'post_type'
        | 'status'
        | 'created_at'
        | 'updated_at'
        | 'worker_hidden_at'
        | 'clinic_hidden_at'
      >,
    ) => {
      if (role === 'clinic') {
        return isClinicNewApplication(application);
      }
      if (!seenMapReady) return false;
      if (application.post_type === 'shift') {
        return isWorkerFillInApplicationUpdateCountable(application, seenMap);
      }
      return isWorkerApplicationUpdateUnseen(application, seenMap);
    },
    [role, seenMap, seenMapReady],
  );

  const getApplicationHighlightLabel = useCallback(
    (
      application: Pick<
        Application,
        | 'id'
        | 'post_type'
        | 'status'
        | 'created_at'
        | 'updated_at'
        | 'worker_hidden_at'
        | 'clinic_hidden_at'
      >,
    ) => {
      if (!isApplicationHighlighted(application)) return null;
      return role === 'clinic' ? 'New applicant' : 'Update';
    },
    [isApplicationHighlighted, role],
  );

  useRefreshOnFocus(refreshPending);
  useRefreshOnForeground(refreshPending);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  const value = useMemo(
    () => ({
      pendingCount,
      fillInPendingCount,
      refreshPending,
      markApplicationSeen,
      markApplicationsSeen,
      seedApplicationBaselines,
      markShiftPostsSeen,
      isApplicationHighlighted,
      getApplicationHighlightLabel,
    }),
    [
      fillInPendingCount,
      getApplicationHighlightLabel,
      isApplicationHighlighted,
      markApplicationSeen,
      markApplicationsSeen,
      markShiftPostsSeen,
      pendingCount,
      refreshPending,
      seedApplicationBaselines,
    ],
  );

  return (
    <ApplicationTabBadgeContext.Provider value={value}>
      {children}
    </ApplicationTabBadgeContext.Provider>
  );
}

export function useApplicationTabBadge() {
  const context = useContext(ApplicationTabBadgeContext);
  return (
    context ?? {
      pendingCount: 0,
      fillInPendingCount: 0,
      refreshPending: async () => {},
      markApplicationSeen: async () => {},
      markApplicationsSeen: async () => {},
      seedApplicationBaselines: async () => {},
      markShiftPostsSeen: async () => {},
      isApplicationHighlighted: () => false,
      getApplicationHighlightLabel: () => null,
    }
  );
}
