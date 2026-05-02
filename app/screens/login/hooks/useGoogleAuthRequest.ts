import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useMemo } from 'react';
import { Platform } from 'react-native';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB_REDIRECT_URI = process.env.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI;

export const useGoogleAuthRequest = () => {
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

  const googleAuthRequestConfig = useMemo(
    () => ({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      redirectUri: Platform.OS === 'web' ? webRedirectUri : nativeRedirectUri,
      responseType: 'id_token',
      // Avoid PKCE digest requirement on insecure web origins (e.g. local network HTTP on mobile browser).
      usePKCE: false,
      scopes: ['openid', 'profile', 'email'],
      selectAccount: true,
    }),
    [nativeRedirectUri, webRedirectUri]
  );

  const [googleRequest, , promptGoogleSignIn] = Google.useAuthRequest(googleAuthRequestConfig);

  return {
    googleRequest,
    promptGoogleSignIn,
    webRedirectUri,
  };
};
