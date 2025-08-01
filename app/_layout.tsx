import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from './context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PersistedRouteStack />
    </AuthProvider>
  );
}

function PersistedRouteStack() {
  const router = useRouter();
  const pathname = usePathname();

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
      } else if (pathname === '/login') {
        router.replace('/(tabs)/profile');
      }
    }
    handleRedirect();
  }, [user, loading]);

  return (
    <Stack initialRouteName="login">
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}