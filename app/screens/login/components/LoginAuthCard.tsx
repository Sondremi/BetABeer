import { loginScreenTokens, loginStyles } from '@/app/styles/components/loginStyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Animated, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import { INPUT_LIMITS } from '../../../utils/inputValidation';
import LoginModeSwitch from './LoginModeSwitch';

type LoginFormData = {
  username: string;
  password: string;
  name: string;
  email: string;
  confirmPassword: string;
};

type LoginAuthCardProps = {
  activeField: string | null;
  formData: LoginFormData;
  googleRequest: any;
  guestUsername: string;
  groupInviteId: string | null;
  isLoading: boolean;
  isLoginMode: boolean;
  modeAnim: Animated.Value;
  modeSwitchWidth: number;
  setActiveField: (field: string | null) => void;
  setFormData: React.Dispatch<React.SetStateAction<LoginFormData>>;
  setGuestUsername: (value: string) => void;
  setModeSwitchWidth: (width: number) => void;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  shineAnim: Animated.Value;
  showConfirmPassword: boolean;
  showPassword: boolean;
  onForgotPassword: () => void;
  onJoinAsGuest: () => void;
  onPrimaryAction: () => void;
  onGoogleLogin: () => void;
  onSwitchToLogin: () => void;
  onSwitchToRegister: () => void;
};

const LoginAuthCard = ({
  activeField,
  formData,
  googleRequest,
  guestUsername,
  groupInviteId,
  isLoading,
  isLoginMode,
  modeAnim,
  modeSwitchWidth,
  setActiveField,
  setFormData,
  setGuestUsername,
  setModeSwitchWidth,
  setShowConfirmPassword,
  setShowPassword,
  shineAnim,
  showConfirmPassword,
  showPassword,
  onForgotPassword,
  onJoinAsGuest,
  onPrimaryAction,
  onGoogleLogin,
  onSwitchToLogin,
  onSwitchToRegister,
}: LoginAuthCardProps) => {
  return (
    <View style={loginStyles.cardWrapper}>
      <View style={loginStyles.cardBorderFade} pointerEvents="none" />

      <View style={loginStyles.authCard}>
        <LinearGradient
          colors={loginScreenTokens.cardHighlightGradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={loginStyles.cardHighlight}
          pointerEvents="none"
        />

        <LinearGradient
          colors={loginScreenTokens.authCardGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={loginStyles.authCardGradient}
        >
          <LoginModeSwitch
            isLoginMode={isLoginMode}
            modeAnim={modeAnim}
            modeSwitchWidth={modeSwitchWidth}
            setModeSwitchWidth={setModeSwitchWidth}
            onSwitchToLogin={onSwitchToLogin}
            onSwitchToRegister={onSwitchToRegister}
          />

          <View style={loginStyles.authCardBody}>
            {isLoginMode ? (
              <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                <Text style={loginStyles.fieldLabel}>E-postadresse</Text>
                <View style={[globalStyles.inputShellDark, activeField === 'email' && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    style={[globalStyles.input, loginStyles.authInput]}
                    value={formData.email}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text.slice(0, INPUT_LIMITS.emailMax) }))}
                    onFocus={() => setActiveField('email')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Skriv inn e-postadresse"
                    placeholderTextColor={loginScreenTokens.placeholderTextColor}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={INPUT_LIMITS.emailMax}
                  />
                </View>
              </View>
            ) : (
              <>
                <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                  <Text style={loginStyles.fieldLabel}>Brukernavn</Text>
                  <View style={[globalStyles.inputShellDark, activeField === 'username' && globalStyles.inputShellFocusedGold]}>
                    <TextInput
                      style={[globalStyles.input, loginStyles.authInput]}
                      value={formData.username}
                      onChangeText={(text) => setFormData((prev) => ({ ...prev, username: text.slice(0, INPUT_LIMITS.usernameMax) }))}
                      onFocus={() => setActiveField('username')}
                      onBlur={() => setActiveField(null)}
                      placeholder="Skriv inn brukernavn"
                      placeholderTextColor={loginScreenTokens.placeholderTextColor}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={INPUT_LIMITS.usernameMax}
                    />
                  </View>
                </View>
                <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                  <Text style={loginStyles.fieldLabel}>Navn</Text>
                  <View style={[globalStyles.inputShellDark, activeField === 'name' && globalStyles.inputShellFocusedGold]}>
                    <TextInput
                      style={[globalStyles.input, loginStyles.authInput]}
                      value={formData.name}
                      onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text.slice(0, INPUT_LIMITS.profileNameMax) }))}
                      onFocus={() => setActiveField('name')}
                      onBlur={() => setActiveField(null)}
                      placeholder="Skriv inn navn"
                      placeholderTextColor={loginScreenTokens.placeholderTextColor}
                      maxLength={INPUT_LIMITS.profileNameMax}
                    />
                  </View>
                </View>
                <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                  <Text style={loginStyles.fieldLabel}>E-postadresse</Text>
                  <View style={[globalStyles.inputShellDark, activeField === 'registerEmail' && globalStyles.inputShellFocusedGold]}>
                    <TextInput
                      style={[globalStyles.input, loginStyles.authInput]}
                      value={formData.email}
                      onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text.slice(0, INPUT_LIMITS.emailMax) }))}
                      onFocus={() => setActiveField('registerEmail')}
                      onBlur={() => setActiveField(null)}
                      placeholder="Skriv inn e-postadresse"
                      placeholderTextColor={loginScreenTokens.placeholderTextColor}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={INPUT_LIMITS.emailMax}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
              <Text style={loginStyles.fieldLabel}>Passord</Text>
              <View style={[globalStyles.inputShellDark, loginStyles.inputShellWithIcon, activeField === 'password' && globalStyles.inputShellFocusedGold]}>
                <TextInput
                  style={[globalStyles.input, loginStyles.authInput, loginStyles.authInputWithIcon]}
                  value={formData.password}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text.slice(0, INPUT_LIMITS.passwordMax) }))}
                  onFocus={() => setActiveField('password')}
                  onBlur={() => setActiveField(null)}
                  placeholder="Skriv inn passord"
                  placeholderTextColor={loginScreenTokens.placeholderTextColor}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  maxLength={INPUT_LIMITS.passwordMax}
                />
                <TouchableOpacity style={loginStyles.eyeButton} onPress={() => setShowPassword((prev) => !prev)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={loginScreenTokens.iconTint}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!isLoginMode && (
              <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                <Text style={loginStyles.fieldLabel}>Bekreft passord</Text>
                <View style={[globalStyles.inputShellDark, loginStyles.inputShellWithIcon, activeField === 'confirmPassword' && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    style={[globalStyles.input, loginStyles.authInput, loginStyles.authInputWithIcon]}
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text.slice(0, INPUT_LIMITS.passwordMax) }))}
                    onFocus={() => setActiveField('confirmPassword')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Bekreft passord"
                    placeholderTextColor={loginScreenTokens.placeholderTextColor}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    maxLength={INPUT_LIMITS.passwordMax}
                  />
                  <TouchableOpacity style={loginStyles.eyeButton} onPress={() => setShowConfirmPassword((prev) => !prev)}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={loginScreenTokens.iconTint}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isLoginMode && (
              <TouchableOpacity onPress={onForgotPassword} disabled={isLoading} style={loginStyles.forgotPasswordButton}>
                <Text style={loginStyles.forgotPasswordText}>Glemt passord?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[loginStyles.ctaButton, isLoading && globalStyles.disabledButton]}
              onPress={onPrimaryAction}
              disabled={isLoading}
            >
              <LinearGradient
                colors={loginScreenTokens.ctaGradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={loginStyles.ctaGradient}
              >
                <View style={loginStyles.ctaContentRow}>
                  {isLoading && <ActivityIndicator size="small" color={loginScreenTokens.loaderColor} style={globalStyles.podiumCardSecondOffset} />}
                  <Text style={[globalStyles.primaryButtonText, loginStyles.ctaButtonText]}>
                    {isLoading
                      ? isLoginMode
                        ? 'Logger inn...'
                        : 'Registrerer...'
                      : isLoginMode
                        ? 'Logg inn'
                        : 'Registrer deg'}
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

            {isLoginMode && groupInviteId && (
              <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                <Text style={[loginStyles.fieldLabel, { marginTop: theme.spacing.xl }]}>Eller bli med som gjest</Text>
                <Text style={[globalStyles.secondaryText, { marginBottom: 8 }]}>Velg et brukernavn og bli med i gruppen uten konto.</Text>
                <View style={[globalStyles.inputShellDark, activeField === 'guestUsername' && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    style={[globalStyles.input, loginStyles.authInput]}
                    value={guestUsername}
                    onChangeText={(text) => setGuestUsername(text.slice(0, INPUT_LIMITS.usernameMax))}
                    onFocus={() => setActiveField('guestUsername')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Brukernavn"
                    placeholderTextColor={loginScreenTokens.placeholderTextColor}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <TouchableOpacity
                  style={[globalStyles.outlineButtonGold, isLoading && globalStyles.disabledButton, { marginTop: theme.spacing.xl }]}
                  onPress={onJoinAsGuest}
                  disabled={isLoading}
                >
                  <Text style={globalStyles.outlineButtonGoldText}>Bli med som gjest</Text>
                </TouchableOpacity>
              </View>
            )}

            {isLoginMode && (
              <>
                <View style={loginStyles.authDividerRow}>
                  <View style={loginStyles.authDividerLine} />
                  <Text style={loginStyles.authDividerText}>eller</Text>
                  <View style={loginStyles.authDividerLine} />
                </View>

                <TouchableOpacity
                  style={[loginStyles.googleButton, (isLoading || !googleRequest) && globalStyles.disabledButton]}
                  onPress={onGoogleLogin}
                  disabled={isLoading || !googleRequest}
                >
                  <View style={loginStyles.googleButtonContent}>
                    <Ionicons name="logo-google" size={18} color={loginScreenTokens.googleIconColor} />
                    <Text style={loginStyles.googleButtonText}>Fortsett med Google</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

export default LoginAuthCard;
