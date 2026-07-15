import {
  filterLocationsForMembership,
  getClinicProfile,
  getClinicProfileByOrganizationId,
  getClinicWorkspace,
  isClinicGroupsEnabled,
  isClinicProfileComplete,
  type ClinicLocation,
  type ClinicMembership,
  type ClinicOrganization,
  type ClinicProfile,
  type ClinicWorkspace,
} from '@chairside/api';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import {
  loadStoredLocationScope,
  saveStoredLocationScope,
  type ClinicLocationScope,
} from '@/lib/clinicLocationScopeStorage';

export type { ClinicLocationScope };

type ClinicProfileContextValue = {
  clinicProfile: ClinicProfile | null;
  organization: ClinicOrganization | null;
  membership: ClinicMembership | null;
  locations: ClinicLocation[];
  accessibleLocations: ClinicLocation[];
  workspace: ClinicWorkspace | null;
  organizationId: string | null;
  /** Owner auth user id / billing clinic id for org-owned resources. */
  clinicId: string | null;
  isOwner: boolean;
  isGroup: boolean;
  locationScope: ClinicLocationScope;
  setLocationScope: (scope: ClinicLocationScope) => void;
  scopedLocationIds: string[] | 'all';
  isClinicProfileReady: boolean;
  isProfileComplete: boolean;
  refreshClinicProfile: () => Promise<ClinicProfile | null>;
};

const ClinicProfileContext = createContext<ClinicProfileContextValue | null>(null);

export function ClinicProfileProvider({ children }: { children: ReactNode }) {
  const { user, profile, isAuthReady } = useAuth();
  const [clinicProfile, setClinicProfile] = useState<ClinicProfile | null>(null);
  const [workspace, setWorkspace] = useState<ClinicWorkspace | null>(null);
  const [locationScope, setLocationScopeState] = useState<ClinicLocationScope>('all');
  const [isClinicProfileReady, setIsClinicProfileReady] = useState(false);
  const requestRef = useRef(0);

  const setLocationScope = useCallback(
    (scope: ClinicLocationScope) => {
      setLocationScopeState(scope);
      const orgId = workspace?.organization.id;
      if (orgId && user?.id) {
        void saveStoredLocationScope(user.id, orgId, scope);
      }
    },
    [user?.id, workspace?.organization.id],
  );

  const refreshClinicProfile = useCallback(async () => {
    const userId = user?.id;
    if (!userId || profile?.role !== 'clinic') {
      setClinicProfile(null);
      setWorkspace(null);
      return null;
    }

    const requestId = ++requestRef.current;

    try {
      let nextWorkspace: ClinicWorkspace | null = null;
      if (isClinicGroupsEnabled()) {
        nextWorkspace = await getClinicWorkspace(userId);
      }

      const organizationId = nextWorkspace?.organization.id ?? userId;
      const nextProfile =
        (await getClinicProfileByOrganizationId(organizationId)) ??
        (await getClinicProfile(userId));

      if (requestId !== requestRef.current) return null;
      setWorkspace(nextWorkspace);
      setClinicProfile(nextProfile);

      if (nextWorkspace && userId) {
        const stored = await loadStoredLocationScope(userId, nextWorkspace.organization.id);
        if (stored) {
          setLocationScopeState(stored);
        }
      }

      return nextProfile;
    } catch {
      if (requestId === requestRef.current) {
        setClinicProfile(null);
        setWorkspace(null);
      }
      return null;
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isAuthReady) {
        setIsClinicProfileReady(false);
        return;
      }

      if (!user?.id) {
        requestRef.current += 1;
        setClinicProfile(null);
        setWorkspace(null);
        setIsClinicProfileReady(true);
        return;
      }

      if (profile === null) {
        setClinicProfile(null);
        setWorkspace(null);
        setIsClinicProfileReady(false);
        return;
      }

      if (profile.role !== 'clinic') {
        requestRef.current += 1;
        setClinicProfile(null);
        setWorkspace(null);
        setIsClinicProfileReady(true);
        return;
      }

      const requestId = ++requestRef.current;
      setIsClinicProfileReady(false);

      try {
        let nextWorkspace: ClinicWorkspace | null = null;
        if (isClinicGroupsEnabled()) {
          nextWorkspace = await getClinicWorkspace(user.id);
        }

        const organizationId = nextWorkspace?.organization.id ?? user.id;
        const nextProfile =
          (await getClinicProfileByOrganizationId(organizationId)) ??
          (await getClinicProfile(user.id));

        if (cancelled || requestId !== requestRef.current) return;
        setWorkspace(nextWorkspace);
        setClinicProfile(nextProfile);

        if (nextWorkspace) {
          const stored = await loadStoredLocationScope(user.id, nextWorkspace.organization.id);
          if (stored) setLocationScopeState(stored);
        }
      } catch {
        if (!cancelled && requestId === requestRef.current) {
          setClinicProfile(null);
          setWorkspace(null);
        }
      } finally {
        if (!cancelled) setIsClinicProfileReady(true);
      }
    }

    void load();

    return () => {
      cancelled = true;
      requestRef.current += 1;
    };
  }, [user?.id, profile, profile?.role, isAuthReady]);

  const accessibleLocations = useMemo(() => {
    if (!workspace) return [];
    return filterLocationsForMembership(workspace.locations, workspace.accessibleLocationIds);
  }, [workspace]);

  // Primitive key so consumers don't see a new string[] every workspace identity change.
  const scopedLocationIdsKey = useMemo(() => {
    if (!workspace || !workspace.isGroup) return 'all';
    if (locationScope === 'all') {
      if (workspace.isOwner) return 'all';
      return accessibleLocations.map((location) => location.id).join(',');
    }
    return locationScope;
  }, [accessibleLocations, locationScope, workspace]);

  const scopedLocationIds = useMemo((): 'all' | string[] => {
    if (scopedLocationIdsKey === 'all') return 'all';
    if (!scopedLocationIdsKey) return [];
    return scopedLocationIdsKey.split(',');
  }, [scopedLocationIdsKey]);

  const value = useMemo(
    () => ({
      clinicProfile,
      organization: workspace?.organization ?? null,
      membership: workspace?.membership ?? null,
      locations: workspace?.locations ?? [],
      accessibleLocations,
      workspace,
      organizationId: workspace?.organization.id ?? clinicProfile?.organization_id ?? clinicProfile?.id ?? null,
      clinicId: workspace?.organization.id ?? clinicProfile?.id ?? null,
      isOwner: workspace?.isOwner ?? true,
      isGroup: workspace?.isGroup ?? clinicProfile?.account_type === 'group',
      locationScope,
      setLocationScope,
      scopedLocationIds,
      isClinicProfileReady,
      isProfileComplete: isClinicProfileComplete(clinicProfile),
      refreshClinicProfile,
    }),
    [
      accessibleLocations,
      clinicProfile,
      isClinicProfileReady,
      locationScope,
      refreshClinicProfile,
      scopedLocationIds,
      setLocationScope,
      workspace,
    ],
  );

  return (
    <ClinicProfileContext.Provider value={value}>{children}</ClinicProfileContext.Provider>
  );
}

export function useClinicProfile(): ClinicProfileContextValue {
  const context = useContext(ClinicProfileContext);
  if (!context) {
    throw new Error('useClinicProfile must be used within ClinicProfileProvider');
  }
  return context;
}
