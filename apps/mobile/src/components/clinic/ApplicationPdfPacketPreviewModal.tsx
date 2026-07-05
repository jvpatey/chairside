import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ResumePdfViewer } from '@/components/resume/ResumePdfViewer';
import { isNativePdfViewerAvailable } from '@/lib/nativePdfViewer';
import {
  printApplicationPdfPacket,
  resolveApplicationPdfDownloadUri,
  type ApplicationPdfPacketResult,
} from '@/lib/applicationPdfPacket';
import {
  webHover,
  webIconButtonHoverStyles,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ApplicationPdfPacketPreviewModalProps = {
  visible: boolean;
  candidateName: string;
  packet: ApplicationPdfPacketResult | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onPdfError: (message: string) => void;
};

export function ApplicationPdfPacketPreviewModal({
  visible,
  candidateName,
  packet,
  isLoading,
  error,
  onClose,
  onRetry,
  onPdfError,
}: ApplicationPdfPacketPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canUseNativePdf = isNativePdfViewerAvailable();
  const canShowInlinePdf = canUseNativePdf || Platform.OS === 'web';
  const localUri = packet?.uri ?? null;
  const fileName = packet?.fileName ?? 'candidate-packet.pdf';

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
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      gap: spacing.xs,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 17,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.labelSecondary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
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
      backgroundColor: colors.backgroundGrouped,
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
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      flexDirection: 'row',
      gap: spacing.sm,
    },
    footerButton: {
      flex: 1,
    },
  }));

  const handleShare = async () => {
    if (!localUri || !packet || isExporting) return;

    if (Platform.OS === 'web') {
      setIsExporting(true);
      try {
        const { uri: downloadUri, resumeMergeWarning } = await resolveApplicationPdfDownloadUri(packet);
        const link = document.createElement('a');
        link.href = downloadUri;
        link.download = fileName;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (resumeMergeWarning) {
          Alert.alert('Candidate packet ready', resumeMergeWarning);
        }
      } finally {
        setIsExporting(false);
      }
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

  const handlePrint = async () => {
    if (!localUri || !packet || isExporting) return;

    if (Platform.OS === 'web') {
      setIsExporting(true);
      try {
        const { resumeMergeWarning } = await printApplicationPdfPacket(packet);
        if (resumeMergeWarning) {
          Alert.alert('Candidate packet ready', resumeMergeWarning);
        }
      } finally {
        setIsExporting(false);
      }
      return;
    }

    await Print.printAsync({ uri: localUri });
  };

  const showPdf = localUri && !error && !isLoading && canShowInlinePdf;
  const showExpoGoFallback = localUri && !error && !isLoading && !canShowInlinePdf;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.title} numberOfLines={1}>
                Candidate summary
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {candidateName}
                {packet?.resumeAttached
                  ? packet.previewKind === 'html'
                    ? ' · Resume included in download'
                    : ' · Resume included'
                  : ''}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {localUri ? (
                <>
                  <Pressable
                    onPress={() => void handlePrint()}
                    accessibilityRole="button"
                    accessibilityLabel="Print packet"
                    style={({ pressed, hovered }) => [
                      styles.iconAction,
                      webHover(hovered, pressed, styles.iconActionHovered),
                      pressed && { opacity: 0.75 },
                    ]}>
                    <Ionicons name="print-outline" size={22} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => void handleShare()}
                    accessibilityRole="button"
                    accessibilityLabel={
                      Platform.OS === 'web' ? 'Download packet' : 'Share packet'
                    }
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
                </>
              ) : null}
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={({ pressed, hovered }) => [
                  styles.textActionPressable,
                  webHover(hovered, pressed, styles.textActionHovered),
                ]}>
                <Text style={styles.textAction}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.statusText}>Preparing candidate packet…</Text>
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
                In-app PDF preview needs a development or TestFlight build. Share the packet to
                open it in another app.
              </Text>
              <OnboardingButton label="Share packet" onPress={() => void handleShare()} />
              <OnboardingButton label="Close" variant="secondary" onPress={onClose} />
            </View>
          ) : null}
        </View>

        {localUri && !error && !isLoading ? (
          <View style={styles.footer}>
            <View style={styles.footerButton}>
              <OnboardingButton
                label={
                  isExporting
                    ? 'Preparing…'
                    : Platform.OS === 'web'
                      ? 'Download'
                      : 'Share'
                }
                variant="secondary"
                disabled={isExporting}
                onPress={() => void handleShare()}
              />
            </View>
            <View style={styles.footerButton}>
              <OnboardingButton
                label={isExporting ? 'Preparing…' : 'Print'}
                disabled={isExporting}
                onPress={() => void handlePrint()}
              />
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
