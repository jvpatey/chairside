import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, View } from 'react-native';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];
const PARTICLE_COUNT = 36;

type Particle = {
  left: number;
  color: string;
  delay: number;
  drift: number;
};

function buildParticles(): Particle[] {
  const width = Dimensions.get('window').width;
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    left: Math.random() * width,
    color: COLORS[index % COLORS.length],
    delay: Math.random() * 400,
    drift: (Math.random() - 0.5) * 80,
  }));
}

export function ConfettiBurst({ active }: { active: boolean }) {
  const [particles] = useState(buildParticles);
  const progress = useRef(particles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) return;

    const animations = progress.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 2200,
        delay: particles[index].delay,
        useNativeDriver: true,
      }),
    );

    Animated.parallel(animations).start();
  }, [active, particles, progress]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}>
      {particles.map((particle, index) => {
        const translateY = progress[index].interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 320],
        });
        const translateX = progress[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.drift],
        });
        const opacity = progress[index].interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1, 0],
        });
        const rotate = progress[index].interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${180 + particle.drift}deg`],
        });

        return (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: particle.left,
              width: 8,
              height: 12,
              borderRadius: 2,
              backgroundColor: particle.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
