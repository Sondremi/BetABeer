import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Image } from 'react-native';

import ProfileScreen from '../screens/ProfileScreen';
import GroupScreen from '../screens/GroupScreen';
import FriendsScreen from '../screens/FriendsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const BeerIcon = require('../../assets/icons/noun-beer-7644526.png')
const ProfileIcon = require('../../assets/icons/noun-profile-4808974.png')
const FriendsIcon = require('../../assets/icons/noun-friends-4464219.png')


function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Innstillinger' }}
      />
    </Stack.Navigator>
  );
}


const Navigation = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Groups') {
              return <Image source={BeerIcon} style={{ width: size, height: size, tintColor: color }} />;
            }
            if (route.name === 'Profile') {
              return <Image source={ProfileIcon} style={{ width: size, height: size, tintColor: color }} />;
            }
            if (route.name === 'Friends') {
              return <Image source={FriendsIcon} style={{ width: size, height: size, tintColor: color }} />;
            }
          },
        })}
      >
        <Tab.Screen name="Groups" component={GroupScreen} />
        <Tab.Screen name="Profile" component={ProfileStack} />
        <Tab.Screen name="Friends" component={FriendsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;