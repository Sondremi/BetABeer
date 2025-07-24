import { addDoc, collection, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, FlatList, Image, ScrollView, Text, TouchableOpacity, View, Modal } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles/globalStyles';
import { profileStyles } from '../styles/components/profileStyles';
import { theme } from '../styles/theme';
import { showAlert } from '../utils/platformAlert';

const DefaultProfilePicture = require('../../assets/images/default_profilepicture.png');
const ImageMissing = require('../../assets/images/image_missing.png');
const SettingsIcon = require('../../assets/icons/noun-settings-2650525.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');
const AddFriendIcon = require('../../assets/icons/noun-add-user-7539314.png');
const RejectIcon = require('../../assets/icons/noun-delete-7938028.png');

type Group = {
  id: string;
  name: string;
  memberCount: number;
  image: any;
};

interface GroupInvitation {
  groupId: string;
  groupName: string;
  from: string;
  status: 'pending';
  createdAt: string;
}

const ProfileScreen = () => {
  const { user, loading, acceptGroupInvitation, rejectGroupInvitation } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [invitationsModalVisible, setInvitationsModalVisible] = useState(false);
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([]);
  const [handlingInvitation, setHandlingInvitation] = useState(false);
  const { router } = require('expo-router');

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchGroupsAndInvitations = async () => {
      const firestore = getFirestore();
      // Fetch groups
      const groupQuery = query(collection(firestore, 'groups'), where('members', 'array-contains', user.id));
      const groupSnapshot = await getDocs(groupQuery);
      if (!isMounted) return;
      const groupList: Group[] = groupSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        name: docSnap.data().name,
        memberCount: docSnap.data().members.length,
        image: ImageMissing,
      }));
      setGroups(groupList);

      // Fetch user invitations
      const userDoc = await getDoc(doc(firestore, 'users', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setGroupInvitations(userData.groupInvitations?.filter((inv: GroupInvitation) => inv.status === 'pending') || []);
      }
    };

    fetchGroupsAndInvitations();
    const interval = setInterval(fetchGroupsAndInvitations, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const navigateToSettings = () => {
    router.push('/settings');
  };

  const navigateToGroup = (group: Group) => {
    router.push({ pathname: '/groups', params: { selectedGroup: JSON.stringify(group) } });
  };

  const handleCreateGroup = async () => {
    if (!user) return;
    setCreatingGroup(true);
    try {
      const firestore = getFirestore();
      const groupDoc = await addDoc(collection(firestore, 'groups'), {
        name: 'Gruppenavn',
        image: 'image_missing',
        members: [user.id],
        bets: [],
        createdAt: serverTimestamp(),
        createdBy: user.id,
      });
      const userRef = doc(firestore, 'users', user.id);
      const userSnap = await getDoc(userRef);
      let userGroups: string[] = [];
      if (userSnap.exists() && userSnap.data().groups) {
        userGroups = userSnap.data().groups;
      }
      await updateDoc(userRef, {
        groups: [...userGroups, groupDoc.id],
      });
      const newGroup: Group = {
        id: groupDoc.id,
        name: 'Gruppenavn',
        memberCount: 1,
        image: ImageMissing,
      };
      setGroups(prev => [...prev, newGroup]);
      router.push({ pathname: '/groups', params: { selectedGroup: JSON.stringify(newGroup) } });
    } catch (error) {
      showAlert('Feil', 'Kunne ikke opprette gruppe');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAcceptInvitation = async (invitation: GroupInvitation) => {
    if (!user) return;
    setHandlingInvitation(true);
    try {
      await acceptGroupInvitation(user.id, invitation.groupId, invitation.from);
      setGroupInvitations(prev => prev.filter(inv => inv.groupId !== invitation.groupId || inv.from !== invitation.from));
      const firestore = getFirestore();
      const groupDoc = await getDoc(doc(firestore, 'groups', invitation.groupId));
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        setGroups(prev => [
          ...prev,
          {
            id: invitation.groupId,
            name: groupData.name,
            memberCount: groupData.members.length + 1,
            image: ImageMissing,
          },
        ]);
      }
      showAlert('Suksess', `Du har blitt med i gruppen "${invitation.groupName}"`);
    } catch (error) {
      showAlert('Feil', 'Kunne ikke godta invitasjon');
    } finally {
      setHandlingInvitation(false);
    }
  };

  const handleRejectInvitation = async (invitation: GroupInvitation) => {
    if (!user) return;
    setHandlingInvitation(true);
    try {
      await rejectGroupInvitation(user.id, invitation.groupId, invitation.from);
      setGroupInvitations(prev => prev.filter(inv => inv.groupId !== invitation.groupId || inv.from !== invitation.from));
      showAlert('Suksess', `Invitasjon til "${invitation.groupName}" avvist`);
    } catch (error) {
      showAlert('Feil', 'Kunne ikke avslå invitasjon');
    } finally {
      setHandlingInvitation(false);
    }
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

  const renderInvitationItem = ({ item }: { item: GroupInvitation }) => (
    <View style={[globalStyles.listItemRow, { paddingVertical: 10 }]}>
      <View style={{ flex: 1 }}>
        <Text style={globalStyles.modalText}>{item.groupName}</Text>
        <Text style={globalStyles.secondaryText}>Fra: {item.from}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          style={[globalStyles.selectionButton, { marginRight: theme.spacing.sm }]}
          onPress={() => handleAcceptInvitation(item)}
          disabled={handlingInvitation}
        >
          <Text style={globalStyles.selectionButtonText}>Godta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[globalStyles.selectionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => handleRejectInvitation(item)}
          disabled={handlingInvitation}
        >
          <Text style={[globalStyles.selectionButtonText, { color: theme.colors.background }]}>Avslå</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
            <TouchableOpacity
              style={profileStyles.headerButton}
              onPress={() => setInvitationsModalVisible(true)}
            >
              <Image source={AddFriendIcon} style={globalStyles.settingsIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={profileStyles.headerButton} onPress={navigateToSettings}>
              <Image source={SettingsIcon} style={globalStyles.settingsIcon} />
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
            <TouchableOpacity
              style={profileStyles.editProfileImageButton}
              onPress={() => {
                /* TODO: implement backend for editing profile picture */
              }}
            >
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

      <Modal
        visible={invitationsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInvitationsModalVisible(false)}
      >
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Gruppeinvitasjoner</Text>
            <FlatList
              data={groupInvitations}
              renderItem={renderInvitationItem}
              keyExtractor={(item) => `${item.groupId}_${item.from}`}
              ListEmptyComponent={
                <Text style={globalStyles.emptyStateText}>Ingen ventende invitasjoner</Text>
              }
              contentContainerStyle={globalStyles.listContainer}
            />
            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity
                onPress={() => setInvitationsModalVisible(false)}
                disabled={handlingInvitation}
              >
                <Text style={globalStyles.cancelButtonText}>Lukk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;