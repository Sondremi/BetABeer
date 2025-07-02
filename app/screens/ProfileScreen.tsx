import React from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

const DefaultProfilePicture = require('../../assets/images/default_profilepicture.png');
const ImageMissing = require('../../assets/images/image_missing.png');
const SettingsIcon = require('../../assets/icons/noun-settings-2650525.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');

type Group = {
  id: string;
  name: string;
  memberCount: number;
  image: any;
};

const ProfileScreen = () => {
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

  const { router } = require('expo-router');

  const { user, loading } = useAuth();

  const navigateToSettings = () => {
    router.push('/settings');
  };

  const navigateToGroup = (group: Group) => {
    router.push({ pathname: '/groups', params: { selectedGroup: JSON.stringify(group) } });
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <Text style={styles.name}>Laster...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with navigation buttons */}
      <View style={styles.header}>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={navigateToSettings}>
            <Image 
              source={SettingsIcon} 
              style={{ width: 20, height: 20, tintColor: '#000000' }}
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
          <TouchableOpacity style={styles.editProfileImageButton} onPress={() => {/* TODO: implement backend for editing profile picture */}}>
            <Image source={PencilIcon} style={{ width: 18, height: 18, tintColor: '#FFD700' }} />
          </TouchableOpacity>
        </View>

        {/* Name and username */}
        <Text style={styles.name}>{user?.name || 'Navn'}</Text>
        <Text style={styles.username}>{user?.username || 'Brukernavn'}</Text>
      </View>

      {/* Groups section */}
      <View style={styles.groupsSection}>
        <View style={styles.groupsHeaderRowSpread}>
          <Text style={styles.sectionTitleLeft}>Mine grupper</Text>
          <TouchableOpacity style={styles.createGroupButtonRight} onPress={() => {/* TODO: implement backend */}}>
            <Text style={styles.createGroupButtonTextSmall}>Opprett ny gruppe</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#181A20',
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
    backgroundColor: '#B0B0B0',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
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
  createGroupButtonSmall: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginLeft: 10,
    height: 36,
    justifyContent: 'center',
  },
  createGroupButtonText: {
    color: '#181A20',
    fontWeight: 'bold',
    fontSize: 16,
  },
  createGroupButtonTextSmall: {
    color: '#181A20',
    fontWeight: 'bold',
    fontSize: 14,
  },
  groupsHeaderRowSpread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitleLeft: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 0,
    textAlign: 'left',
  },
  createGroupButtonRight: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    marginTop: 0,
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