import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>ProfileScreen</Text>
      <Button title="Gå til innstillinger" onPress={() => navigation.navigate('Settings')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
});

export default ProfileScreen;
