import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      safeAreaInsets={{ top: 0, bottom: 0 }}
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
  );
}
