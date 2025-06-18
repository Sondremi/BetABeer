import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

const DefaultProfilePicture = require('../../assets/images/default_profilepicture.png');

type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
};

type RootTabParamList = {
  Groups: undefined;
  ProfileTab: undefined;
  Friends: undefined;
};

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const tabNavigation = useNavigation<any>();

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  const navigateToFriends = () => {
    tabNavigation.navigate('Friends');
  };

  return (
    <View style={styles.container}>
      {/* Header with navigation buttons */}
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={navigateToSettings}>
            <Icon name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={navigateToFriends}>
            <Icon name="people-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile content */}
      <View style={styles.profileContent}>
        {/* Profile picture */}
        <View style={styles.profileImageContainer}>
          <Image
            source={DefaultProfilePicture}
            style={styles.profileImage}
          />
        </View>

        {/* Name and username */}
        <Text style={styles.name}>Sondre</Text>
        <Text style={styles.username}>sondremi</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  profileContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  username: {
    fontSize: 18,
    color: '#666',
    fontWeight: '400',
  },
});

export default ProfileScreen;