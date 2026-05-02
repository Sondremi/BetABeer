import React from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { loginStyles } from '../../../styles/components/loginStyles';
import { globalStyles } from '../../../styles/globalStyles';

type LoginModeSwitchProps = {
  isLoginMode: boolean;
  modeAnim: Animated.Value;
  modeSwitchWidth: number;
  setModeSwitchWidth: (width: number) => void;
  onSwitchToLogin: () => void;
  onSwitchToRegister: () => void;
};

const LoginModeSwitch = ({
  isLoginMode,
  modeAnim,
  modeSwitchWidth,
  setModeSwitchWidth,
  onSwitchToLogin,
  onSwitchToRegister,
}: LoginModeSwitchProps) => {
  return (
    <View
      style={loginStyles.modeSwitchContainer}
      onLayout={(event) => setModeSwitchWidth(event.nativeEvent.layout.width)}
    >
      {modeSwitchWidth > 0 && (
        <Animated.View
          style={[
            loginStyles.modeSwitchIndicator,
            {
              width: modeSwitchWidth / 2,
              transform: [
                {
                  translateX: modeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, modeSwitchWidth / 2],
                  }),
                },
              ],
            },
          ]}
        />
      )}

      <TouchableOpacity
        style={[loginStyles.modeButton, isLoginMode && loginStyles.modeButtonActive]}
        onPress={onSwitchToLogin}
      >
        <Text style={[loginStyles.modeButtonText, isLoginMode && globalStyles.primaryColorText]}>Logg inn</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[loginStyles.modeButton, loginStyles.modeButtonDivider, !isLoginMode && loginStyles.modeButtonActive]}
        onPress={onSwitchToRegister}
      >
        <Text style={[loginStyles.modeButtonText, !isLoginMode && globalStyles.primaryColorText]}>Registrer deg</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginModeSwitch;
