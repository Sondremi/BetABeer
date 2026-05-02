import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export const useLoginAnimations = (isLoginMode: boolean) => {
  const [modeSwitchWidth, setModeSwitchWidth] = useState(0);
  const shineAnim = useRef(new Animated.Value(-1)).current;
  const modeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1.2,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.delay(2100),
        Animated.timing(shineAnim, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [shineAnim]);

  useEffect(() => {
    Animated.timing(modeAnim, {
      toValue: isLoginMode ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isLoginMode, modeAnim]);

  return {
    modeAnim,
    modeSwitchWidth,
    setModeSwitchWidth,
    shineAnim,
  };
};
