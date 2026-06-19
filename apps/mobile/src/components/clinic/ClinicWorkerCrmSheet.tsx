import {
  CLINIC_WORKER_CRM_PRESET_TAGS,
  formatClinicWorkerCrmFollowUpLabel,
  getClinicWorkerCrmTagLabel,
  hasClinicWorkerCrmContent,
  isClinicWorkerCrmFollowUpDue,
  type ClinicWorkerCrmPresetTag,
} from '@chairside/config';
import { upsertClinicWorkerCrmRecord, type ClinicWorkerCrmRecord } from '@chairside/api';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { WebDateField } from '@/components/clinic/WebDateTimeField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { PillBadge } from '@/components/ui/PillBadge';
import { addDays, parseISODate, startOfDay, toISODate } from '@/lib/dates';
import { useTheme, useThemedStyles } from '@/theme';

type ClinicWorkerCrmSheetProps = {
  visible: boolean;
  clinicId: string;
  workerId: string;
  workerName: string;
  record: ClinicWorkerCrmRecord | null;
  onSaved: () => void;
  onClose: () => void;
};

function resolveInitialFollowUpDate(record: ClinicWorkerCrmRecord | null): Date | null {
  if (!record?.follow_up_at) return null;
  const date = startOfDay(new Date(record.follow_up_at));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function ClinicWorkerCrmSheet({
  visible,
  clinicId,
  workerId,
  workerName,
  record,
  onSaved,
  onClose,
}: ClinicWorkerCrmSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<ClinicWorkerCrmPresetTag[]>([]);
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setNote(record?.note?.trim() ?? '');
    setTags((record?.tags ?? []).filter((tag): tag is ClinicWorkerCrmPresetTag =>
      CLINIC_WORKER_CRM_PRESET_TAGS.some((preset) => preset.value === tag),
    ));
    setFollowUpDate(resolveInitialFollowUpDate(record));
    setShowDatePicker(false);
    setIsSaving(false);
  }, [record, visible]);

  const followUpLabel = useMemo(
    () => formatClinicWorkerCrmFollowUpLabel(followUpDate?.toISOString() ?? null),
    [followUpDate],
  );

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      maxHeight: '92%',
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.sm,
    },
    header: {
      gap: spacing.xs,
    },
    title: {
      ...typography.title,
      fontSize: 22,
      lineHeight: 28,
    },
    subtitle: {
      ...typography.body,
      color: colors.labelSecondary,
    },
    scroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    scrollContent: {
      gap: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    fieldBlock: {
      gap: spacing.sm,
    },
    fieldLabel: {
      ...typography.label,
      color: colors.labelSecondary,
      textTransform: 'uppercase',
    },
    noteInput: {
      minHeight: 120,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...typography.body,
      color: colors.labelPrimary,
      textAlignVertical: 'top',
    },
    pickerButton: {
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 2,
    },
    pickerButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    pickerButtonText: {
      ...typography.body,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    pickerButtonHint: {
      fontSize: 13,
      color: colors.labelTertiary,
    },
    quickDates: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    footer: {
      gap: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
  }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertClinicWorkerCrmRecord({
        clinicId,
        workerId,
        note: note.trim() || null,
        tags,
        followUpAt: followUpDate ? startOfDay(followUpDate).toISOString() : null,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
      onClose();
    } catch (error) {
      Alert.alert(
        'Could not save notes',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (!selectedDate) return;
    setFollowUpDate(startOfDay(selectedDate));
  };

  const dateLabel = followUpDate
    ? followUpDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No follow-up date';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close private notes editor"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Private notes</Text>
            <Text style={styles.subtitle}>
              {workerName} · Visible only to your clinic
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Tags</Text>
              <ChipSelector
                options={[...CLINIC_WORKER_CRM_PRESET_TAGS]}
                selected={tags}
                multiple
                onChange={(value) => setTags(value as ClinicWorkerCrmPresetTag[])}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Internal note</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Add context for your team…"
                placeholderTextColor={colors.labelTertiary}
                multiline
                maxLength={2000}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Follow-up reminder</Text>
              {Platform.OS === 'web' ? (
                <WebDateField
                  value={followUpDate ? toISODate(followUpDate) : ''}
                  min={toISODate(startOfDay(new Date()))}
                  onChange={(iso) => {
                    if (!iso) {
                      setFollowUpDate(null);
                      return;
                    }
                    const date = parseISODate(iso);
                    setFollowUpDate(date ? startOfDay(date) : null);
                  }}
                />
              ) : (
                <>
                  <Pressable
                    style={[styles.pickerButton, showDatePicker && styles.pickerButtonActive]}
                    onPress={() => setShowDatePicker((current) => !current)}
                    accessibilityRole="button">
                    <Text style={styles.pickerButtonText}>{dateLabel}</Text>
                    <Text style={styles.pickerButtonHint}>
                      {followUpLabel ?? 'Tap to choose a follow-up date'}
                    </Text>
                  </Pressable>
                  {showDatePicker ? (
                    <DateTimePicker
                      value={followUpDate ?? addDays(startOfDay(new Date()), 1)}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      minimumDate={startOfDay(new Date())}
                      onChange={handleDateChange}
                    />
                  ) : null}
                </>
              )}
              <View style={styles.quickDates}>
                <OnboardingButton
                  label="Today"
                  variant="secondary"
                  onPress={() => setFollowUpDate(startOfDay(new Date()))}
                />
                <OnboardingButton
                  label="Tomorrow"
                  variant="secondary"
                  onPress={() => setFollowUpDate(addDays(startOfDay(new Date()), 1))}
                />
                <OnboardingButton
                  label="Next week"
                  variant="secondary"
                  onPress={() => setFollowUpDate(addDays(startOfDay(new Date()), 7))}
                />
                <OnboardingButton
                  label="Clear"
                  variant="secondary"
                  onPress={() => setFollowUpDate(null)}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <OnboardingButton
              label={isSaving ? 'Saving…' : 'Save private notes'}
              disabled={isSaving}
              onPress={() => void handleSave()}
            />
            <OnboardingButton label="Cancel" variant="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

type ClinicWorkerCrmBadgesProps = {
  record: ClinicWorkerCrmRecord | null;
  compact?: boolean;
};

export function ClinicWorkerCrmBadges({ record, compact = false }: ClinicWorkerCrmBadgesProps) {
  const { colors } = useTheme();

  if (!hasClinicWorkerCrmContent(record)) return null;

  const followUpLabel = formatClinicWorkerCrmFollowUpLabel(record?.follow_up_at);
  const followUpDue = isClinicWorkerCrmFollowUpDue(record?.follow_up_at);

  return (
    <BadgeRow>
      {(record?.tags ?? []).map((tag) => (
        <PillBadge
          key={tag}
          label={getClinicWorkerCrmTagLabel(tag)}
          color={colors.labelPrimary}
          backgroundColor={colors.backgroundGrouped}
          borderColor={colors.separator}
          size={compact ? 'sm' : 'md'}
        />
      ))}
      {followUpLabel ? (
        <PillBadge
          label={followUpLabel}
          color={followUpDue ? colors.destructive : colors.primary}
          backgroundColor={followUpDue ? `${colors.destructive}1A` : colors.primarySubtle}
          borderColor={followUpDue ? colors.destructive : colors.primary}
          size={compact ? 'sm' : 'md'}
        />
      ) : null}
    </BadgeRow>
  );
}

type ClinicWorkerCrmSectionProps = {
  record: ClinicWorkerCrmRecord | null;
  onEdit: () => void;
};

export function ClinicWorkerCrmSection({ record, onEdit }: ClinicWorkerCrmSectionProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    note: {
      ...typography.body,
      color: colors.labelPrimary,
      lineHeight: 22,
    },
    empty: {
      ...typography.body,
      color: colors.labelSecondary,
    },
    actions: {
      marginTop: spacing.sm,
    },
  }));

  const note = record?.note?.trim();

  return (
    <>
      <ClinicWorkerCrmBadges record={record} />
      {note ? (
        <Text style={styles.note}>{note}</Text>
      ) : (
        <Text style={styles.empty}>No internal note yet.</Text>
      )}
      <View style={styles.actions}>
        <OnboardingButton
          label={hasClinicWorkerCrmContent(record) ? 'Edit private notes' : 'Add private notes'}
          variant="secondary"
          onPress={onEdit}
        />
      </View>
    </>
  );
}
