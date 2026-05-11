import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const ZERO_INSETS = { insets: { top: 0, right: 0, bottom: 0, left: 0 }, frame: { x: 0, y: 0, width: 0, height: 0 } };

export default function TabLayout() {
  return (
    <SafeAreaProvider initialMetrics={ZERO_INSETS}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="groups" options={{ title: 'Grupper' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
        <Tabs.Screen name="friends" options={{ title: 'Venner' }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </SafeAreaProvider>
  );
}
