import {
  CLINIC_WORKER_CRM_PRESET_TAGS,
  formatClinicWorkerCrmFollowUpLabel,
  type ClinicWorkerCrmPresetTag,
} from '@chairside/config';
import { upsertClinicWorkerCrmRecord, type ClinicWorkerCrmRecord } from '@chairside/api';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { WebDateField } from '@/components/clinic/WebDateTimeField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  adaptiveSheetFooter,
  adaptiveSheetHeader,
  adaptiveSheetRoot,
  adaptiveSheetScroll,
  adaptiveSheetScrollContent,
  adaptiveSheetTitle,
} from '@/lib/adaptiveSheetBodyStyles';
import { addDays, parseISODate, startOfDay, toISODate } from '@/lib/dates';
import { useTheme, useThemedStyles } from '@/theme';

export type ClinicWorkerCrmSheetProps = {
  visible: boolean;
  clinicId: string;
  workerId: string;
  workerName: string;
  record: ClinicWorkerCrmRecord | null;
  onSaved: () => void;
  onClose: () => void;
  onBillingError?: (error: unknown) => boolean;
  variant?: 'sheet' | 'dialog';
};

function resolveInitialFollowUpDate(record: ClinicWorkerCrmRecord | null): Date | null {
  if (!record?.follow_up_at) return null;
  const date = startOfDay(new Date(record.follow_up_at));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function ClinicWorkerCrmSheetBody({
  visible,
  clinicId,
  workerId,
  workerName,
  record,
  onSaved,
  onClose,
  onBillingError,
  variant = 'sheet',
}: ClinicWorkerCrmSheetProps) {
  const { colors } = useTheme();
  const isDialog = variant === 'dialog';
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
      gap: spacing.sm,
      ...adaptiveSheetRoot(isDialog),
    },
    header: {
      gap: spacing.xs,
      paddingBottom: isDialog ? spacing.md : 0,
      ...adaptiveSheetHeader(isDialog, colors),
    },
    title: adaptiveSheetTitle(isDialog, colors, {
      ...typography.title,
      fontSize: 22,
      lineHeight: 28,
    }),
    subtitle: {
      ...typography.body,
      color: colors.labelSecondary,
    },
    scroll: adaptiveSheetScroll(isDialog, 560),
    scrollContent: adaptiveSheetScrollContent(isDialog, {
      gap: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    }),
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
      ...adaptiveSheetFooter(isDialog, colors),
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
      if (onBillingError?.(error)) {
        onClose();
        return;
      }
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
    <View style={styles.root}>
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
  );
}
