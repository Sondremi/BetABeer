import { loginScreenTokens, loginStyles } from '@/app/styles/components/loginStyles';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authService } from '../services/firebase/authService';
import { sendFriendRequest } from '../services/friendService';
import { consumePendingGroupInviteId, parseGroupInviteIdFromParams, parseGroupInviteIdFromUrl } from '../services/groupInviteLinkService';
import { joinGroupFromInviteLink } from '../services/groupService';
import { globalStyles } from '../styles/globalStyles';
import { INPUT_LIMITS, normalizeSingleLineText } from '../utils/inputValidation';
import { showAlert } from '../utils/platformAlert';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB_REDIRECT_URI = process.env.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI;

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ inviter?: string | string[]; groupInvite?: string | string[] }>();
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
  const [inviterId, setInviterId] = useState<string | null>(null);
  const [groupInviteId, setGroupInviteId] = useState<string | null>(null);
  const [guestUsername, setGuestUsername] = useState('');
  const [modeSwitchWidth, setModeSwitchWidth] = useState(0);
  const shineAnim = useRef(new Animated.Value(-1)).current;
  const modeAnim = useRef(new Animated.Value(0)).current;
  const webRedirectUri = useMemo(() => {
    if (Platform.OS !== 'web') {
      return undefined;
    }

    const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';

    if (!isLocalHost && GOOGLE_WEB_REDIRECT_URI?.trim()) {
      return GOOGLE_WEB_REDIRECT_URI.trim();
    }

    return fallbackOrigin ? `${fallbackOrigin}/` : undefined;
  }, []);

  const nativeRedirectUri = useMemo(
    () => AuthSession.makeRedirectUri({
      path: 'oauth2redirect/google',
    }),
    []
  );

  const googleAuthRequestConfig = useMemo(() => ({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: Platform.OS === 'web' ? webRedirectUri : nativeRedirectUri,
    responseType: 'id_token',
    // Avoid PKCE digest requirement on insecure web origins (e.g. local network HTTP on mobile browser).
    usePKCE: false,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  }), [nativeRedirectUri, webRedirectUri]);
  const [googleRequest, , promptGoogleSignIn] = Google.useAuthRequest(googleAuthRequestConfig);

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

  useEffect(() => {
    const paramInviter = Array.isArray(params.inviter) ? params.inviter[0] : params.inviter;
    if (typeof paramInviter === 'string' && paramInviter.trim()) {
      setInviterId(paramInviter.trim());
    }

    const paramGroupInviteId = parseGroupInviteIdFromParams(params.groupInvite);
    if (paramGroupInviteId) {
      setGroupInviteId(paramGroupInviteId);
    }
  }, [params.inviter, params.groupInvite]);

  useEffect(() => {
    const parseInviterFromUrl = (url: string | null | undefined) => {
      if (!url) return null;
      try {
        const parsedUrl = new URL(url);
        const inviter = parsedUrl.searchParams.get('inviter');
        return inviter?.trim() || null;
      } catch {
        const match = url.match(/[?&]inviter=([^&]+)/i);
        return match?.[1] ? decodeURIComponent(match[1]).trim() : null;
      }
    };

    let isMounted = true;
    Linking.getInitialURL()
      .then((url) => {
        if (!isMounted) return;
        const parsedInviter = parseInviterFromUrl(url);
        if (parsedInviter) {
          setInviterId(parsedInviter);
        }
        const parsedGroupInviteId = parseGroupInviteIdFromUrl(url);
        if (parsedGroupInviteId) {
          setGroupInviteId(parsedGroupInviteId);
        }
      })
      .catch((error) => {
        console.error('Failed to parse initial invite URL:', error);
      });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      const parsedInviter = parseInviterFromUrl(url);
      if (parsedInviter) {
        setInviterId(parsedInviter);
      }
      const parsedGroupInviteId = parseGroupInviteIdFromUrl(url);
      if (parsedGroupInviteId) {
        setGroupInviteId(parsedGroupInviteId);
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydratePendingGroupInvite = async () => {
      try {
        const pendingGroupInviteId = await consumePendingGroupInviteId();
        if (!isMounted || !pendingGroupInviteId) return;
        setGroupInviteId((prev) => prev || pendingGroupInviteId);
      } catch (error) {
        console.error('Failed to hydrate pending group invite:', error);
      }
    };

    hydratePendingGroupInvite();

    return () => {
      isMounted = false;
    };
  }, []);

  const tryAutoJoinGroupFromInvite = async () => {
    if (!groupInviteId) return;

    try {
      const result = await joinGroupFromInviteLink(groupInviteId);
      if (result.status === 'joined') {
        showAlert('Suksess', `Du ble med i gruppen "${result.group.name}".`);
      }
    } catch (error) {
      console.error('Invite-link group join failed:', error);
      showAlert('Gruppelenke', (error as Error).message || 'Kunne ikke bli med i gruppen fra lenken.');
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
        showAlert('Feil', `E-postadresse kan maks være ${INPUT_LIMITS.emailMax} tegn.`);
        return false;
      }
      if (!formData.password.trim()) {
        showAlert('Feil', 'Passord er påkrevd');
        return false;
      }
      if (formData.password.length > INPUT_LIMITS.passwordMax) {
        showAlert('Feil', `Passord kan maks være ${INPUT_LIMITS.passwordMax} tegn.`);
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
      showAlert('Feil', `Brukernavn må være mellom ${INPUT_LIMITS.usernameMin} og ${INPUT_LIMITS.usernameMax} tegn.`);
      return false;
    }

    if (!formData.password.trim()) {
      showAlert('Feil', 'Passord er påkrevd');
      return false;
    }
    if (formData.password.length > INPUT_LIMITS.passwordMax) {
      showAlert('Feil', `Passord kan maks være ${INPUT_LIMITS.passwordMax} tegn.`);
      return false;
    }

    if (!normalizedName) {
      showAlert('Feil', 'Navn er påkrevd');
      return false;
    }
    if (normalizedName.length > INPUT_LIMITS.profileNameMax) {
      showAlert('Feil', `Navn kan maks være ${INPUT_LIMITS.profileNameMax} tegn.`);
      return false;
    }

    if (!normalizedEmail) {
      showAlert('Feil', 'E-postadresse er påkrevd');
      return false;
    }
    if (normalizedEmail.length > INPUT_LIMITS.emailMax) {
      showAlert('Feil', `E-postadresse kan maks være ${INPUT_LIMITS.emailMax} tegn.`);
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
    if (!emailRegex.test(normalizedEmail)) {
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
      showAlert('Feil', 'Kunne ikke opprette bruker. Prøv igjen senere.');
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
      showAlert('Feil', `E-postadresse kan maks være ${INPUT_LIMITS.emailMax} tegn.`);
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

  const handleForgotPassword = async () => {
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      showAlert('Glemt passord', 'Skriv inn e-postadressen din først, så sender vi deg en reset-lenke.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showAlert('Feil', 'Ugyldig e-postadresse');
      return;
    }

    try {
      setIsLoading(true);
      await authService.requestPasswordReset(trimmedEmail);
      showAlert('E-post sendt', `Vi har sendt en passord-reset lenke til ${trimmedEmail}.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kunne ikke sende reset-lenke.';
      showAlert('Feil', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleRequest) {
      showAlert('Google-innlogging', 'Google-innlogging er ikke klar enda. Prøv igjen om et øyeblikk.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await promptGoogleSignIn();

      if (result.type !== 'success') {
        return;
      }

      const idToken =
        result.authentication?.idToken ||
        (typeof result.params?.id_token === 'string' ? result.params.id_token : undefined);

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
      showAlert('Google-innlogging feilet', errorMessage);
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
      showAlert('Feil', `Brukernavn må være mellom ${INPUT_LIMITS.usernameMin} og ${INPUT_LIMITS.usernameMax} tegn.`);
      return;
    }

    setIsLoading(true);
    try {
      await authService.loginGuestUser(normalizedGuestUsername);
      await tryAutoJoinGroupFromInvite();
      router.replace('/groups');
    } catch (error) {
      showAlert('Innlogging feilet', (error as Error).message || 'Kunne ikke logge inn som gjest');
    } finally {
      setIsLoading(false);
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
        globalStyles.containerWeb,
        loginStyles.darkContainer,
      ]}
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

        <View style={loginStyles.brandSection}>
          <Image
            source={require('../../assets/images/logo/Logo_nobg_shdw.png')}
            style={loginStyles.brandLogo}
            resizeMode="contain"
          />
          <Text style={loginStyles.appName}>BetABeer</Text>
          <Text style={loginStyles.welcomeText}>
            {isLoginMode ? 'Velkommen tilbake!' : 'Registrer deg'}
          </Text>
        </View>

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
                  onPress={() => {
                    if (!isLoginMode) {
                      toggleMode();
                    }
                  }}
                >
                  <Text style={[loginStyles.modeButtonText, isLoginMode && globalStyles.primaryColorText]}>
                    Logg inn
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[loginStyles.modeButton, loginStyles.modeButtonDivider, !isLoginMode && loginStyles.modeButtonActive]}
                  onPress={() => {
                    if (isLoginMode) {
                      toggleMode();
                    }
                  }}
                >
                  <Text style={[loginStyles.modeButtonText, !isLoginMode && globalStyles.primaryColorText]}>
                    Registrer deg
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={loginStyles.authCardBody}>

            {isLoginMode ? (
              <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                <Text style={loginStyles.fieldLabel}>E-postadresse</Text>
                <View style={[globalStyles.inputShellDark, activeField === 'email' && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    style={[globalStyles.input, loginStyles.authInput]}
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text.slice(0, INPUT_LIMITS.emailMax) })}
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
                      onChangeText={(text) => setFormData({ ...formData, username: text.slice(0, INPUT_LIMITS.usernameMax) })}
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
                      onChangeText={(text) => setFormData({ ...formData, name: text.slice(0, INPUT_LIMITS.profileNameMax) })}
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
                      onChangeText={(text) => setFormData({ ...formData, email: text.slice(0, INPUT_LIMITS.emailMax) })}
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
                  onChangeText={(text) => setFormData({ ...formData, password: text.slice(0, INPUT_LIMITS.passwordMax) })}
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
                <TouchableOpacity
                  style={loginStyles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
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
                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text.slice(0, INPUT_LIMITS.passwordMax) })}
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
                  <TouchableOpacity
                    style={loginStyles.eyeButton}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                  >
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
              <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading} style={loginStyles.forgotPasswordButton}>
                <Text style={loginStyles.forgotPasswordText}>Glemt passord?</Text>
              </TouchableOpacity>
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
                        : 'Registrer deg'
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

            {isLoginMode && groupInviteId && (
              <View style={[globalStyles.inputGroup, loginStyles.formInputGroup]}>
                <Text style={loginStyles.fieldLabel}>Bli med som gjest</Text>
                <Text style={[globalStyles.secondaryText, { marginBottom: 8 }]}>Skriv brukernavn og bli med i gruppen uten full konto.</Text>
                <View style={[globalStyles.inputShellDark, activeField === 'guestUsername' && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    style={[globalStyles.input, loginStyles.authInput]}
                    value={guestUsername}
                    onChangeText={(text) => setGuestUsername(text.slice(0, INPUT_LIMITS.usernameMax))}
                    onFocus={() => setActiveField('guestUsername')}
                    onBlur={() => setActiveField(null)}
                    placeholder="Gjestebrukernavn"
                    placeholderTextColor={loginScreenTokens.placeholderTextColor}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <TouchableOpacity
                  style={[globalStyles.outlineButtonGold, isLoading && globalStyles.disabledButton]}
                  onPress={handleJoinAsGuest}
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
                  style={[
                    loginStyles.googleButton,
                    (isLoading || !googleRequest) && globalStyles.disabledButton,
                  ]}
                  onPress={handleGoogleLogin}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
