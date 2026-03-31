import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { AppAlertProvider } from './context/AppAlertProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import { parseGroupInviteIdFromParams, setPendingGroupInviteId } from './services/groupInviteLinkService';
import { joinGroupFromInviteLink } from './services/groupService';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppAlertProvider>
        <PersistedRouteStack />
      </AppAlertProvider>
    </AuthProvider>
  );
}

function PersistedRouteStack() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ groupInvite?: string | string[] }>();
  const handledGroupInviteRef = useRef<string | null>(null);
  const lastRedirectRef = useRef<{ from: string; to: string } | null>(null);
  const groupInviteId = parseGroupInviteIdFromParams(params.groupInvite);

  const normalizeRoutePath = (value: string | null | undefined) => {
    if (!value) return null;

    let normalized = value.trim();
    if (!normalized) return null;

    normalized = normalized.replace(/^\/\(tabs\)/, '') || '/';
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }

    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  };

  useEffect(() => {
    if (pathname === '/login') return;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lastRoute', pathname);
      }
    } else {
      AsyncStorage.setItem('lastRoute', pathname).catch(() => {});
    }
  }, [pathname]);

  const { user, loading } = useAuth();

  useEffect(() => {
    if (!groupInviteId) return;

    const inviteKey = `${user?.id || 'anonymous'}:${groupInviteId}`;
    if (handledGroupInviteRef.current === inviteKey) return;
    handledGroupInviteRef.current = inviteKey;

    if (!user) {
      setPendingGroupInviteId(groupInviteId).catch((error) => {
        console.error('Failed to persist pending group invite:', error);
      });
      return;
    }

    let cancelled = false;
    const processInvite = async () => {
      try {
        const result = await joinGroupFromInviteLink(groupInviteId);
        if (cancelled) return;
        router.replace({
          pathname: '/groups',
          params: { selectedGroup: JSON.stringify(result.group) },
        });
      } catch (error) {
        console.error('Failed to process group invite link:', error);
      }
    };

    processInvite();

    return () => {
      cancelled = true;
    };
  }, [groupInviteId, user?.id, router]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    let cancelled = false;

    async function handleRedirect() {
      let lastRoute: string | null = null;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          lastRoute = window.localStorage.getItem('lastRoute');
        }
      } else {
        try {
          lastRoute = await AsyncStorage.getItem('lastRoute');
        } catch {
          lastRoute = null;
        }
      }
      const normalizedLastRoute = normalizeRoutePath(lastRoute);
      const normalizedCurrentPath = normalizeRoutePath(pathname);
      const normalizedProfileRoute = normalizeRoutePath('/(tabs)/profile');

      const redirectTarget =
        normalizedLastRoute &&
        normalizedLastRoute !== '/login' &&
        normalizedLastRoute !== normalizedCurrentPath
          ? lastRoute
          : pathname === '/login' && !groupInviteId
            ? '/(tabs)/profile'
            : null;

      const normalizedTarget = normalizeRoutePath(redirectTarget);
      if (cancelled || !normalizedCurrentPath || !normalizedTarget) return;
      if (normalizedTarget === normalizedCurrentPath) return;
      if (normalizedTarget === normalizedProfileRoute && normalizedCurrentPath === normalizedProfileRoute) return;

      const previousRedirect = lastRedirectRef.current;
      if (
        previousRedirect &&
        previousRedirect.from === normalizedCurrentPath &&
        previousRedirect.to === normalizedTarget
      ) {
        return;
      }

      lastRedirectRef.current = {
        from: normalizedCurrentPath,
        to: normalizedTarget,
      };

      router.replace(redirectTarget as any);
    }
    handleRedirect();

    return () => {
      cancelled = true;
    };
  }, [user?.id, loading, pathname, groupInviteId, router]);

  return (
    <Stack initialRouteName="login">
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="terms"
        options={{
          title: 'Terms of Service',
          headerBackTitle: 'Tilbake',
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          title: 'Privacy Policy',
          headerBackTitle: 'Tilbake',
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}