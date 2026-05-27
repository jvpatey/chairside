import { scheduleApplicationInterview, type ClinicApplication } from '@chairside/api';
import { formatInterviewDateTime } from '@chairside/config';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  buildGoogleCalendarUrl,
  buildInterviewInviteTitle,
  buildInterviewShareMessage,
  type InterviewInviteInput,
} from '@/lib/calendarInvite';
import { addDays, startOfDay } from '@/lib/dates';
import { useTheme, useThemedStyles } from '@/theme';

const DURATION_OPTIONS = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
] as const;

type InterviewScheduleSheetProps = {
  visible: boolean;
  application: ClinicApplication;
  clinicName: string;
  defaultLocation?: string | null;
  onScheduled: () => void;
  onClose: () => void;
};

function defaultInterviewDate(): Date {
  const date = addDays(startOfDay(new Date()), 1);
  date.setHours(10, 0, 0, 0);
  return date;
}

export function InterviewScheduleSheet({
  visible,
  application,
  clinicName,
  defaultLocation,
  onScheduled,
  onClose,
}: InterviewScheduleSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [interviewAt, setInterviewAt] = useState(defaultInterviewDate);
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setInterviewAt(defaultInterviewDate());
    setDurationMinutes('45');
    setDetails('');
    setLocation(defaultLocation?.trim() ?? '');
    setShowDatePicker(false);
    setShowTimePicker(false);
    setIsSaving(false);
  }, [defaultLocation, visible]);

  const inviteInput = useMemo<InterviewInviteInput>(
    () => ({
      title: buildInterviewInviteTitle({
        clinicName,
        roleTitle: application.post_title,
      }),
      clinicName,
      roleTitle: application.post_title,
      interviewAt,
      durationMinutes: Number(durationMinutes),
      details,
      location,
    }),
    [application.post_title, clinicName, details, durationMinutes, interviewAt, location],
  );

  const previewLabel = formatInterviewDateTime(
    interviewAt.toISOString(),
    Number(durationMinutes),
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
      gap: spacing.md,
      maxHeight: '92%',
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
    },
    header: {
      gap: spacing.xs,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 24,
      color: colors.labelPrimary,
    },
    subtitle: typography.subtitle,
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    fieldBlock: {
      gap: spacing.xs,
    },
    pickerButton: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
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
    },
    pickerButtonHint: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600',
    },
    preview: {
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.xs,
    },
    previewLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    previewText: typography.body,
    detailsInput: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 96,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      color: colors.labelPrimary,
      textAlignVertical: 'top',
    },
    actions: {
      gap: spacing.sm,
    },
    doneText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      alignSelf: 'flex-end',
    },
    cancel: {
      paddingVertical: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
    },
    cancelLabel: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.labelPrimary,
    },
  }));

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed' || !date) return;
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (!date) return;

    setInterviewAt((current) => {
      const next = new Date(current);
      next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      return next;
    });
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'dismissed' || !date) return;
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }

    if (!date) return;

    setInterviewAt((current) => {
      const next = new Date(current);
      next.setHours(date.getHours(), date.getMinutes(), 0, 0);
      return next;
    });
  };

  const markInterviewSet = useCallback(async () => {
    if (interviewAt.getTime() <= Date.now()) {
      Alert.alert('Choose a future time', 'Interview must be scheduled in the future.');
      return;
    }

    setIsSaving(true);
    try {
      await scheduleApplicationInterview(application.id, {
        interviewAt: interviewAt.toISOString(),
        durationMinutes: Number(durationMinutes),
        details: [location.trim(), details.trim()].filter(Boolean).join('\n\n') || null,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onScheduled();
      onClose();
    } catch (error) {
      Alert.alert(
        'Could not save interview',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    application.id,
    details,
    durationMinutes,
    interviewAt,
    location,
    onClose,
    onScheduled,
  ]);

  const handleShareAndMark = useCallback(async () => {
    const message = buildInterviewShareMessage(inviteInput);
    const calendarUrl = buildGoogleCalendarUrl(inviteInput);

    try {
      await Share.share({
        message: Platform.OS === 'ios' ? message : `${message}\n${calendarUrl}`,
        url: Platform.OS === 'ios' ? calendarUrl : undefined,
        title: inviteInput.title,
      });
    } catch {
      return;
    }

    await markInterviewSet();
  }, [inviteInput, markInterviewSet]);

  const dateLabel = interviewAt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeLabel = interviewAt.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close interview scheduler"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Schedule interview</Text>
            <Text style={styles.subtitle}>
              {application.worker_display_name ?? 'Applicant'} · {application.post_title}
            </Text>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Date</Text>
            <Pressable
              style={[styles.pickerButton, showDatePicker && styles.pickerButtonActive]}
              onPress={() => {
                setShowTimePicker(false);
                setShowDatePicker((current) => !current);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.pickerButtonText}>{dateLabel}</Text>
              <Text style={styles.pickerButtonHint}>Tap to change date</Text>
            </Pressable>
            {showDatePicker ? (
              <>
                <DateTimePicker
                  value={interviewAt}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={startOfDay(new Date())}
                  onChange={handleDateChange}
                />
                {Platform.OS === 'ios' ? (
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.doneText}>Done</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Time</Text>
            <Pressable
              style={[styles.pickerButton, showTimePicker && styles.pickerButtonActive]}
              onPress={() => {
                setShowDatePicker(false);
                setShowTimePicker((current) => !current);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.pickerButtonText}>{timeLabel}</Text>
              <Text style={styles.pickerButtonHint}>Tap to change time</Text>
            </Pressable>
            {showTimePicker ? (
              <>
                <DateTimePicker
                  value={interviewAt}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                />
                {Platform.OS === 'ios' ? (
                  <Pressable onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.doneText}>Done</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Duration</Text>
            <ChipSelector
              options={[...DURATION_OPTIONS]}
              selected={durationMinutes}
              onChange={(value) => {
                if (Array.isArray(value)) return;
                setDurationMinutes(value);
              }}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Clinic address or meeting link"
              placeholderTextColor={colors.labelTertiary}
              style={styles.detailsInput}
              multiline
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Details for candidate</Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="What to bring, parking, contact person…"
              placeholderTextColor={colors.labelTertiary}
              style={styles.detailsInput}
              multiline
            />
          </View>

          {previewLabel ? (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Preview</Text>
              <Text style={styles.previewText}>{previewLabel}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <OnboardingButton
              label="Share invite & mark interview set"
              onPress={() => void handleShareAndMark()}
              disabled={isSaving}
            />
            <OnboardingButton
              label="Mark interview set"
              variant="secondary"
              onPress={() => void markInterviewSet()}
              disabled={isSaving}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            style={styles.cancel}
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
