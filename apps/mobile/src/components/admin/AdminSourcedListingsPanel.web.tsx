import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createAdminSourcedListing,
  deleteAdminSourcedListing,
  listAdminSourcedListings,
  setAdminSourcedListingStatus,
  updateAdminSourcedListing,
  type CreateSourcedListingInput,
  type SourcedFillInListing,
  type SourcedListing,
  type SourcedListingKind,
  type SourcedRoleListing,
} from '@chairside/api';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  ROLE_TYPE_OPTIONS,
  getProvinceLabel,
  getRoleTypeLabel,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';

import { webHover, webPointer } from '@/lib/webPressableStyles';
import { fontRegular, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type Tab = SourcedListingKind;
type FormMode = { mode: 'create' | 'edit'; kind: SourcedListingKind; listing?: SourcedListing };

const PROVINCE_OPTIONS = [
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
] as const;

type FormState = {
  displayClinicName: string;
  displayCity: string;
  displayProvince: string;
  roleType: string;
  contactPhone: string;
  contactEmail: string;
  externalUrl: string;
  adminNotes: string;
  description: string;
  title: string;
  employmentType: string;
  wageRange: string;
  schedule: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  compensation: string;
};

function emptyForm(kind: SourcedListingKind): FormState {
  return {
    displayClinicName: '',
    displayCity: '',
    displayProvince: 'NS',
    roleType: 'hygienist',
    contactPhone: '',
    contactEmail: '',
    externalUrl: '',
    adminNotes: '',
    description: '',
    title: kind === 'role' ? '' : '',
    employmentType: 'permanent',
    wageRange: '',
    schedule: '',
    shiftDate: '',
    startTime: '',
    endTime: '',
    compensation: '',
  };
}

function formFromListing(listing: SourcedListing): FormState {
  const base = emptyForm(listing.kind);
  return {
    ...base,
    displayClinicName: listing.displayClinicName,
    displayCity: listing.displayCity,
    displayProvince: listing.displayProvince,
    roleType: listing.roleType,
    contactPhone: listing.contactPhone ?? '',
    contactEmail: listing.contactEmail ?? '',
    externalUrl: listing.externalUrl ?? '',
    adminNotes: listing.adminNotes ?? '',
    description: listing.description ?? '',
    ...(listing.kind === 'role'
      ? {
          title: listing.title,
          employmentType: listing.employmentType,
          wageRange: listing.wageRange ?? '',
          schedule: listing.schedule ?? '',
        }
      : {
          shiftDate: listing.shiftDate ?? '',
          startTime: listing.startTime?.slice(0, 5) ?? '',
          endTime: listing.endTime?.slice(0, 5) ?? '',
          compensation: listing.compensation ?? '',
        }),
  };
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  minWidth = 160,
  fullWidth,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  minWidth?: number;
  /** Full-width block field (default for multiline). */
  fullWidth?: boolean;
}) {
  const isFullWidth = fullWidth ?? Boolean(multiline);
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    wrap: isFullWidth
      ? {
          gap: 4,
          alignSelf: 'stretch' as const,
          width: '100%' as const,
        }
      : {
          gap: 4,
          flexGrow: 1,
          flexShrink: 1,
        },
    label: {
      fontFamily: fontSemibold,
      fontSize: 12,
      color: colors.labelSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      fontFamily: fontRegular,
      fontSize: 14,
      color: colors.labelPrimary,
      minHeight: multiline ? 72 : 40,
      textAlignVertical: multiline ? 'top' : 'center',
    },
  }));

  return (
    <View
      style={[styles.wrap, !isFullWidth && { flexBasis: minWidth, minWidth }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        style={styles.input}
      />
    </View>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    wrap: { gap: 4, flex: 1, minWidth: 140 },
    label: {
      fontFamily: fontSemibold,
      fontSize: 12,
      color: colors.labelSecondary,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      backgroundColor: colors.surface,
      ...webPointer(),
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.fillSubtle,
    },
    chipLabel: {
      fontFamily: fontSemibold,
      fontSize: 12,
      color: colors.labelSecondary,
    },
    chipLabelActive: {
      color: colors.primary,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ hovered, pressed }) => [
                styles.chip,
                active && styles.chipActive,
                webHover(hovered, pressed, { opacity: 0.9 }),
              ]}>
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AdminSourcedListingsPanel() {
  const { colors, spacing } = useTheme();
  const [tab, setTab] = useState<Tab>('role');
  const [roles, setRoles] = useState<SourcedRoleListing[]>([]);
  const [fillIns, setFillIns] = useState<SourcedFillInListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm('role'));

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    root: { gap: spacing.md },
    tabs: { flexDirection: 'row', gap: spacing.xs },
    tab: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      ...webPointer(),
    },
    tabActive: {
      borderColor: colors.primary,
      backgroundColor: colors.fillSubtle,
    },
    tabLabel: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.labelSecondary,
    },
    tabLabelActive: { color: colors.primary },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.primary,
      ...webPointer(),
    },
    primaryBtnLabel: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: '#fff',
    },
    ghostBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radii.sm,
      ...webPointer(),
    },
    ghostLabel: {
      fontFamily: fontSemibold,
      fontSize: 12,
      color: colors.primary,
    },
    dangerLabel: { color: colors.destructive },
    error: {
      fontFamily: fontRegular,
      fontSize: 13,
      color: colors.destructive,
    },
    empty: {
      fontFamily: fontRegular,
      fontSize: 13,
      color: colors.labelTertiary,
      paddingVertical: spacing.md,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardTitle: {
      fontFamily: fontSemibold,
      fontSize: 15,
      color: colors.labelPrimary,
    },
    cardMeta: {
      fontFamily: fontRegular,
      fontSize: 13,
      color: colors.labelSecondary,
    },
    statusPill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radii.pill,
      backgroundColor: colors.fillSubtle,
    },
    statusLabel: {
      fontFamily: fontSemibold,
      fontSize: 11,
      color: colors.labelSecondary,
      textTransform: 'uppercase',
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    form: {
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.md,
      alignSelf: 'stretch',
      width: '100%',
    },
    formTitle: {
      fontFamily: fontSemibold,
      fontSize: 16,
      color: colors.labelPrimary,
    },
    formRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    formActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    secondaryBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      ...webPointer(),
    },
    secondaryBtnLabel: {
      fontFamily: fontSemibold,
      fontSize: 13,
      color: colors.labelSecondary,
    },
  }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await listAdminSourcedListings('all');
      setRoles(payload.roles);
      setFillIns(payload.fillIns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sourced listings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(
    () => (tab === 'role' ? roles : fillIns),
    [fillIns, roles, tab],
  );

  const openCreate = (kind: SourcedListingKind) => {
    setFormMode({ mode: 'create', kind });
    setForm(emptyForm(kind));
    setError(null);
  };

  const openEdit = (listing: SourcedListing) => {
    setFormMode({ mode: 'edit', kind: listing.kind, listing });
    setForm(formFromListing(listing));
    setError(null);
  };

  const closeForm = () => {
    setFormMode(null);
    setSaving(false);
  };

  const patchForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = (): CreateSourcedListingInput => {
    if (!formMode) throw new Error('No form');
    return {
      kind: formMode.kind,
      displayClinicName: form.displayClinicName.trim(),
      displayCity: form.displayCity.trim(),
      displayProvince: form.displayProvince.trim().toUpperCase(),
      roleType: form.roleType,
      contactPhone: form.contactPhone.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
      externalUrl: form.externalUrl.trim() || null,
      adminNotes: form.adminNotes.trim() || null,
      description: form.description.trim() || null,
      ...(formMode.kind === 'role'
        ? {
            title: form.title.trim(),
            employmentType: form.employmentType,
            wageRange: form.wageRange.trim() || null,
            schedule: form.schedule.trim() || null,
          }
        : {
            shiftDate: form.shiftDate.trim() || null,
            startTime: form.startTime.trim() || null,
            endTime: form.endTime.trim() || null,
            compensation: form.compensation.trim() || null,
          }),
    };
  };

  const handleSave = async () => {
    if (!formMode) return;
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (formMode.mode === 'create') {
        await createAdminSourcedListing(payload);
      } else if (formMode.listing) {
        await updateAdminSourcedListing({
          ...payload,
          id: formMode.listing.id,
          kind: formMode.kind,
        });
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save listing.');
      setSaving(false);
    }
  };

  const handleSetStatus = async (listing: SourcedListing, status: string) => {
    setError(null);
    try {
      await setAdminSourcedListingStatus({
        kind: listing.kind,
        id: listing.id,
        status,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.');
    }
  };

  const handleDelete = async (listing: SourcedListing) => {
    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm(`Delete sourced listing for ${listing.displayClinicName}?`)
        : false;
    if (!confirmed) return;
    setError(null);
    try {
      await deleteAdminSourcedListing({ kind: listing.kind, id: listing.id });
      if (formMode?.listing?.id === listing.id) closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete listing.');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <View style={styles.tabs}>
          {(
            [
              { key: 'role' as const, label: `Roles (${roles.length})` },
              { key: 'fill_in' as const, label: `Fill-ins (${fillIns.length})` },
            ] as const
          ).map((item) => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  setTab(item.key);
                  if (!formMode) return;
                  if (formMode.kind !== item.key) closeForm();
                }}
                style={({ hovered, pressed }) => [
                  styles.tab,
                  active && styles.tabActive,
                  webHover(hovered, pressed, { opacity: 0.9 }),
                ]}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={() => openCreate(tab)}
          style={({ hovered, pressed }) => [
            styles.primaryBtn,
            webHover(hovered, pressed, { opacity: 0.92 }),
          ]}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.primaryBtnLabel}>
            {tab === 'role' ? 'Add role' : 'Add fill-in'}
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {formMode ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {formMode.mode === 'create' ? 'New' : 'Edit'}{' '}
            {formMode.kind === 'role' ? 'sourced role' : 'sourced fill-in'}
          </Text>
          <View style={styles.formRow}>
            <Field
              label="Clinic name"
              value={form.displayClinicName}
              onChangeText={(v) => patchForm('displayClinicName', v)}
              minWidth={200}
            />
            <Field
              label="City"
              value={form.displayCity}
              onChangeText={(v) => patchForm('displayCity', v)}
              minWidth={160}
            />
          </View>
          <SelectField
            label="Province"
            value={form.displayProvince}
            options={PROVINCE_OPTIONS}
            onChange={(v) => patchForm('displayProvince', v)}
          />
          <SelectField
            label="Role"
            value={form.roleType}
            options={ROLE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(v) => patchForm('roleType', v)}
          />
          {formMode.kind === 'role' ? (
            <>
              <Field
                label="Title"
                value={form.title}
                onChangeText={(v) => patchForm('title', v)}
                placeholder="e.g. Full-time Hygienist"
              />
              <SelectField
                label="Employment type"
                value={form.employmentType}
                options={EMPLOYMENT_TYPE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                onChange={(v) => patchForm('employmentType', v)}
              />
              <View style={styles.formRow}>
                <Field
                  label="Wage range (optional)"
                  value={form.wageRange}
                  onChangeText={(v) => patchForm('wageRange', v)}
                  minWidth={220}
                />
                <Field
                  label="Schedule (optional)"
                  value={form.schedule}
                  onChangeText={(v) => patchForm('schedule', v)}
                  minWidth={220}
                />
              </View>
            </>
          ) : (
            <View style={styles.formRow}>
              <Field
                label="Shift date (YYYY-MM-DD, optional)"
                value={form.shiftDate}
                onChangeText={(v) => patchForm('shiftDate', v)}
                placeholder="2026-10-20"
                minWidth={200}
              />
              <Field
                label="Start (optional)"
                value={form.startTime}
                onChangeText={(v) => patchForm('startTime', v)}
                placeholder="09:00"
                minWidth={110}
              />
              <Field
                label="End (optional)"
                value={form.endTime}
                onChangeText={(v) => patchForm('endTime', v)}
                placeholder="17:00"
                minWidth={110}
              />
              <Field
                label="Compensation"
                value={form.compensation}
                onChangeText={(v) => patchForm('compensation', v)}
                minWidth={160}
              />
            </View>
          )}
          <View style={styles.formRow}>
            <Field
              label="Phone"
              value={form.contactPhone}
              onChangeText={(v) => patchForm('contactPhone', v)}
              minWidth={140}
            />
            <Field
              label="Email"
              value={form.contactEmail}
              onChangeText={(v) => patchForm('contactEmail', v)}
              minWidth={180}
            />
            <Field
              label="External URL"
              value={form.externalUrl}
              onChangeText={(v) => patchForm('externalUrl', v)}
              minWidth={200}
            />
          </View>
          <Field
            label="Description (optional)"
            value={form.description}
            onChangeText={(v) => patchForm('description', v)}
            multiline
          />
          <Field
            label="Admin notes (internal, optional)"
            value={form.adminNotes}
            onChangeText={(v) => patchForm('adminNotes', v)}
            multiline
            placeholder="Permission date, original posting URL…"
          />
          <View style={styles.formActions}>
            <Pressable
              disabled={saving}
              onPress={() => void handleSave()}
              style={({ hovered, pressed }) => [
                styles.primaryBtn,
                saving && { opacity: 0.6 },
                webHover(hovered, pressed, { opacity: 0.92 }),
              ]}>
              <Text style={styles.primaryBtnLabel}>{saving ? 'Saving…' : 'Save'}</Text>
            </Pressable>
            <Pressable
              disabled={saving}
              onPress={closeForm}
              style={({ hovered, pressed }) => [
                styles.secondaryBtn,
                webHover(hovered, pressed, { opacity: 0.9 }),
              ]}>
              <Text style={styles.secondaryBtnLabel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>
          No sourced {tab === 'role' ? 'roles' : 'fill-ins'} yet. Add one to show workers
          exposure-only contact listings.
        </Text>
      ) : (
        items.map((listing) => (
          <View key={listing.id} style={styles.card}>
            <View style={styles.statusPill}>
              <Text style={styles.statusLabel}>{listing.status}</Text>
            </View>
            <Text style={styles.cardTitle}>
              {listing.kind === 'role'
                ? listing.title
                : listing.shiftDate
                  ? `${getRoleTypeLabel(listing.roleType)} · ${listing.shiftDate}`
                  : getRoleTypeLabel(listing.roleType)}
            </Text>
            <Text style={styles.cardMeta}>
              {listing.displayClinicName} · {listing.displayCity},{' '}
              {getProvinceLabel(listing.displayProvince)}
            </Text>
            <Text style={styles.cardMeta}>
              {[listing.contactPhone, listing.contactEmail, listing.externalUrl]
                .filter(Boolean)
                .join(' · ') || 'No contact on file'}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => openEdit(listing)}
                style={({ hovered, pressed }) => [
                  styles.ghostBtn,
                  webHover(hovered, pressed, { opacity: 0.85 }),
                ]}>
                <Ionicons name="create-outline" size={14} color={colors.primary} />
                <Text style={styles.ghostLabel}>Edit</Text>
              </Pressable>
              {listing.status === 'live' ? (
                <Pressable
                  onPress={() => void handleSetStatus(listing, 'closed')}
                  style={({ hovered, pressed }) => [
                    styles.ghostBtn,
                    webHover(hovered, pressed, { opacity: 0.85 }),
                  ]}>
                  <Ionicons name="close-circle-outline" size={14} color={colors.primary} />
                  <Text style={styles.ghostLabel}>Close</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => void handleSetStatus(listing, 'live')}
                  style={({ hovered, pressed }) => [
                    styles.ghostBtn,
                    webHover(hovered, pressed, { opacity: 0.85 }),
                  ]}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
                  <Text style={styles.ghostLabel}>Reopen</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => void handleDelete(listing)}
                style={({ hovered, pressed }) => [
                  styles.ghostBtn,
                  webHover(hovered, pressed, { opacity: 0.85 }),
                ]}>
                <Ionicons
                  name="trash-outline"
                  size={14}
                  color={colors.destructive}
                />
                <Text style={[styles.ghostLabel, styles.dangerLabel]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
