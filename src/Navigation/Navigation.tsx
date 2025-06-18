import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import ProfileScreen from '../screens/ProfileScreen';
import GroupScreen from '../screens/GroupScreen';
import FriendsScreen from '../screens/FriendsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
            let iconName: string = 'home';

            if (route.name === 'ProfileTab') iconName = 'person-circle-outline';
            else if (route.name === 'Groups') iconName = 'beer-outline';
            else if (route.name === 'Friends') iconName = 'people-outline';

            return <Icon name={iconName} size={size} color={color} />;
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
