import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useTheme, useThemedStyles } from '@/theme';

type ResumePreviewModalProps = {
  visible: boolean;
  fileName: string;
  localUri: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onPdfError: (message: string) => void;
};

export function ResumePreviewModal({
  visible,
  fileName,
  localUri,
  isLoading,
  error,
  onClose,
  onRetry,
  onPdfError,
}: ResumePreviewModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  useEffect(() => {
    if (localUri) {
      setIsPdfLoading(true);
    } else {
      setIsPdfLoading(false);
    }
  }, [localUri]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      gap: spacing.sm,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    textAction: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    body: {
      flex: 1,
    },
    pdf: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    statusText: typography.subtitle,
    errorText: {
      ...typography.body,
      color: colors.destructive,
      textAlign: 'center',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.08)',
    },
  }));

  const handleShare = async () => {
    if (!localUri) return;

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) return;

    await Sharing.shareAsync(localUri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: fileName,
    });
  };

  const showPdf = localUri && !error && !isLoading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {fileName}
          </Text>
          <View style={styles.headerActions}>
            {localUri ? (
              <Pressable
                onPress={() => void handleShare()}
                accessibilityRole="button"
                accessibilityLabel="Share resume">
                <Ionicons name="share-outline" size={22} color={colors.primary} />
              </Pressable>
            ) : null}
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
              <Text style={styles.textAction}>Done</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.statusText}>Downloading resume…</Text>
            </View>
          ) : null}

          {!isLoading && error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
              <OnboardingButton label="Try again" onPress={onRetry} />
              <OnboardingButton label="Close" variant="secondary" onPress={onClose} />
            </View>
          ) : null}

          {showPdf ? (
            <>
              <Pdf
                source={{ uri: localUri, cache: false }}
                style={styles.pdf}
                trustAllCerts={Platform.OS === 'ios'}
                onLoadComplete={() => setIsPdfLoading(false)}
                onError={(pdfError) => {
                  setIsPdfLoading(false);
                  const message =
                    pdfError instanceof Error
                      ? pdfError.message
                      : 'Could not display this resume.';
                  onPdfError(message);
                }}
              />
              {isPdfLoading ? (
                <View style={styles.loadingOverlay} pointerEvents="none">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
