import { loginStyles } from '@/app/styles/components/loginStyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authService } from '../services/firebase/authService';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { showAlert } from '../utils/platformAlert';

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
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

  const validateForm = async () => {
    if (isLoginMode) {
      if (!formData.email.trim()) {
        showAlert('Feil', 'E-postadresse er påkrevd');
        return false;
      }
      if (!formData.password.trim()) {
        showAlert('Feil', 'Passord er påkrevd');
        return false;
      }
      return true;
    }

    if (!formData.username.trim()) {
      showAlert('Feil', 'Brukernavn er påkrevd');
      return false;
    }

    if (!formData.password.trim()) {
      showAlert('Feil', 'Passord er påkrevd');
      return false;
    }

    if (!formData.name.trim()) {
      showAlert('Feil', 'Navn er påkrevd');
      return false;
    }

    if (!formData.email.trim()) {
      showAlert('Feil', 'E-postadresse er påkrevd');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlert('Feil', 'Passordene stemmer ikke overens');
      return false;
    }

    if (formData.password.length < 6) {
      showAlert('Feil', 'Passordet må være minst 6 tegn');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert('Feil', 'Ugyldig e-postadresse');
      return false;
    }

    try {
      const usernameExists = await authService.checkUsernameExists(formData.username);
      if (usernameExists) {
        showAlert('Feil', 'Brukernavnet er allerede tatt');
        return false;
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke opprette bruker. Prøv igjen senere.');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!formData.email.trim()) {
      showAlert('Feil', 'E-postadresse er påkrevd');
      return;
    }

    if (!formData.password.trim()) {
      showAlert('Feil', 'Passord er påkrevd');
      return;
    }

    setIsLoading(true);

    try {
      await authService.loginUser(formData.email, formData.password);
      setIsLoading(false);
      router.replace('/(tabs)/profile');
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Noe gikk galt under innlogging.';
      showAlert('Innlogging feilet', errorMessage);
    }
  };

  const handleRegister = async () => {
    if (!(await validateForm())) return;

    setIsLoading(true);

    try {
      await authService.createUser(formData);
      setIsLoading(false);
      router.replace('/(tabs)/profile');
    } catch (error) {
      setIsLoading(false);
      let errorMessage = 'Noe gikk galt under registrering.';
      if (error instanceof Error) {
        if (error.message.includes('email-already-in-use')) {
          errorMessage = 'E-postadressen er allerede i bruk';
        } else if (error.message.includes('weak-password')) {
          errorMessage = 'Passordet er for svakt';
        } else if (error.message.includes('invalid-email')) {
          errorMessage = 'Ugyldig e-postadresse';
        } else {
          errorMessage = error.message;
        }
      }
      showAlert('Registrering feilet', errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      confirmPassword: '',
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    resetForm();
  };

  return (
    <KeyboardAvoidingView
      style={[
        Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container,
        loginStyles.darkContainer,
        { padding: 0 }
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          globalStyles.scrollContent,
          loginStyles.screenContent,
          !isLoginMode && loginStyles.screenContentRegister,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={loginStyles.backgroundLayer} pointerEvents="none">
          <LinearGradient
            colors={['#0B0F1A', '#02040A']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={loginStyles.backgroundGradient}
          />
        </View>

        <View style={loginStyles.brandSection}>
          <Image
            source={require('../../assets/images/logo/Logo_nobg_shdw.png')}
            style={loginStyles.brandLogo}
            resizeMode="contain"
          />
          <Text style={loginStyles.appName}>BetABeer</Text>
          <Text style={loginStyles.welcomeText}>
            {isLoginMode ? 'Velkommen tilbake!' : 'Opprett ny bruker'}
          </Text>
        </View>

        <View style={loginStyles.cardWrapper}>
          <View style={loginStyles.cardBorderFade} pointerEvents="none" />

          <View style={loginStyles.authCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={loginStyles.cardHighlight}
              pointerEvents="none"
            />

            <LinearGradient
              colors={['rgba(31, 36, 51, 0.98)', 'rgba(18, 22, 33, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={loginStyles.authCardGradient}
            >
            <View
              style={loginStyles.modeSwitchContainer}
              onLayout={(event) => setModeSwitchWidth(event.nativeEvent.layout.width)}
            >
              {modeSwitchWidth > 0 && (
                <Animated.View
                  style={[
                    loginStyles.modeSwitchIndicator,
                    {
                      width: (modeSwitchWidth - 8) / 2,
                      transform: [
                        {
                          translateX: modeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, (modeSwitchWidth - 8) / 2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}

              <TouchableOpacity
                style={[loginStyles.modeButton, isLoginMode && loginStyles.modeButtonActive]}
                onPress={() => {
                  if (!isLoginMode) {
                    toggleMode();
                  }
                }}
              >
                <Text style={[loginStyles.modeButtonText, isLoginMode && loginStyles.modeButtonTextActive]}>
                  Logg inn
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[loginStyles.modeButton, !isLoginMode && loginStyles.modeButtonActive]}
                onPress={() => {
                  if (isLoginMode) {
                    toggleMode();
                  }
                }}
              >
                <Text style={[loginStyles.modeButtonText, !isLoginMode && loginStyles.modeButtonTextActive]}>
                  Registrer deg
                </Text>
              </TouchableOpacity>
            </View>

            {isLoginMode ? (
              <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                <Text style={loginStyles.fieldLabel}>E-postadresse</Text>
                <View style={[loginStyles.inputShell, activeField === 'email' && loginStyles.inputShellFocused]}>
                  <TextInput
                    style={[globalStyles.input, loginStyles.authInput]}
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    onFocus={() => setActiveField('email')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Skriv inn e-postadresse"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            ) : (
              <>
                <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                  <Text style={loginStyles.fieldLabel}>Brukernavn</Text>
                  <View style={[loginStyles.inputShell, activeField === 'username' && loginStyles.inputShellFocused]}>
                    <TextInput
                      style={[globalStyles.input, loginStyles.authInput]}
                      value={formData.username}
                      onChangeText={(text) => setFormData({ ...formData, username: text })}
                      onFocus={() => setActiveField('username')}
                      onBlur={() => setActiveField(null)}
                      placeholder="Skriv inn brukernavn"
                      placeholderTextColor={theme.colors.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                  <Text style={loginStyles.fieldLabel}>Navn</Text>
                  <View style={[loginStyles.inputShell, activeField === 'name' && loginStyles.inputShellFocused]}>
                    <TextInput
                      style={[globalStyles.input, loginStyles.authInput]}
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                      onFocus={() => setActiveField('name')}
                      onBlur={() => setActiveField(null)}
                      placeholder="Skriv inn navn"
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                  </View>
                </View>
                <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                  <Text style={loginStyles.fieldLabel}>E-postadresse</Text>
                  <View style={[loginStyles.inputShell, activeField === 'registerEmail' && loginStyles.inputShellFocused]}>
                    <TextInput
                      style={[globalStyles.input, loginStyles.authInput]}
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      onFocus={() => setActiveField('registerEmail')}
                      onBlur={() => setActiveField(null)}
                      placeholder="Skriv inn e-postadresse"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
              <Text style={loginStyles.fieldLabel}>Passord</Text>
              <View style={[loginStyles.inputShellWithIcon, activeField === 'password' && loginStyles.inputShellFocused]}>
                <TextInput
                  style={[globalStyles.input, loginStyles.authInput, loginStyles.authInputWithIcon]}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  onFocus={() => setActiveField('password')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Skriv inn passord"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="oneTimeCode"
                />
                <TouchableOpacity
                  style={loginStyles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!isLoginMode && (
              <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                <Text style={loginStyles.fieldLabel}>Bekreft passord</Text>
                <View style={[loginStyles.inputShellWithIcon, activeField === 'confirmPassword' && loginStyles.inputShellFocused]}>
                  <TextInput
                    style={[globalStyles.input, loginStyles.authInput, loginStyles.authInputWithIcon]}
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                    onFocus={() => setActiveField('confirmPassword')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Bekreft passord"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="oneTimeCode"
                  />
                  <TouchableOpacity
                    style={loginStyles.eyeButton}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                loginStyles.ctaButton,
                isLoading && globalStyles.disabledButton,
              ]}
              onPress={isLoginMode ? handleLogin : handleRegister}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#D4AF37', '#F6D365']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={loginStyles.ctaGradient}
              >
                <View style={loginStyles.ctaContentRow}>
                  {isLoading && <ActivityIndicator size="small" color="#1E1806" style={loginStyles.ctaLoader} />}
                  <Text style={[globalStyles.primaryButtonText, loginStyles.ctaButtonText]}>
                    {isLoading
                      ? isLoginMode
                        ? 'Logger inn...'
                        : 'Oppretter...'
                      : isLoginMode
                        ? 'Logg inn'
                        : 'Opprett bruker'
                    }
                  </Text>
                </View>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    loginStyles.ctaShineSweep,
                    {
                      transform: [
                        {
                          translateX: shineAnim.interpolate({
                            inputRange: [-1, 1.2],
                            outputRange: [-220, 280],
                          }),
                        },
                        { skewX: '-20deg' },
                      ],
                    },
                  ]}
                />
              </LinearGradient>
            </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;