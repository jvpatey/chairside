import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  PanResponder,
  Platform,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  PROFILE_PHOTO_CROP_VIEWPORT,
  PROFILE_PHOTO_MAX_SCALE,
  PROFILE_PHOTO_MIN_SCALE,
  clampProfilePhotoTransform,
  getProfilePhotoDisplaySize,
  type ProfilePhotoCropTransform,
} from '@/lib/profilePhotoCrop';
import { webHover, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ProfilePhotoCropEditorContentProps = {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  isSaving?: boolean;
  onCancel: () => void;
  onConfirm: (transform: ProfilePhotoCropTransform) => void;
};

export function ProfilePhotoCropEditorContent({
  imageUri,
  imageWidth,
  imageHeight,
  isSaving = false,
  onCancel,
  onConfirm,
}: ProfilePhotoCropEditorContentProps) {
  const { colors } = useTheme();
  const [viewportSize, setViewportSize] = useState(PROFILE_PHOTO_CROP_VIEWPORT);
  const [transform, setTransform] = useState<ProfilePhotoCropTransform>({
    scale: PROFILE_PHOTO_MIN_SCALE,
    translateX: 0,
    translateY: 0,
  });
  const transformRef = useRef(transform);
  const panStartRef = useRef(transform);
  const webDragRef = useRef<{
    startX: number;
    startY: number;
    transform: ProfilePhotoCropTransform;
  } | null>(null);
  transformRef.current = transform;

  const clampedTransform = useMemo(
    () => clampProfilePhotoTransform(imageWidth, imageHeight, viewportSize, transform),
    [imageHeight, imageWidth, transform, viewportSize],
  );

  const displaySize = useMemo(
    () => getProfilePhotoDisplaySize(imageWidth, imageHeight, viewportSize, clampedTransform),
    [clampedTransform, imageHeight, imageWidth, viewportSize],
  );

  const imageOffset = {
    left: viewportSize / 2 - displaySize.width / 2 + clampedTransform.translateX,
    top: viewportSize / 2 - displaySize.height / 2 + clampedTransform.translateY,
  };

  const updateTransform = useCallback(
    (next: ProfilePhotoCropTransform) => {
      const clamped = clampProfilePhotoTransform(imageWidth, imageHeight, viewportSize, next);
      transformRef.current = clamped;
      setTransform(clamped);
    },
    [imageHeight, imageWidth, viewportSize],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isSaving,
        onMoveShouldSetPanResponder: () => !isSaving,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          panStartRef.current = transformRef.current;
        },
        onPanResponderMove: (_, gestureState) => {
          updateTransform({
            ...panStartRef.current,
            translateX: panStartRef.current.translateX + gestureState.dx,
            translateY: panStartRef.current.translateY + gestureState.dy,
          });
        },
        onPanResponderRelease: () => {
          updateTransform(transformRef.current);
        },
      }),
    [imageHeight, imageWidth, isSaving, updateTransform, viewportSize],
  );

  const handleWebMouseMove = useCallback(
    (event: MouseEvent) => {
      const drag = webDragRef.current;
      if (!drag) return;

      updateTransform({
        ...drag.transform,
        translateX: drag.transform.translateX + (event.clientX - drag.startX),
        translateY: drag.transform.translateY + (event.clientY - drag.startY),
      });
    },
    [updateTransform],
  );

  const handleWebMouseUp = useCallback(() => {
    webDragRef.current = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.removeEventListener('mousemove', handleWebMouseMove);
      window.removeEventListener('mouseup', handleWebMouseUp);
    }
    updateTransform(transformRef.current);
  }, [handleWebMouseMove, updateTransform]);

  const handleWebMouseDown = useCallback(
    (event: { preventDefault?: () => void; nativeEvent: MouseEvent }) => {
      if (isSaving || Platform.OS !== 'web') return;

      event.preventDefault?.();
      event.nativeEvent.preventDefault?.();
      webDragRef.current = {
        startX: event.nativeEvent.clientX,
        startY: event.nativeEvent.clientY,
        transform: transformRef.current,
      };
      window.addEventListener('mousemove', handleWebMouseMove);
      window.addEventListener('mouseup', handleWebMouseUp);
    },
    [handleWebMouseMove, handleWebMouseUp, isSaving],
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    return () => {
      window.removeEventListener('mousemove', handleWebMouseMove);
      window.removeEventListener('mouseup', handleWebMouseUp);
    };
  }, [handleWebMouseMove, handleWebMouseUp]);

  const cropFrameStyle = useMemo(
    () => ({
      width: viewportSize,
      height: viewportSize,
      borderRadius: viewportSize / 2,
    }),
    [viewportSize],
  );

  const cropSurfaceStyle = useMemo(
    () => ({
      width: viewportSize,
      height: viewportSize,
    }),
    [viewportSize],
  );

  const imageStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      width: displaySize.width,
      height: displaySize.height,
      left: imageOffset.left,
      top: imageOffset.top,
    }),
    [displaySize.height, displaySize.width, imageOffset.left, imageOffset.top],
  );

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: {
      gap: spacing.lg,
    },
    heading: {
      gap: spacing.xs,
    },
    title: {
      ...typography.title,
      fontSize: 20,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.subtitle,
      textAlign: 'center',
      color: colors.labelSecondary,
    },
    cropFrame: {
      alignSelf: 'center',
      overflow: 'hidden',
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    cropSurface: {
      ...webOnlyStyle({
        cursor: isSaving ? 'default' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      } as const),
    },
    image: {
      position: 'absolute',
    },
    zoomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    zoomButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
      ...webPointer(),
    },
    zoomButtonHovered: {
      backgroundColor: colors.primarySubtle,
      borderColor: `${colors.primary}33`,
    },
    zoomButtonPressed: {
      opacity: 0.85,
    },
    zoomButtonDisabled: {
      opacity: 0.45,
    },
    zoomLabel: {
      ...typography.body,
      minWidth: 72,
      textAlign: 'center',
      color: colors.labelSecondary,
    },
    actions: {
      gap: spacing.sm,
    },
    secondaryAction: {
      alignSelf: 'center',
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    secondaryActionText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  const handleViewportLayout = (event: LayoutChangeEvent) => {
    const nextSize = Math.round(event.nativeEvent.layout.width);
    if (nextSize > 0 && nextSize !== viewportSize) {
      setViewportSize(nextSize);
      updateTransform(transformRef.current);
    }
  };

  const adjustZoom = (delta: number) => {
    updateTransform({
      ...transformRef.current,
      scale: transformRef.current.scale + delta,
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <Text style={styles.title}>Adjust your photo</Text>
        <Text style={styles.subtitle}>Drag to reposition and zoom to frame your face.</Text>
      </View>

      <View style={[styles.cropFrame, cropFrameStyle]} onLayout={handleViewportLayout}>
        <View
          style={[styles.cropSurface, cropSurfaceStyle]}
          {...(Platform.OS === 'web'
            ? { onMouseDown: isSaving ? undefined : handleWebMouseDown }
            : panResponder.panHandlers)}
        >
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, imageStyle]}
            accessibilityLabel="Photo preview"
            pointerEvents="none"
            // @ts-expect-error web-only prop to prevent browser image drag
            draggable={false}
          />
        </View>
      </View>

      <View style={styles.zoomRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          disabled={isSaving || clampedTransform.scale <= PROFILE_PHOTO_MIN_SCALE}
          onPress={() => adjustZoom(-0.1)}
          style={({ pressed, hovered }) => [
            styles.zoomButton,
            webHover(hovered, pressed, styles.zoomButtonHovered),
            pressed && styles.zoomButtonPressed,
            (isSaving || clampedTransform.scale <= PROFILE_PHOTO_MIN_SCALE) &&
              styles.zoomButtonDisabled,
          ]}
        >
          <Text style={{ fontSize: 22, fontWeight: '600', color: colors.labelPrimary }}>−</Text>
        </Pressable>
        <Text style={styles.zoomLabel}>{Math.round(clampedTransform.scale * 100)}%</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          disabled={isSaving || clampedTransform.scale >= PROFILE_PHOTO_MAX_SCALE}
          onPress={() => adjustZoom(0.1)}
          style={({ pressed, hovered }) => [
            styles.zoomButton,
            webHover(hovered, pressed, styles.zoomButtonHovered),
            pressed && styles.zoomButtonPressed,
            (isSaving || clampedTransform.scale >= PROFILE_PHOTO_MAX_SCALE) &&
              styles.zoomButtonDisabled,
          ]}
        >
          <Text style={{ fontSize: 22, fontWeight: '600', color: colors.labelPrimary }}>+</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <OnboardingButton
          label={isSaving ? 'Saving…' : 'Use photo'}
          disabled={isSaving}
          onPress={() => onConfirm(clampedTransform)}
        />
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={onCancel}
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryActionText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
