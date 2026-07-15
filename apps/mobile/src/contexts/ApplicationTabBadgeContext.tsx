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
  getMatchingLiveShiftPosts,
  getWorkerApplicationUpdateCount,
  getWorkerShiftApplicationUpdateCount,
  getWorkerRoleTypes,
  isClinicNewApplication,
  isWorkerApplicationUpdateUnseen,
  isWorkerFillInApplicationUpdateCountable,
  markApplicationSeenByClinic,
  markApplicationSeenByWorker,
  markApplicationsSeenByWorker,
  getWorkerSeenShiftPostIds,
  markShiftPostsSeenByWorker,
  type Application,
} from '@chairside/api';

import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useClinicApplicationRealtime } from '@/hooks/useApplicationRealtime';
import { useClinicActingContext } from '@/hooks/useClinicActingContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useRefreshOnForeground } from '@/hooks/useRefreshOnForeground';
type ApplicationTabBadgeContextValue = {
  /** Unseen role application updates — Applications tab. */
  pendingCount: number;
  /** Unseen fill-in application updates + new matching shift postings — Fill-ins tab (worker only). */
  fillInPendingCount: number;
  refreshPending: () => Promise<void>;
  markApplicationSeen: (applicationId: string) => Promise<void>;
  markApplicationsSeen: (applicationIds: string[]) => Promise<void>;
  markShiftPostsSeen: (shiftPostIds: string[]) => Promise<void>;
  isApplicationHighlighted: (
    application: Pick<
      Application,
      | 'id'
      | 'post_type'
      | 'status'
      | 'created_at'
      | 'worker_hidden_at'
      | 'clinic_hidden_at'
      | 'worker_attention_at'
      | 'worker_last_seen_at'
      | 'clinic_attention_at'
      | 'clinic_last_seen_at'
    >,
  ) => boolean;
  getApplicationHighlightLabel: (
    application: Pick<
      Application,
      | 'id'
      | 'post_type'
      | 'status'
      | 'created_at'
      | 'worker_hidden_at'
      | 'clinic_hidden_at'
      | 'worker_attention_at'
      | 'worker_last_seen_at'
      | 'clinic_attention_at'
      | 'clinic_last_seen_at'
    >,
  ) => string | null;
};

const ApplicationTabBadgeContext = createContext<ApplicationTabBadgeContextValue | null>(null);

type ApplicationTabBadgeProviderProps = {
  role: 'worker' | 'clinic';
  children: ReactNode;
};

export function ApplicationTabBadgeProvider({ role, children }: ApplicationTabBadgeProviderProps) {
  const { user } = useAuth();
  const { clinicId, scopedLocationIds } = useClinicActingContext();
  const { refreshNotifications } = useNotifications();
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const [pendingCount, setPendingCount] = useState(0);
  const [fillInPendingCount, setFillInPendingCount] = useState(0);
  const [locallySeenApplicationIds, setLocallySeenApplicationIds] = useState<Set<string>>(
    () => new Set(),
  );

  const refreshPending = useCallback(async () => {
    if (!user?.id) {
      setPendingCount(0);
      setFillInPendingCount(0);
      return;
    }

    try {
      if (role === 'clinic') {
        if (!clinicId) {
          setPendingCount(0);
          setFillInPendingCount(0);
          return;
        }
        const count = await getClinicNewApplicationCount(clinicId, {
          locationIds: scopedLocationIds,
        });
        setPendingCount(count);
        setFillInPendingCount(0);
        return;
      }

      const province = workerProfile?.province ?? 'NS';
      const roleTypes = getWorkerRoleTypes(workerProfile);
      const availabilityDaySet = availabilityBlocks.map((block) => block.day_of_week);

      const [jobCount, shiftCount, matchingShifts, seenShiftPostIds] = await Promise.all([
        getWorkerApplicationUpdateCount(user.id),
        getWorkerShiftApplicationUpdateCount(user.id),
        getMatchingLiveShiftPosts(province, roleTypes, availabilityDaySet),
        getWorkerSeenShiftPostIds(user.id),
      ]);

      const newShiftPostingCount = matchingShifts.filter(
        (shift) => !seenShiftPostIds.has(shift.id),
      ).length;

      setPendingCount(jobCount);
      setFillInPendingCount(shiftCount + newShiftPostingCount);
    } catch {
      setPendingCount(0);
      setFillInPendingCount(0);
    }
  }, [availabilityBlocks, clinicId, role, scopedLocationIds, user?.id, workerProfile]);

  const markApplicationSeen = useCallback(
    async (applicationId: string) => {
      setLocallySeenApplicationIds((current) => {
        const next = new Set(current);
        next.add(applicationId);
        return next;
      });

      try {
        if (role === 'clinic') {
          await markApplicationSeenByClinic(applicationId);
        } else {
          await markApplicationSeenByWorker(applicationId);
        }
        await refreshPending();
      } catch (error) {
        setLocallySeenApplicationIds((current) => {
          const next = new Set(current);
          next.delete(applicationId);
          return next;
        });
        console.warn('Failed to mark application seen', error);
      }
    },
    [refreshPending, role],
  );

  const markApplicationsSeen = useCallback(
    async (applicationIds: string[]) => {
      if (applicationIds.length === 0) return;

      if (role === 'clinic') {
        await Promise.all(applicationIds.map((id) => markApplicationSeenByClinic(id)));
      } else {
        await markApplicationsSeenByWorker(applicationIds);
      }
      await refreshPending();
    },
    [refreshPending, role],
  );

  const markShiftPostsSeen = useCallback(
    async (shiftPostIds: string[]) => {
      if (!user?.id || shiftPostIds.length === 0) return;
      await markShiftPostsSeenByWorker(shiftPostIds);
      await refreshPending();
    },
    [refreshPending, user?.id],
  );

  const isApplicationHighlighted = useCallback(
    (
      application: Pick<
        Application,
        | 'id'
        | 'post_type'
        | 'status'
        | 'created_at'
        | 'worker_hidden_at'
        | 'clinic_hidden_at'
        | 'worker_attention_at'
        | 'worker_last_seen_at'
        | 'clinic_attention_at'
        | 'clinic_last_seen_at'
      >,
    ) => {
      if (locallySeenApplicationIds.has(application.id)) {
        return false;
      }

      if (role === 'clinic') {
        return isClinicNewApplication(application);
      }
      if (application.post_type === 'shift') {
        return isWorkerFillInApplicationUpdateCountable(application);
      }
      return isWorkerApplicationUpdateUnseen(application);
    },
    [locallySeenApplicationIds, role],
  );

  const getApplicationHighlightLabel = useCallback(
    (
      application: Pick<
        Application,
        | 'id'
        | 'post_type'
        | 'status'
        | 'created_at'
        | 'worker_hidden_at'
        | 'clinic_hidden_at'
        | 'worker_attention_at'
        | 'worker_last_seen_at'
        | 'clinic_attention_at'
        | 'clinic_last_seen_at'
      >,
    ) => {
      if (!isApplicationHighlighted(application)) return null;
      return role === 'clinic' ? 'New applicant' : 'Update';
    },
    [isApplicationHighlighted, role],
  );

  const refreshPendingAndBell = useCallback(async () => {
    await refreshPending();
    if (role === 'clinic') {
      await refreshNotifications();
    }
  }, [refreshPending, refreshNotifications, role]);

  useRefreshOnFocus(refreshPendingAndBell);
  useRefreshOnForeground(refreshPendingAndBell);

  useClinicApplicationRealtime(
    role === 'clinic' ? clinicId ?? undefined : undefined,
    refreshPendingAndBell,
  );

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
      markShiftPostsSeen: async () => {},
      isApplicationHighlighted: () => false,
      getApplicationHighlightLabel: () => null,
    }
  );
}
