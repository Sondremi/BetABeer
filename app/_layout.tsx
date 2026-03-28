import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { AppAlertProvider } from './context/AppAlertProvider';
import { AuthProvider } from './context/AuthContext';
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
  const groupInviteId = parseGroupInviteIdFromParams(params.groupInvite);

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

  const { user, loading } = require('./context/AuthContext');

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
  }, [groupInviteId, user, router]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    async function handleRedirect() {
      let lastRoute: string | null = null;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          lastRoute = window.localStorage.getItem('lastRoute');
        }
      } else {
        try {
          lastRoute = await AsyncStorage.getItem('lastRoute');
        } catch (e) {
          lastRoute = null;
        }
      }
      if (lastRoute && lastRoute !== '/login' && lastRoute !== pathname) {
        router.replace(lastRoute as any);
      } else if (pathname === '/login' && !groupInviteId) {
        router.replace('/(tabs)/profile');
      }
    }
    handleRedirect();
  }, [user, loading, pathname, groupInviteId, router]);

  return (
    <Stack initialRouteName="login">
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}