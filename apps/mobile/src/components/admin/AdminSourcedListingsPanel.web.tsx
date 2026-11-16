import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
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
  URGENCY_OPTIONS,
  getProvinceLabel,
  getRoleTypeLabel,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { CompensationInput } from '@/components/clinic/CompensationInput';
import { ShiftDateInput } from '@/components/clinic/ShiftDateInput';
import { TimeRangeInput } from '@/components/clinic/TimeRangeInput';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormFieldLabel } from '@/components/ui/FormFieldLabel';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import {
  formFieldInputRowFocusedStyle,
  formFieldInputRowStyle,
  formFieldInputStyle,
} from '@/theme/formFieldTokens';
import { fontRegular, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type Tab = SourcedListingKind;
type FormMode = { mode: 'create' | 'edit'; kind: SourcedListingKind; listing?: SourcedListing };

const PROVINCE_OPTIONS = [
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
] as const;

/** Sourced roles are permanent/part-time/temp — fill-in uses the fill-in tab. */
const SOURCED_ROLE_EMPLOYMENT_OPTIONS = EMPLOYMENT_TYPE_OPTIONS.filter(
  (option) => option.value !== 'fill-in',
);

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
  urgency: string;
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
    title: '',
    employmentType: 'permanent',
    wageRange: '',
    schedule: '',
    shiftDate: '',
    startTime: '',
    endTime: '',
    compensation: '',
    urgency: 'normal',
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
          employmentType:
            listing.employmentType === 'fill-in' ? 'temp' : listing.employmentType,
          wageRange: listing.wageRange ?? '',
          schedule: listing.schedule ?? '',
        }
      : {
          shiftDate: listing.shiftDate ?? '',
          startTime: listing.startTime?.slice(0, 5) ?? '',
          endTime: listing.endTime?.slice(0, 5) ?? '',
          compensation: listing.compensation ?? '',
          urgency: listing.urgency || 'normal',
        }),
  };
}

function validateSourcedForm(
  form: FormState,
  kind: SourcedListingKind,
): string | null {
  if (!form.displayClinicName.trim()) return 'Clinic name is required.';
  if (!form.displayCity.trim()) return 'City is required.';
  if (!form.displayProvince.trim()) return 'Province is required.';
  if (kind === 'role' && !form.title.trim()) return 'Role title is required.';
  const hasContact = Boolean(
    form.contactPhone.trim() || form.contactEmail.trim() || form.externalUrl.trim(),
  );
  if (!hasContact) return 'Add at least one contact method (phone, email, or URL).';
  return null;
}

function AdminFormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  required,
  minWidth = 160,
  fullWidth,
  keyboardType,
  autoCapitalize,
  autoCorrect,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  minWidth?: number;
  fullWidth?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const isFullWidth = fullWidth ?? Boolean(multiline);

  const styles = useThemedStyles((theme) => ({
    wrap: isFullWidth
      ? {
          gap: theme.spacing.sm,
          alignSelf: 'stretch' as const,
          width: '100%' as const,
        }
      : {
          gap: theme.spacing.sm,
          flexGrow: 1,
          flexShrink: 1,
        },
    row: formFieldInputRowStyle(theme, { multiline }),
    rowFocused: formFieldInputRowFocusedStyle(theme),
    input: {
      ...formFieldInputStyle(theme, { multiline }),
      flex: 1,
      minHeight: multiline ? 88 : undefined,
      textAlignVertical: multiline ? ('top' as const) : ('center' as const),
    },
  }));

  return (
    <View style={[styles.wrap, !isFullWidth && { flexBasis: minWidth, minWidth }]}>
      <FormFieldLabel label={label} required={required} />
      <View style={[styles.row, focused && styles.rowFocused]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.labelTertiary}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
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
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
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
      padding: spacing.lg,
      gap: spacing.lg,
      alignSelf: 'stretch',
      width: '100%',
    },
    formTitle: {
      fontFamily: fontSemibold,
      fontSize: 18,
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
    formSection: {
      gap: spacing.md,
    },
    formRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    formStack: {
      gap: spacing.md,
    },
    formActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
      paddingTop: spacing.xs,
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
    setListError(null);
    try {
      const payload = await listAdminSourcedListings('all');
      setRoles(payload.roles);
      setFillIns(payload.fillIns);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not load sourced listings.');
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
    setFormError(null);
  };

  const openEdit = (listing: SourcedListing) => {
    setFormMode({ mode: 'edit', kind: listing.kind, listing });
    setForm(formFromListing(listing));
    setFormError(null);
  };

  const closeForm = () => {
    setFormMode(null);
    setFormError(null);
    setSaving(false);
  };

  const patchForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  };

  const handleCompensationChange = useCallback((compensation: string) => {
    setForm((prev) => ({ ...prev, compensation }));
  }, []);

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
            urgency: form.urgency || 'normal',
          }),
    };
  };

  const handleSave = async () => {
    if (!formMode) return;
    const validationError = validateSourcedForm(form, formMode.kind);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);
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
      setFormError(err instanceof Error ? err.message : 'Could not save listing.');
      setSaving(false);
    }
  };

  const handleSetStatus = async (listing: SourcedListing, status: string) => {
    setListError(null);
    try {
      await setAdminSourcedListingStatus({
        kind: listing.kind,
        id: listing.id,
        status,
      });
      await load();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not update status.');
    }
  };

  const handleDelete = async (listing: SourcedListing) => {
    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm(`Delete sourced listing for ${listing.displayClinicName}?`)
        : false;
    if (!confirmed) return;
    setListError(null);
    try {
      await deleteAdminSourcedListing({ kind: listing.kind, id: listing.id });
      if (formMode?.listing?.id === listing.id) closeForm();
      await load();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not delete listing.');
    }
  };

  const formAccent = formMode?.kind === 'fill_in' ? 'secondary' : 'primary';
  const compensationKey = formMode
    ? `${formMode.mode}-${formMode.listing?.id ?? 'new'}-${formMode.kind}`
    : 'idle';

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

      {listError ? <FormErrorBanner message={listError} /> : null}

      {formMode ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {formMode.mode === 'create' ? 'New' : 'Edit'}{' '}
            {formMode.kind === 'role' ? 'sourced role' : 'sourced fill-in'}
          </Text>

          <View style={styles.formSection}>
            <FormSectionHeader
              icon="business-outline"
              label="Clinic & location"
              required
              accent={formAccent}
            />
            <View style={styles.formRow}>
              <AdminFormField
                label="Clinic name"
                required
                value={form.displayClinicName}
                onChangeText={(v) => patchForm('displayClinicName', v)}
                placeholder="e.g. Evergreen Dental"
                autoCapitalize="words"
                minWidth={220}
              />
              <AdminFormField
                label="City"
                required
                value={form.displayCity}
                onChangeText={(v) => patchForm('displayCity', v)}
                placeholder="e.g. Dartmouth"
                autoCapitalize="words"
                minWidth={160}
              />
            </View>
            <View style={styles.formStack}>
              <FormFieldLabel label="Province" required />
              <ChipSelector
                options={PROVINCE_OPTIONS}
                selected={form.displayProvince}
                horizontal={false}
                accent={formAccent}
                onChange={(value) =>
                  patchForm(
                    'displayProvince',
                    (Array.isArray(value) ? value[0] : value) as string,
                  )
                }
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <FormSectionHeader
              icon={formMode.kind === 'fill_in' ? 'calendar-outline' : 'briefcase-outline'}
              label="Listing details"
              required
              accent={formAccent}
            />
            <View style={styles.formStack}>
              <FormFieldLabel label="Role type" required />
              <ChipSelector
                options={ROLE_TYPE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                selected={form.roleType}
                horizontal={false}
                accent={formAccent}
                onChange={(value) =>
                  patchForm('roleType', (Array.isArray(value) ? value[0] : value) as string)
                }
              />
            </View>

            {formMode.kind === 'role' ? (
              <View style={styles.formStack}>
                <AdminFormField
                  label="Title"
                  required
                  value={form.title}
                  onChangeText={(v) => patchForm('title', v)}
                  placeholder="e.g. Full-time Hygienist"
                  autoCapitalize="sentences"
                  fullWidth
                />
                <View style={styles.formStack}>
                  <FormFieldLabel label="Employment type" required />
                  <ChipSelector
                    options={SOURCED_ROLE_EMPLOYMENT_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    selected={form.employmentType}
                    horizontal={false}
                    accent={formAccent}
                    onChange={(value) =>
                      patchForm(
                        'employmentType',
                        (Array.isArray(value) ? value[0] : value) as string,
                      )
                    }
                  />
                </View>
                <View style={styles.formRow}>
                  <AdminFormField
                    label="Wage range"
                    value={form.wageRange}
                    onChangeText={(v) => patchForm('wageRange', v)}
                    placeholder="e.g. $42–48/hr"
                    minWidth={220}
                  />
                  <AdminFormField
                    label="Schedule"
                    value={form.schedule}
                    onChangeText={(v) => patchForm('schedule', v)}
                    placeholder="e.g. Mon–Thu"
                    minWidth={220}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.formStack}>
                <ShiftDateInput
                  value={form.shiftDate}
                  onChange={(isoDate) => patchForm('shiftDate', isoDate)}
                  accent="secondary"
                />
                <TimeRangeInput
                  schedule={{ startTime: form.startTime, endTime: form.endTime }}
                  onChange={(schedule) => {
                    setForm((prev) => ({
                      ...prev,
                      startTime: schedule.startTime,
                      endTime: schedule.endTime,
                    }));
                    setFormError(null);
                  }}
                  accent="secondary"
                />
                <CompensationInput
                  key={compensationKey}
                  initialValue={form.compensation}
                  onChange={handleCompensationChange}
                />
                <View style={styles.formStack}>
                  <FormFieldLabel label="Urgency" />
                  <ChipSelector
                    options={URGENCY_OPTIONS.map((o) => ({
                      value: o.value,
                      label: o.label,
                    }))}
                    selected={form.urgency}
                    horizontal={false}
                    accent="secondary"
                    onChange={(value) =>
                      patchForm(
                        'urgency',
                        (Array.isArray(value) ? value[0] : value) as string,
                      )
                    }
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <FormSectionHeader
              icon="call-outline"
              label="Worker contact"
              required
              hint="At least one of phone, email, or URL is required."
              accent={formAccent}
            />
            <View style={styles.formRow}>
              <AdminFormField
                label="Phone"
                value={form.contactPhone}
                onChangeText={(v) => patchForm('contactPhone', v)}
                placeholder="902-555-0100"
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                minWidth={160}
              />
              <AdminFormField
                label="Email"
                value={form.contactEmail}
                onChangeText={(v) => patchForm('contactEmail', v)}
                placeholder="hiring@clinic.ca"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                minWidth={200}
              />
              <AdminFormField
                label="External URL"
                value={form.externalUrl}
                onChangeText={(v) => patchForm('externalUrl', v)}
                placeholder="https://…"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                minWidth={220}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <FormSectionHeader
              icon="document-text-outline"
              label="Notes"
              accent={formAccent}
            />
            <AdminFormField
              label="Description"
              value={form.description}
              onChangeText={(v) => patchForm('description', v)}
              placeholder="Shown to workers on the listing"
              multiline
              fullWidth
            />
            <AdminFormField
              label="Admin notes"
              value={form.adminNotes}
              onChangeText={(v) => patchForm('adminNotes', v)}
              placeholder="Internal only — permission date, original posting URL…"
              multiline
              fullWidth
            />
          </View>

          <FormErrorBanner message={formError} />

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
