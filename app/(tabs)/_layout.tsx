import { Tabs } from 'expo-router';
import { Image } from 'react-native';

const BeerIcon = require('../../assets/icons/noun-beer-7644526.png');
const ProfileIcon = require('../../assets/icons/noun-profile-4808974.png');
const FriendsIcon = require('../../assets/icons/noun-friends-4464219.png');

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          paddingLeft: 50,
          backgroundColor: '#181A20',
          borderTopColor: '#23242A',
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          paddingHorizontal: 50,
        },
        tabBarIcon: ({ color, focused }) => {
          const iconSize = focused ? 36 : 30;
          return (
            <Image
              source={
                route.name === 'groups'
                  ? BeerIcon
                  : route.name === 'profile'
                  ? ProfileIcon
                  : route.name === 'friends'
                  ? FriendsIcon
                  : null
              }
              style={{ 
                width: iconSize, 
                height: iconSize, 
                tintColor: color,
              }}
              resizeMode="contain"
            />
          );
        },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#fff',
      })}
    >
      <Tabs.Screen name="groups" options={{ title: 'Grupper' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="friends" options={{ title: 'Venner' }} />
    </Tabs>
  );
}