import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { AdminStatsClinicRow, AdminStatsProfessionalRow } from '@chairside/api';
import { formatRoleTypesLabel } from '@chairside/config';

import { Ionicons } from '@expo/vector-icons';

import { AdminPlanBadge, AdminStatusPill } from '@/components/admin/AdminBadges';
import {
  AdminDeleteAccountDialog,
  type AdminDeleteTarget,
} from '@/components/admin/AdminDeleteAccountDialog.web';
import {
  formatAdminAccountType,
  formatAdminDateTime,
  formatAdminPeriodEnd,
} from '@/components/admin/adminLabels';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { isPlatformAdminEmail } from '@/lib/platformAdmin';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { fontRegular, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type DirectoryTab = 'clinics' | 'professionals';
type ClinicSortKey = 'clinicName' | 'email' | 'plan' | 'status' | 'signedUpAt' | 'lastSignInAt';
type ProSortKey = 'name' | 'email' | 'signedUpAt' | 'lastSignInAt';

type AdminDirectoryPanelProps = {
  clinics: AdminStatsClinicRow[];
  professionals: AdminStatsProfessionalRow[];
  onAccountDeleted?: (target: AdminDeleteTarget) => void;
};

const ACTIONS_COLUMN_WIDTH = 40;

function toClinicDeleteTarget(clinic: AdminStatsClinicRow): AdminDeleteTarget {
  return {
    kind: 'clinic',
    id: clinic.id,
    name: clinic.clinicName,
    email: clinic.email,
    detail: formatAdminAccountType(clinic.accountType),
    plan: clinic.plan,
  };
}

function toProfessionalDeleteTarget(pro: AdminStatsProfessionalRow): AdminDeleteTarget {
  return {
    kind: 'professional',
    id: pro.id,
    name: pro.name,
    email: pro.email,
    detail: formatRoleTypesLabel(pro.roles) || '',
  };
}

const CLINIC_SORT_OPTIONS: Array<{ key: ClinicSortKey; label: string }> = [
  { key: 'clinicName', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'plan', label: 'Plan' },
  { key: 'status', label: 'Status' },
  { key: 'signedUpAt', label: 'Signed up' },
  { key: 'lastSignInAt', label: 'Last signed in' },
];

const PRO_SORT_OPTIONS: Array<{ key: ProSortKey; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'signedUpAt', label: 'Signed up' },
  { key: 'lastSignInAt', label: 'Last signed in' },
];

export function AdminDirectoryPanel({
  clinics,
  professionals,
  onAccountDeleted,
}: AdminDirectoryPanelProps) {
  const { colors, spacing } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const useCards = !isTablet;
  const [deleteTarget, setDeleteTarget] = useState<AdminDeleteTarget | null>(null);
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
    sortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    sortChipsScroll: {
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
    },
    sortChips: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 2,
    },
    sortChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radii.pill,
      backgroundColor: colors.backgroundGrouped,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      ...webPointer(),
    },
    sortChipActive: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    sortChipLabel: {
      fontFamily: fontSemibold,
      fontSize: 12,
      color: colors.labelSecondary,
    },
    sortChipLabelActive: {
      color: colors.primary,
    },
    sortDirBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundGrouped,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      ...webPointer(),
    },
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
    cardRow: {
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    cardTop: {
      gap: 2,
    },
    cardMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    cardDates: {
      gap: 2,
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
    metaLabel: {
      fontFamily: fontSemibold,
      fontSize: 11,
      color: colors.labelTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
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
    actionsCell: {
      width: ACTIONS_COLUMN_WIDTH,
      alignItems: 'flex-end',
    },
    deleteIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      ...webPointer(),
    },
    deleteIconBtnHovered: {
      backgroundColor: `${colors.destructive}14`,
    },
    deleteLink: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingVertical: 4,
      ...webPointer(),
    },
    deleteLinkText: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.destructive,
    },
  }));

  const renderDeleteIcon = (target: AdminDeleteTarget) => (
    <View style={styles.actionsCell}>
      {isPlatformAdminEmail(target.email) ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${target.name}`}
          onPress={() => setDeleteTarget(target)}
          style={({ hovered, pressed }) => [
            styles.deleteIconBtn,
            webHover(hovered, pressed, styles.deleteIconBtnHovered),
          ]}>
          <Ionicons name="trash-outline" size={16} color={colors.destructive} />
        </Pressable>
      )}
    </View>
  );

  const renderDeleteLink = (target: AdminDeleteTarget) =>
    isPlatformAdminEmail(target.email) ? null : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${target.name}`}
        onPress={() => setDeleteTarget(target)}
        style={styles.deleteLink}>
        <Ionicons name="trash-outline" size={14} color={colors.destructive} />
        <Text style={styles.deleteLinkText}>Delete account</Text>
      </Pressable>
    );

  const filteredClinics = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? clinics.filter(
          (c) =>
            c.clinicName.toLowerCase().includes(q) ||
            (c.email?.toLowerCase().includes(q) ?? false) ||
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

  const renderMobileSortBar = (
    options: Array<{ key: string; label: string }>,
    activeKey: string,
    onSelect: (key: string) => void,
  ) => (
    <View style={styles.sortRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortChipsScroll}
        contentContainerStyle={styles.sortChips}>
        {options.map((option) => {
          const active = option.key === activeKey;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Sort by ${option.label}`}
              onPress={() => onSelect(option.key)}
              style={[styles.sortChip, active && styles.sortChipActive]}>
              <Text style={[styles.sortChipLabel, active && styles.sortChipLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={sortAsc ? 'Sort ascending' : 'Sort descending'}
        onPress={() => setSortAsc((prev) => !prev)}
        style={styles.sortDirBtn}>
        <Text style={[styles.sortChipLabel, { color: colors.labelPrimary }]}>
          {sortAsc ? '↑' : '↓'}
        </Text>
      </Pressable>
    </View>
  );

  const shownCount = tab === 'clinics' ? filteredClinics.length : filteredPros.length;
  const totalCount = tab === 'clinics' ? clinics.length : professionals.length;
  const headerPad = {
    paddingHorizontal: useCards ? spacing.md : spacing.lg,
    paddingTop: useCards ? spacing.md : spacing.lg,
  };
  const cardRowPad = {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  };

  return (
    <View style={styles.card}>
      <View style={[styles.header, headerPad]}>
        <View style={styles.titleRow}>
          <View style={styles.tabs}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: tab === 'clinics' }}
              onPress={() => switchTab('clinics')}
              style={[
                styles.tab,
                { paddingHorizontal: useCards ? 12 : 14 },
                tab === 'clinics' && styles.tabActive,
              ]}>
              <Text style={[styles.tabLabel, tab === 'clinics' && styles.tabLabelActive]}>
                Clinics
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: tab === 'professionals' }}
              onPress={() => switchTab('professionals')}
              style={[
                styles.tab,
                { paddingHorizontal: useCards ? 12 : 14 },
                tab === 'professionals' && styles.tabActive,
              ]}>
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
              ? 'Search clinics, email, plans, status…'
              : 'Search name, email, role…'
          }
          placeholderTextColor={colors.labelTertiary}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {useCards
          ? renderMobileSortBar(
              tab === 'clinics' ? CLINIC_SORT_OPTIONS : PRO_SORT_OPTIONS,
              tab === 'clinics' ? clinicSortKey : proSortKey,
              (key) => {
                if (tab === 'clinics') toggleClinicSort(key as ClinicSortKey);
                else toggleProSort(key as ProSortKey);
              },
            )
          : null}
      </View>

      {tab === 'clinics' ? (
        useCards ? (
          filteredClinics.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No clinics match this filter</Text>
            </View>
          ) : (
            filteredClinics.map((clinic, index) => (
              <View
                key={clinic.id}
                style={[styles.cardRow, cardRowPad, index % 2 === 1 && styles.zebra]}>
                <View style={styles.cardTop}>
                  <Text style={styles.cellName} numberOfLines={2}>
                    {clinic.clinicName}
                  </Text>
                  <Text style={styles.cellText} numberOfLines={1}>
                    {clinic.email ?? '—'}
                  </Text>
                  <Text style={styles.cellText}>{formatAdminAccountType(clinic.accountType)}</Text>
                </View>
                <View style={styles.cardMetaRow}>
                  <AdminPlanBadge plan={clinic.plan} />
                  <AdminStatusPill status={clinic.status} />
                </View>
                <View style={styles.cardDates}>
                  <Text style={styles.metaLabel}>Signed up</Text>
                  <Text style={styles.cellText}>{formatAdminPeriodEnd(clinic.signedUpAt)}</Text>
                  <Text style={[styles.metaLabel, { marginTop: 6 }]}>Last signed in</Text>
                  <Text style={styles.cellText}>{formatAdminDateTime(clinic.lastSignInAt)}</Text>
                </View>
                {renderDeleteLink(toClinicDeleteTarget(clinic))}
              </View>
            ))
          )
        ) : (
          <>
            <View style={styles.tableHeader}>
              {renderSortHeader(
                clinicSortKey === 'clinicName',
                'Clinic',
                () => toggleClinicSort('clinicName'),
                { flex: 1.4, minWidth: 130 },
              )}
              {renderSortHeader(
                clinicSortKey === 'email',
                'Email',
                () => toggleClinicSort('email'),
                { flex: 1.4, minWidth: 160 },
              )}
              {renderSortHeader(
                clinicSortKey === 'plan',
                'Plan',
                () => toggleClinicSort('plan'),
                { flex: 0.8, minWidth: 70 },
              )}
              {renderSortHeader(
                clinicSortKey === 'status',
                'Status',
                () => toggleClinicSort('status'),
                { flex: 0.8, minWidth: 70 },
              )}
              {renderSortHeader(
                clinicSortKey === 'signedUpAt',
                'Signed up',
                () => toggleClinicSort('signedUpAt'),
                { flex: 1, minWidth: 100 },
              )}
              {renderSortHeader(
                clinicSortKey === 'lastSignInAt',
                'Last signed in',
                () => toggleClinicSort('lastSignInAt'),
                { flex: 1, minWidth: 100 },
              )}
              <View style={styles.actionsCell} />
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
                  <View style={{ flex: 1.4, minWidth: 130, gap: 2 }}>
                    <Text style={styles.cellName} numberOfLines={1}>
                      {clinic.clinicName}
                    </Text>
                    <Text style={styles.cellText}>{formatAdminAccountType(clinic.accountType)}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1.4, minWidth: 160 }]}>
                    <Text style={styles.cellText} numberOfLines={1}>
                      {clinic.email ?? '—'}
                    </Text>
                  </View>
                  <View style={[styles.cell, { flex: 0.8, minWidth: 70 }]}>
                    <AdminPlanBadge plan={clinic.plan} />
                  </View>
                  <View style={[styles.cell, { flex: 0.8, minWidth: 70 }]}>
                    <AdminStatusPill status={clinic.status} />
                  </View>
                  <View style={[styles.cell, { flex: 1, minWidth: 100 }]}>
                    <Text style={styles.cellText}>{formatAdminPeriodEnd(clinic.signedUpAt)}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1, minWidth: 100 }]}>
                    <Text style={styles.cellText}>{formatAdminDateTime(clinic.lastSignInAt)}</Text>
                  </View>
                  {renderDeleteIcon(toClinicDeleteTarget(clinic))}
                </Pressable>
              ))
            )}
          </>
        )
      ) : useCards ? (
        filteredPros.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No professionals match this filter</Text>
          </View>
        ) : (
          filteredPros.map((pro, index) => (
            <View
              key={pro.id}
              style={[styles.cardRow, cardRowPad, index % 2 === 1 && styles.zebra]}>
              <View style={styles.cardTop}>
                <Text style={styles.cellName} numberOfLines={2}>
                  {pro.name}
                </Text>
                <Text style={styles.cellText} numberOfLines={1}>
                  {pro.email ?? '—'}
                </Text>
                <Text style={styles.cellText} numberOfLines={2}>
                  {formatRoleTypesLabel(pro.roles) || '—'}
                </Text>
              </View>
              <View style={styles.cardDates}>
                <Text style={styles.metaLabel}>Signed up</Text>
                <Text style={styles.cellText}>{formatAdminPeriodEnd(pro.signedUpAt)}</Text>
                <Text style={[styles.metaLabel, { marginTop: 6 }]}>Last signed in</Text>
                <Text style={styles.cellText}>{formatAdminDateTime(pro.lastSignInAt)}</Text>
              </View>
              {renderDeleteLink(toProfessionalDeleteTarget(pro))}
            </View>
          ))
        )
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
            <View style={styles.actionsCell} />
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
                {renderDeleteIcon(toProfessionalDeleteTarget(pro))}
              </Pressable>
            ))
          )}
        </>
      )}
      <AdminDeleteAccountDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={(target) => {
          setDeleteTarget(null);
          onAccountDeleted?.(target);
        }}
      />
    </View>
  );
}
