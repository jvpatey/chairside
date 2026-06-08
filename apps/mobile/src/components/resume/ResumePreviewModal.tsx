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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  webHover,
  webIconButtonHoverStyles,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { ResumePdfViewer } from '@/components/resume/ResumePdfViewer';
import { isNativePdfViewerAvailable } from '@/lib/nativePdfViewer';
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
  const canUseNativePdf = isNativePdfViewerAvailable();
  const canShowInlinePdf = canUseNativePdf || Platform.OS === 'web';

  useEffect(() => {
    if (localUri && canShowInlinePdf) {
      setIsPdfLoading(true);
    } else {
      setIsPdfLoading(false);
    }
  }, [canShowInlinePdf, localUri]);

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
    iconAction: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      ...webPointer(),
    },
    iconActionHovered: webIconButtonHoverStyles(colors),
    textActionPressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    textAction: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    textActionHovered: webTextLinkHoverStyles(colors),
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
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
    },
  }));

  const handleShare = async () => {
    if (!localUri) return;

    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = localUri;
      link.download = fileName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) return;

    await Sharing.shareAsync(localUri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: fileName,
    });
  };

  const showPdf = localUri && !error && !isLoading && canShowInlinePdf;
  const showExpoGoFallback = localUri && !error && !isLoading && !canShowInlinePdf;

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
                accessibilityLabel={Platform.OS === 'web' ? 'Download resume' : 'Share resume'}
                style={({ pressed, hovered }) => [
                  styles.iconAction,
                  webHover(hovered, pressed, styles.iconActionHovered),
                  pressed && { opacity: 0.75 },
                ]}>
                <Ionicons
                  name={Platform.OS === 'web' ? 'download-outline' : 'share-outline'}
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            ) : null}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Done"
              style={({ pressed, hovered }) => [
                styles.textActionPressable,
                webHover(hovered, pressed, styles.textActionHovered),
              ]}>
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
              <ResumePdfViewer
                uri={localUri}
                style={styles.pdf}
                onLoadComplete={() => setIsPdfLoading(false)}
                onError={onPdfError}
              />
              {isPdfLoading ? (
                <View style={styles.loadingOverlay} pointerEvents="none">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : null}
            </>
          ) : null}

          {showExpoGoFallback ? (
            <View style={styles.centered}>
              <Text style={styles.statusText}>
                In-app PDF preview needs a development or TestFlight build. Share the resume to
                open it in another app.
              </Text>
              <OnboardingButton label="Share resume" onPress={() => void handleShare()} />
              <OnboardingButton label="Close" variant="secondary" onPress={onClose} />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
