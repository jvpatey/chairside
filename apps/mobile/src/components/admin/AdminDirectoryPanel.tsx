import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { AdminStatsClinicRow, AdminStatsProfessionalRow } from '@chairside/api';
import { formatRoleTypesLabel } from '@chairside/config';

import { AdminPlanBadge, AdminStatusPill } from '@/components/admin/AdminBadges';
import {
  formatAdminAccountType,
  formatAdminDateTime,
  formatAdminPeriodEnd,
} from '@/components/admin/adminLabels';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { fontBold, fontRegular, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type DirectoryTab = 'clinics' | 'professionals';
type ClinicSortKey = 'clinicName' | 'plan' | 'status' | 'signedUpAt' | 'lastSignInAt';
type ProSortKey = 'name' | 'email' | 'signedUpAt' | 'lastSignInAt';

type AdminDirectoryPanelProps = {
  clinics: AdminStatsClinicRow[];
  professionals: AdminStatsProfessionalRow[];
};

export function AdminDirectoryPanel({ clinics, professionals }: AdminDirectoryPanelProps) {
  const { colors } = useTheme();
  const [tab, setTab] = useState<DirectoryTab>('clinics');
  const [query, setQuery] = useState('');
  const [clinicSortKey, setClinicSortKey] = useState<ClinicSortKey>('clinicName');
  const [proSortKey, setProSortKey] = useState<ProSortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      flexWrap: 'wrap',
    },
    tabs: {
      flexDirection: 'row',
      gap: 6,
      padding: 4,
      borderRadius: radii.pill,
      backgroundColor: colors.backgroundGrouped,
    },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radii.pill,
      ...webPointer(),
    },
    tabActive: {
      backgroundColor: colors.surface,
    },
    tabLabel: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.labelSecondary,
    },
    tabLabelActive: {
      color: colors.labelPrimary,
    },
    count: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.labelTertiary,
    },
    search: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      fontFamily: fontRegular,
      fontSize: 14,
      color: colors.labelPrimary,
    } satisfies TextStyle,
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.backgroundGrouped,
      gap: spacing.sm,
    },
    headerCell: {
      fontFamily: fontSemibold,
      fontSize: 12,
      color: colors.labelTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    headerPressable: {
      ...webPointer(),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    zebra: {
      backgroundColor: colors.fillSubtle,
    },
    cellName: {
      fontFamily: fontSemibold,
      fontSize: 14,
      color: colors.labelPrimary,
    },
    cell: {
      flex: 1,
      minWidth: 90,
    },
    cellText: {
      fontFamily: fontRegular,
      fontSize: 13,
      color: colors.labelSecondary,
    },
    empty: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: fontSemibold,
      fontSize: 14,
      color: colors.labelTertiary,
    },
  }));

  const filteredClinics = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? clinics.filter(
          (c) =>
            c.clinicName.toLowerCase().includes(q) ||
            c.plan.toLowerCase().includes(q) ||
            c.status.toLowerCase().includes(q) ||
            c.accountType.toLowerCase().includes(q),
        )
      : [...clinics];

    list.sort((a, b) => {
      if (clinicSortKey === 'signedUpAt' || clinicSortKey === 'lastSignInAt') {
        const left = a[clinicSortKey] ? new Date(a[clinicSortKey] as string).getTime() : 0;
        const right = b[clinicSortKey] ? new Date(b[clinicSortKey] as string).getTime() : 0;
        const cmp = left - right;
        return sortAsc ? cmp : -cmp;
      }
      const left = String(a[clinicSortKey] ?? '');
      const right = String(b[clinicSortKey] ?? '');
      const cmp = left.localeCompare(right);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [clinicSortKey, clinics, query, sortAsc]);

  const filteredPros = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? professionals.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.email?.toLowerCase().includes(q) ?? false) ||
            p.roles.some((role) => role.toLowerCase().includes(q)),
        )
      : [...professionals];

    list.sort((a, b) => {
      if (proSortKey === 'signedUpAt' || proSortKey === 'lastSignInAt') {
        const left = a[proSortKey] ? new Date(a[proSortKey] as string).getTime() : 0;
        const right = b[proSortKey] ? new Date(b[proSortKey] as string).getTime() : 0;
        const cmp = left - right;
        return sortAsc ? cmp : -cmp;
      }
      const left = String(a[proSortKey] ?? '');
      const right = String(b[proSortKey] ?? '');
      const cmp = left.localeCompare(right);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [proSortKey, professionals, query, sortAsc]);

  const switchTab = (next: DirectoryTab) => {
    setTab(next);
    setQuery('');
    setSortAsc(true);
    if (next === 'clinics') setClinicSortKey('clinicName');
    else setProSortKey('name');
  };

  const toggleClinicSort = (key: ClinicSortKey) => {
    if (clinicSortKey === key) {
      setSortAsc((prev) => !prev);
      return;
    }
    setClinicSortKey(key);
    setSortAsc(true);
  };

  const toggleProSort = (key: ProSortKey) => {
    if (proSortKey === key) {
      setSortAsc((prev) => !prev);
      return;
    }
    setProSortKey(key);
    setSortAsc(true);
  };

  const renderSortHeader = (
    active: boolean,
    label: string,
    onPress: () => void,
    flexStyle: ViewStyle,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sort by ${label}`}
      onPress={onPress}
      style={[styles.headerPressable, flexStyle]}>
      <Text style={[styles.headerCell, active && { color: colors.labelPrimary }]}>
        {label}
        {active ? (sortAsc ? ' ↑' : ' ↓') : ''}
      </Text>
    </Pressable>
  );

  const shownCount = tab === 'clinics' ? filteredClinics.length : filteredPros.length;
  const totalCount = tab === 'clinics' ? clinics.length : professionals.length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.tabs}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: tab === 'clinics' }}
              onPress={() => switchTab('clinics')}
              style={[styles.tab, tab === 'clinics' && styles.tabActive]}>
              <Text style={[styles.tabLabel, tab === 'clinics' && styles.tabLabelActive]}>
                Clinics
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: tab === 'professionals' }}
              onPress={() => switchTab('professionals')}
              style={[styles.tab, tab === 'professionals' && styles.tabActive]}>
              <Text style={[styles.tabLabel, tab === 'professionals' && styles.tabLabelActive]}>
                Professionals
              </Text>
            </Pressable>
          </View>
          <Text style={styles.count}>
            {shownCount.toLocaleString()} of {totalCount.toLocaleString()}
          </Text>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={
            tab === 'clinics'
              ? 'Search clinics, plans, status…'
              : 'Search name, email, role…'
          }
          placeholderTextColor={colors.labelTertiary}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {tab === 'clinics' ? (
        <>
          <View style={styles.tableHeader}>
            {renderSortHeader(
              clinicSortKey === 'clinicName',
              'Clinic',
              () => toggleClinicSort('clinicName'),
              { flex: 1.5, minWidth: 140 },
            )}
            {renderSortHeader(
              clinicSortKey === 'plan',
              'Plan',
              () => toggleClinicSort('plan'),
              { flex: 0.9, minWidth: 80 },
            )}
            {renderSortHeader(
              clinicSortKey === 'status',
              'Status',
              () => toggleClinicSort('status'),
              { flex: 0.9, minWidth: 80 },
            )}
            {renderSortHeader(
              clinicSortKey === 'signedUpAt',
              'Signed up',
              () => toggleClinicSort('signedUpAt'),
              { flex: 1.1, minWidth: 110 },
            )}
            {renderSortHeader(
              clinicSortKey === 'lastSignInAt',
              'Last signed in',
              () => toggleClinicSort('lastSignInAt'),
              { flex: 1.1, minWidth: 110 },
            )}
          </View>
          {filteredClinics.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No clinics match this filter</Text>
            </View>
          ) : (
            filteredClinics.map((clinic, index) => (
              <Pressable
                key={clinic.id}
                style={({ hovered }) => [
                  styles.row,
                  index % 2 === 1 && styles.zebra,
                  webHover(hovered, false, webListRowHoverStyles(colors)),
                ]}>
                <View style={{ flex: 1.5, minWidth: 140, gap: 2 }}>
                  <Text style={styles.cellName} numberOfLines={1}>
                    {clinic.clinicName}
                  </Text>
                  <Text style={styles.cellText}>{formatAdminAccountType(clinic.accountType)}</Text>
                </View>
                <View style={[styles.cell, { flex: 0.9, minWidth: 80 }]}>
                  <AdminPlanBadge plan={clinic.plan} />
                </View>
                <View style={[styles.cell, { flex: 0.9, minWidth: 80 }]}>
                  <AdminStatusPill status={clinic.status} />
                </View>
                <View style={[styles.cell, { flex: 1.1, minWidth: 110 }]}>
                  <Text style={styles.cellText}>{formatAdminPeriodEnd(clinic.signedUpAt)}</Text>
                </View>
                <View style={[styles.cell, { flex: 1.1, minWidth: 110 }]}>
                  <Text style={styles.cellText}>{formatAdminDateTime(clinic.lastSignInAt)}</Text>
                </View>
              </Pressable>
            ))
          )}
        </>
      ) : (
        <>
          <View style={styles.tableHeader}>
            {renderSortHeader(
              proSortKey === 'name',
              'Name',
              () => toggleProSort('name'),
              { flex: 1.3, minWidth: 130 },
            )}
            {renderSortHeader(
              proSortKey === 'email',
              'Email',
              () => toggleProSort('email'),
              { flex: 1.4, minWidth: 160 },
            )}
            <Text style={[styles.headerCell, { flex: 1.2, minWidth: 120 }]}>Roles</Text>
            {renderSortHeader(
              proSortKey === 'signedUpAt',
              'Signed up',
              () => toggleProSort('signedUpAt'),
              { flex: 1, minWidth: 100 },
            )}
            {renderSortHeader(
              proSortKey === 'lastSignInAt',
              'Last signed in',
              () => toggleProSort('lastSignInAt'),
              { flex: 1.1, minWidth: 110 },
            )}
          </View>
          {filteredPros.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No professionals match this filter</Text>
            </View>
          ) : (
            filteredPros.map((pro, index) => (
              <Pressable
                key={pro.id}
                style={({ hovered }) => [
                  styles.row,
                  index % 2 === 1 && styles.zebra,
                  webHover(hovered, false, webListRowHoverStyles(colors)),
                ]}>
                <View style={{ flex: 1.3, minWidth: 130 }}>
                  <Text style={styles.cellName} numberOfLines={1}>
                    {pro.name}
                  </Text>
                </View>
                <View style={[styles.cell, { flex: 1.4, minWidth: 160 }]}>
                  <Text style={styles.cellText} numberOfLines={1}>
                    {pro.email ?? '—'}
                  </Text>
                </View>
                <View style={[styles.cell, { flex: 1.2, minWidth: 120 }]}>
                  <Text style={styles.cellText} numberOfLines={2}>
                    {formatRoleTypesLabel(pro.roles) || '—'}
                  </Text>
                </View>
                <View style={[styles.cell, { flex: 1, minWidth: 100 }]}>
                  <Text style={styles.cellText}>{formatAdminPeriodEnd(pro.signedUpAt)}</Text>
                </View>
                <View style={[styles.cell, { flex: 1.1, minWidth: 110 }]}>
                  <Text style={styles.cellText}>{formatAdminDateTime(pro.lastSignInAt)}</Text>
                </View>
              </Pressable>
            ))
          )}
        </>
      )}
    </View>
  );
}
