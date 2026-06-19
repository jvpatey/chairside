import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type WorkerMapPinProps = {
  label: string;
  saved?: boolean;
  onPress?: () => void;
};

export function WorkerMapPin({ label, saved = false, onPress }: WorkerMapPinProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    pressable: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    pin: {
      minWidth: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: saved ? colors.secondary : colors.primary,
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
    },
    label: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
  }));

  const pin = (
    <View style={styles.pin}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  if (!onPress) return pin;

  // MarkerView on iOS does not reliably fire onPress; onPressIn works inside the child.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} postings at clinic`}
      onPressIn={onPress}
      hitSlop={10}
      style={styles.pressable}
    >
      {pin}
    </Pressable>
  );
}

type WorkerMapWorkerPinProps = {
  size?: number;
};

export function WorkerMapWorkerPin({ size = 14 }: WorkerMapWorkerPinProps) {
  const styles = useThemedStyles(({ colors }) => ({
    dot: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surface,
    },
  }));

  return <View style={styles.dot} />;
}
