import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

const DefaultProfilePicture = require('../../assets/images/default_profilepicture.png');
const ImageMissing = require('../../assets/images/image_missing.png');
const SettingsIcon = require('../../assets/icons/noun-settings-2650525.png');

type Group = {
  id: string;
  name: string;
  memberCount: number;
  image: any;
};

// Updated to match new navigation structure
type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
};

type RootTabParamList = {
  GroupsTab: { selectedGroup?: Group };
  ProfileTab: undefined;
  FriendsTab: undefined;
};

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;
type TabNavigationProp = BottomTabNavigationProp<RootTabParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const tabNavigation = useNavigation<TabNavigationProp>();

  // Mock data for groups - replace with real data later
  const groups: Group[] = [
    {
      id: '1',
      name: 'Gutta',
      memberCount: 8,
      image: ImageMissing,
    },
    {
      id: '2',
      name: 'Vors',
      memberCount: 15,
      image: ImageMissing,
    },
    {
      id: '3',
      name: 'Fredag',
      memberCount: 12,
      image: ImageMissing,
    },
  ];

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  const navigateToGroup = (group: Group) => {
    tabNavigation.navigate('GroupsTab', { selectedGroup: group });
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity style={styles.groupItem} onPress={() => navigateToGroup(item)}>
      <Image source={item.image} style={styles.groupImage} />
      <View style={styles.groupOverlay}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupMembers}>{item.memberCount} medlemmer</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header with navigation buttons */}
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={navigateToSettings}>
            <Image 
              source={SettingsIcon} 
              style={{ width: 20, height: 20, tintColor: '#FFD700' }} // Changed to gold for visibility
            />
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
          <TouchableOpacity style={styles.editProfileImageButton} onPress={() => {/* Legg til bildebytte senere */}}>
            <Image
              source={require('../../assets/icons/noun-pencil-969012.png')}
              style={{ width: 18, height: 18, tintColor: '#FFD700' }}
            />
          </TouchableOpacity>
        </View>

        {/* Name and username */}
        <Text style={styles.name}>Sondre</Text>
        <Text style={styles.username}>sondremi</Text>

        {/* Create group button */}
        <TouchableOpacity style={styles.createGroupButton}>
          <Text style={styles.createGroupButtonText}>Opprett gruppe</Text>
        </TouchableOpacity>
      </View>

      {/* Groups section */}
      <View style={styles.groupsSection}>
        <Text style={styles.sectionTitle}>Mine grupper</Text>
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.groupRow}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20', // dark background
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
    backgroundColor: '#23242A',
  },
  profileContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileImageContainer: {
    marginBottom: 30,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#23242A',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  editProfileImageButton: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: '#23242A',
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  username: {
    fontSize: 18,
    color: '#B0B0B0',
    fontWeight: '400',
    marginBottom: 20,
  },
  createGroupButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 30,
  },
  createGroupButtonText: {
    color: '#181A20',
    fontWeight: 'bold',
    fontSize: 16,
  },
  groupsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
  },
  groupRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  groupItem: {
    width: '48%',
    height: 140,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#23242A',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  groupImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.7,
  },
  groupOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(24, 26, 32, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
});

export default ProfileScreen;