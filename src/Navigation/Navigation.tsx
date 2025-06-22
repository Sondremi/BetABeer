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
      <Stack.Navigator 
        initialRouteName='Login'>
        <Stack.Screen 
          name="Login" 
          component={(props: any) => (
            <LogInScreen
              {...props}
              onLoginSuccess={(user: any) => {
                // Handle successful login here, e.g., navigate or update state
                props.navigation.navigate('MainTabs');
              }}
            />
          )}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Profile"
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
  );
}

export default Navigation;