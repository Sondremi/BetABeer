import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs, useRouter } from 'expo-router';
import { Image, Platform, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../styles/globalStyles';

const BeerIcon = require('../../assets/icons/noun-beer-7644526.png');
const ProfileIcon = require('../../assets/icons/noun-profile-4808974.png');
const FriendsIcon = require('../../assets/icons/noun-friends-4464219.png');

const routes = [
  { name: 'groups', icon: BeerIcon, title: 'Grupper' },
  { name: 'profile', icon: ProfileIcon, title: 'Profil' },
  { name: 'friends', icon: FriendsIcon, title: 'Venner' },
] as const;

type RouteName = typeof routes[number]['name'];

export default function TabLayout() {
  const router = useRouter();

  const CustomTabBar = ({ navigation, state }: BottomTabBarProps) => {
    const handleGroupsNavigation = async () => {
      try {
        const lastSelectedGroup = await AsyncStorage.getItem('lastSelectedGroup');
        if (lastSelectedGroup) {
          const groupData = JSON.parse(lastSelectedGroup);
          router.push({ pathname: '/groups', params: { selectedGroup: JSON.stringify(groupData) } });
        } else {
          router.push('/groups');
        }
      } catch (error) {
        console.error('Error getting last selected group:', error);
        router.push('/groups');
      }
    };

    return (
      <View style={Platform.OS === 'web' ? globalStyles.tabBarWeb : globalStyles.tabBar}>
        {routes.map((route, index) => {
          const isFocused = state.index === index;

          return (
            <TouchableOpacity
              key={route.name}
              style={[globalStyles.tabItem, isFocused && globalStyles.tabItemFocused]}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: state.routes[index].key,
                  canPreventDefault: true,
                });

                if (!event.defaultPrevented) {
                  if (route.name === 'groups') {
                    handleGroupsNavigation();
                  } else {
                    router.push(`/${route.name}` as `/${RouteName}`);
                  }
                }
              }}
            >
              <Image
                source={route.icon}
                style={[globalStyles.tabIcon, isFocused && globalStyles.tabIconFocused]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="groups" options={{ title: 'Grupper' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="friends" options={{ title: 'Venner' }} />
    </Tabs>
  );
}