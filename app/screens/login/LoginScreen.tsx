import { loginStyles, loginScreenTokens } from '@/app/styles/components/loginStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { authService } from '../../services/firebase/authService';
import { sendFriendRequest } from '../../services/friendService';
import { joinGroupFromInviteLink } from '../../services/groupService';
import { globalStyles } from '../../styles/globalStyles';
import { INPUT_LIMITS, isValidEmailFormat, normalizeSingleLineText } from '../../utils/inputValidation';
import { showAlert } from '../../utils/platformAlert';
import LoginAuthCard from './components/LoginAuthCard';
import LoginBrandSection from './components/LoginBrandSection';
import { useGoogleAuthRequest } from './hooks/useGoogleAuthRequest';
import { useLoginAnimations } from './hooks/useLoginAnimations';
import { useLoginInviteHandling } from './hooks/useLoginInviteHandling';

WebBrowser.maybeCompleteAuthSession();

type LoginFormData = {
  username: string;
  password: string;
  name: string;
  email: string;
  confirmPassword: string;
};

const INITIAL_FORM_DATA: LoginFormData = {
  username: '',
  password: '',
  name: '',
  email: '',
  confirmPassword: '',
};

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ inviter?: string | string[]; groupInvite?: string | string[] }>();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState<LoginFormData>(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [guestUsername, setGuestUsername] = useState('');

  const { inviterId, groupInviteId } = useLoginInviteHandling({
    inviterParam: params.inviter,
    groupInviteParam: params.groupInvite,
  });

  const { googleRequest, promptGoogleSignIn, webRedirectUri } = useGoogleAuthRequest();
  const { modeAnim, modeSwitchWidth, setModeSwitchWidth, shineAnim } = useLoginAnimations(isLoginMode);

  const tryAutoJoinGroupFromInvite = async () => {
    if (!groupInviteId) return;

    try {
      await joinGroupFromInviteLink(groupInviteId);
    } catch (error) {
      console.error('Invite-link group join failed:', error);
      showAlert('Gruppelenke', 'Kunne ikke bli med i gruppen fra lenken');
    }
  };

  const validateForm = async () => {
    const normalizedEmail = formData.email.trim();

    if (isLoginMode) {
      if (!normalizedEmail) {
        showAlert('Feil', 'E-postadresse er påkrevd');
        return false;
      }
      if (normalizedEmail.length > INPUT_LIMITS.emailMax) {
        showAlert('Feil', `E-postadresse kan maks være ${INPUT_LIMITS.emailMax} tegn`);
        return false;
      }
      if (!formData.password.trim()) {
        showAlert('Feil', 'Passord er påkrevd');
        return false;
      }
      if (formData.password.length > INPUT_LIMITS.passwordMax) {
        showAlert('Feil', `Passord kan maks være ${INPUT_LIMITS.passwordMax} tegn`);
        return false;
      }
      return true;
    }

    const normalizedUsername = normalizeSingleLineText(formData.username);
    const normalizedName = normalizeSingleLineText(formData.name);

    if (!normalizedUsername) {
      showAlert('Feil', 'Brukernavn er påkrevd');
      return false;
    }
    if (normalizedUsername.length < INPUT_LIMITS.usernameMin || normalizedUsername.length > INPUT_LIMITS.usernameMax) {
      showAlert('Feil', `Brukernavn må være mellom ${INPUT_LIMITS.usernameMin} og ${INPUT_LIMITS.usernameMax} tegn`);
      return false;
    }

    if (!formData.password.trim()) {
      showAlert('Feil', 'Passord er påkrevd');
      return false;
    }
    if (formData.password.length > INPUT_LIMITS.passwordMax) {
      showAlert('Feil', `Passord kan maks være ${INPUT_LIMITS.passwordMax} tegn`);
      return false;
    }

    if (!normalizedName) {
      showAlert('Feil', 'Navn er påkrevd');
      return false;
    }
    if (normalizedName.length > INPUT_LIMITS.profileNameMax) {
      showAlert('Feil', `Navn kan maks være ${INPUT_LIMITS.profileNameMax} tegn`);
      return false;
    }

    if (!normalizedEmail) {
      showAlert('Feil', 'E-postadresse er påkrevd');
      return false;
    }
    if (normalizedEmail.length > INPUT_LIMITS.emailMax) {
      showAlert('Feil', `E-postadresse kan maks være ${INPUT_LIMITS.emailMax} tegn`);
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

    if (!isValidEmailFormat(normalizedEmail)) {
      showAlert('Feil', 'Ugyldig e-postadresse');
      return false;
    }

    try {
      const [usernameExists, emailExists] = await Promise.all([
        authService.checkUsernameExistsInsensitive(normalizedUsername),
        authService.checkEmailExistsInsensitive(normalizedEmail),
      ]);

      if (usernameExists) {
        showAlert('Feil', 'Brukernavnet er allerede tatt');
        return false;
      }

      if (emailExists) {
        showAlert('Feil', 'E-postadressen er allerede i bruk');
        return false;
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke opprette bruker');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    const normalizedEmail = formData.email.trim();
    if (!normalizedEmail) {
      showAlert('Feil', 'E-postadresse er påkrevd');
      return;
    }
    if (normalizedEmail.length > INPUT_LIMITS.emailMax) {
      showAlert('Feil', `E-postadresse kan maks være ${INPUT_LIMITS.emailMax} tegn`);
      return;
    }

    if (!formData.password.trim()) {
      showAlert('Feil', 'Passord er påkrevd');
      return;
    }

    setIsLoading(true);

    try {
      await authService.loginUser(normalizedEmail, formData.password);
      await tryAutoJoinGroupFromInvite();
      router.replace('/(tabs)/profile');
    } catch {
      showAlert('Feil', 'Kunne ikke logge inn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!(await validateForm())) return;

    setIsLoading(true);

    try {
      const createdUser = await authService.createUser({
        ...formData,
        username: normalizeSingleLineText(formData.username),
        name: normalizeSingleLineText(formData.name),
        email: formData.email.trim(),
      });

      if (inviterId && inviterId !== createdUser.id) {
        try {
          await sendFriendRequest(inviterId);
        } catch (inviteError) {
          // Ignore invite-link friend request failures to avoid blocking signup flow.
          console.error('Invite-link friend request failed:', inviteError);
        }
      }

      await tryAutoJoinGroupFromInvite();
      router.replace('/(tabs)/profile');
    } catch {
      showAlert('Feil', 'Kunne ikke registrere bruker');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      showAlert('Feil', 'Skriv inn e-postadressen din først');
      return;
    }

    if (!isValidEmailFormat(trimmedEmail)) {
      showAlert('Feil', 'Ugyldig e-postadresse');
      return;
    }

    try {
      setIsLoading(true);
      await authService.requestPasswordReset(trimmedEmail);
      showAlert('E-post sendt', `Vi har sendt en mail med lenke for å nullstille passordet til ${trimmedEmail}. Den kan havne i spam`);
    } catch {
      showAlert('Feil', 'Kunne ikke sende mail for å nullstille passordet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleRequest) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await promptGoogleSignIn();

      if (result.type !== 'success') {
        return;
      }

      const idToken = result.authentication?.idToken || (typeof result.params?.id_token === 'string' ? result.params.id_token : undefined);

      if (!idToken) {
        throw new Error('Mangler Google ID-token. Sjekk OAuth-oppsett i Firebase.');
      }

      await authService.loginWithGoogleIdToken(idToken);
      await tryAutoJoinGroupFromInvite();
      router.replace('/(tabs)/profile');
    } catch (error) {
      const rawErrorMessage = error instanceof Error ? error.message : 'Noe gikk galt under Google-innlogging.';
      const hasRedirectUriMismatch = /redirect_uri_mismatch/i.test(rawErrorMessage);
      const errorMessage = hasRedirectUriMismatch
        ? `Google avviser redirect URI. Legg denne URI-en inn i Google Cloud Console (OAuth client -> Authorized redirect URIs): ${googleRequest?.redirectUri || webRedirectUri || 'ukjent URI'}`
        : rawErrorMessage;
      console.error(errorMessage);
      showAlert('Feil', 'Google-innlogging feilet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinAsGuest = async () => {
    const normalizedGuestUsername = normalizeSingleLineText(guestUsername);
    if (!groupInviteId) {
      showAlert('Gruppelenke', 'Gjestebruker kan kun brukes via gyldig gruppelenke.');
      return;
    }
    if (!normalizedGuestUsername) {
      showAlert('Feil', 'Brukernavn er påkrevd for gjestebruker');
      return;
    }
    if (normalizedGuestUsername.length < INPUT_LIMITS.usernameMin || normalizedGuestUsername.length > INPUT_LIMITS.usernameMax) {
      showAlert('Feil', `Brukernavn må være mellom ${INPUT_LIMITS.usernameMin} og ${INPUT_LIMITS.usernameMax} tegn`);
      return;
    }

    setIsLoading(true);
    try {
      await authService.loginGuestUser(normalizedGuestUsername);
      await tryAutoJoinGroupFromInvite();
      router.replace('/groups');
    } catch {
      showAlert('Innlogging feilet', 'Kunne ikke logge inn som gjest');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    resetForm();
  };

  return (
    <KeyboardAvoidingView
      style={[globalStyles.containerWeb, loginStyles.darkContainer]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          globalStyles.scrollContent,
          loginStyles.screenContent,
          !isLoginMode && loginStyles.screenContentRegister,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={loginStyles.backgroundLayer} pointerEvents="none">
          <LinearGradient
            colors={loginScreenTokens.backgroundGradientColors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={loginStyles.backgroundGradient}
          />
        </View>

        <LoginBrandSection isLoginMode={isLoginMode} />

        <LoginAuthCard
          activeField={activeField}
          formData={formData}
          googleRequest={googleRequest}
          guestUsername={guestUsername}
          groupInviteId={groupInviteId}
          isLoading={isLoading}
          isLoginMode={isLoginMode}
          modeAnim={modeAnim}
          modeSwitchWidth={modeSwitchWidth}
          setActiveField={setActiveField}
          setFormData={setFormData}
          setGuestUsername={setGuestUsername}
          setModeSwitchWidth={setModeSwitchWidth}
          setShowConfirmPassword={setShowConfirmPassword}
          setShowPassword={setShowPassword}
          shineAnim={shineAnim}
          showConfirmPassword={showConfirmPassword}
          showPassword={showPassword}
          onForgotPassword={handleForgotPassword}
          onJoinAsGuest={handleJoinAsGuest}
          onPrimaryAction={isLoginMode ? handleLogin : handleRegister}
          onGoogleLogin={handleGoogleLogin}
          onSwitchToLogin={() => {
            if (!isLoginMode) {
              toggleMode();
            }
          }}
          onSwitchToRegister={() => {
            if (isLoginMode) {
              toggleMode();
            }
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
