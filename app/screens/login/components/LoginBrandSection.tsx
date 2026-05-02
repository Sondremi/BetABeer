import React from 'react';
import { Image, Text, View } from 'react-native';
import { loginStyles } from '../../../styles/components/loginStyles';

type LoginBrandSectionProps = {
  isLoginMode: boolean;
};

const LoginBrandSection = ({ isLoginMode }: LoginBrandSectionProps) => {
  return (
    <View style={loginStyles.brandSection}>
      <Image
        source={require('../../../../assets/images/logo/Logo_nobg_shdw.png')}
        style={loginStyles.brandLogo}
        resizeMode="contain"
      />
      <Text style={loginStyles.appName}>BetABeer</Text>
      <Text style={loginStyles.welcomeText}>{isLoginMode ? 'Velkommen tilbake!' : 'Registrer deg'}</Text>
    </View>
  );
};

export default LoginBrandSection;
