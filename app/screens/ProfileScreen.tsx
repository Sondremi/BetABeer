import { addDoc, collection, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, FlatList, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles/globalStyles';
import { profileStyles } from '../styles/components/profileStyles';
import { showAlert } from '../utils/platformAlert';

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
  const { user, loading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const { router } = require('expo-router');

  React.useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchGroups = async () => {
      const firestore = getFirestore();
      const q = query(collection(firestore, 'groups'), where('members', 'array-contains', user.id));
      const snapshot = await getDocs(q);
      if (!isMounted) return;
      const groupList: Group[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        name: docSnap.data().name,
        memberCount: docSnap.data().members.length,
        image: ImageMissing,
      }));
      setGroups(groupList);
    };
    fetchGroups();
    const unsubscribeFocus = router.addListener ? router.addListener('focus', fetchGroups) : undefined;

    const interval = setInterval(fetchGroups, 2000);

    return () => {
      isMounted = false;
      if (unsubscribeFocus) unsubscribeFocus();
      clearInterval(interval);
    };
  }, [user, router]);

  const navigateToSettings = () => {
    router.push('/settings');
  };

  const navigateToGroup = (group: Group) => {
    router.push({ pathname: '/groups', params: { selectedGroup: JSON.stringify(group) } });
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity style={profileStyles.groupItem} onPress={() => navigateToGroup(item)}>
      <Image source={item.image} style={globalStyles.coverImage} />
      <View style={globalStyles.overlay}>
        <Text style={profileStyles.groupName}>{item.name}</Text>
        <Text style={profileStyles.groupMembers}>{item.memberCount} medlemmer</Text>
      </View>
    </TouchableOpacity>
  );

  const handleCreateGroup = async () => {
    if (!user) return;
    setCreatingGroup(true);
    try {
      const firestore = getFirestore();
      const groupDoc = await addDoc(collection(firestore, 'groups'), {
        name: 'Gruppenavn',
        image: 'image_missing',
        members: [user.id],
        betts: [],
        createdAt: serverTimestamp(),
        createdBy: user.id,
      });
      const userRef = doc(firestore, 'users', user.id);
      const userSnap = await getDoc(userRef);
      let userGroups = [];
      if (userSnap.exists() && userSnap.data().groups) {
        userGroups = userSnap.data().groups;
      }
      await updateDoc(userRef, {
        groups: [...userGroups, groupDoc.id],
      });
      const newGroup = {
        id: groupDoc.id,
        name: 'Gruppenavn',
        memberCount: 1,
        image: ImageMissing,
      };
      setGroups(prev => [...prev, newGroup]);
      router.push({ pathname: '/groups', params: { selectedGroup: JSON.stringify(newGroup) } });
    } catch (error) {
      let msg = 'Kunne ikke opprette gruppe';
      if (error instanceof Error) msg += ': ' + error.message;
      showAlert('Feil', msg);
    } finally {
      setCreatingGroup(false);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContent]}> 
        <Text style={globalStyles.largeBoldText}>Laster...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container,
        { padding: 0 }
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={globalStyles.fullWidthScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with navigation buttons */}
        <View style={globalStyles.header}>
          <View style={profileStyles.headerButtons}>
            <TouchableOpacity style={profileStyles.headerButton} onPress={navigateToSettings}>
              <Image 
                source={SettingsIcon} 
                style={globalStyles.settingsIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile content */}
        <View style={globalStyles.centeredSection}>
          {/* Profile picture */}
          <View style={profileStyles.profileImageContainer}>
            <Image
              source={DefaultProfilePicture}
              style={[globalStyles.circularImage, { width: 120, height: 120 }]}
            />
            <TouchableOpacity style={profileStyles.editProfileImageButton} onPress={() => {/* TODO: implement backend for editing profile picture */}}>
              <Image source={PencilIcon} style={globalStyles.pencilIcon} />
            </TouchableOpacity>
          </View>

          {/* Name and username */}
          <Text style={globalStyles.largeBoldText}>{user?.name || 'Navn'}</Text>
          <Text style={globalStyles.secondaryText}>{user?.username || 'Brukernavn'}</Text>
        </View>

        {/* Groups section */}
        <View style={profileStyles.groupsSection}>
          <View style={profileStyles.groupsHeader}>
            <Text style={globalStyles.sectionTitleLeft}>Mine grupper</Text>
            <TouchableOpacity 
              style={globalStyles.outlineButton} 
              onPress={handleCreateGroup} 
              disabled={creatingGroup}
            >
              <Text style={globalStyles.outlineButtonText}>
                {creatingGroup ? 'Oppretter...' : 'Opprett ny gruppe'}
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={profileStyles.groupRow}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;