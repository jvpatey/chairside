import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

type ChipScrollFadeOverlayProps = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  fadeColor: string;
};

const FADE_WIDTH = 28;

export function ChipScrollFadeOverlay({
  canScrollLeft,
  canScrollRight,
  fadeColor,
}: ChipScrollFadeOverlayProps) {
  if (!canScrollLeft && !canScrollRight) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {canScrollLeft ? (
        <LinearGradient
          colors={[fadeColor, `${fadeColor}00`]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.leftFade}
        />
      ) : null}
      {canScrollRight ? (
        <LinearGradient
          colors={[`${fadeColor}00`, fadeColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.rightFade}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  leftFade: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: FADE_WIDTH,
  },
  rightFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: FADE_WIDTH,
  },
});
