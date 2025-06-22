import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import ProfileScreen from '../screens/ProfileScreen';
import GroupScreen from '../screens/GroupScreen';
import FriendsScreen from '../screens/FriendsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LogInScreen from '../screens/Login';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const BeerIcon = require('../../assets/icons/noun-beer-7644526.png');
const ProfileIcon = require('../../assets/icons/noun-profile-4808974.png');
const FriendsIcon = require('../../assets/icons/noun-friends-4464219.png');

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileHome"
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
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="ProfileTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'GroupsTab') {
            return <Image source={BeerIcon} style={{ width: size, height: size, tintColor: color }} />;
          }
          if (route.name === 'ProfileTab') {
            return <Image source={ProfileIcon} style={{ width: size, height: size, tintColor: color }} />;
          }
          if (route.name === 'FriendsTab') {
            return <Image source={FriendsIcon} style={{ width: size, height: size, tintColor: color }} />;
          }
        },
      })}
    >
      <Tab.Screen name="GroupsTab" component={GroupScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
      <Tab.Screen name="FriendsTab" component={FriendsScreen} />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Login'>
        <Stack.Screen 
          name="Login" 
          options={{ headerShown: false }}
        >
          {(props) => (
            <LogInScreen
              {...props}
              onLoginSuccess={(user: any) => {
                props.navigation.navigate('MainTabs');
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;