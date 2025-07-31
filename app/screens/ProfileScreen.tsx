import { addDoc, collection, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { profileStyles } from '../styles/components/profileStyles';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { showAlert } from '../utils/platformAlert';
import { useRouter } from 'expo-router';

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
  id: string;
  groupId: string;
  groupName: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

const ProfileScreen = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [invitationsModalVisible, setInvitationsModalVisible] = useState(false);
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([]);
  const [handlingInvitation, setHandlingInvitation] = useState(false);
  const [userNames, setUserNames] = useState<{ [id: string]: string }>({});

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

      // Fetch pending group invitations
      const invitationQuery = query(
        collection(firestore, 'group_invitations'),
        where('receiverId', '==', user.id),
        where('status', '==', 'pending')
      );
      const invitationSnapshot = await getDocs(invitationQuery);
      if (!isMounted) return;
      const invitationList = invitationSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        groupId: docSnap.data().groupId,
        groupName: docSnap.data().groupName,
        senderId: docSnap.data().senderId,
        receiverId: docSnap.data().receiverId,
        status: docSnap.data().status,
        createdAt: docSnap.data().createdAt,
      })) as GroupInvitation[];
      setGroupInvitations(invitationList);
    };
    fetchGroupsAndInvitations();
    return () => {
      isMounted = false;
    };
  }, [user]);


  useEffect(() => {
    const fetchNames = async () => {
      if (!groupInvitations.length) return;
      const firestore = getFirestore();
      const idsToFetch = groupInvitations
        .map(inv => inv.senderId)
        .filter(id => !(id in userNames));
      const newNames: { [id: string]: string } = {};
      await Promise.all(
        idsToFetch.map(async (id) => {
          const userDoc = await getDoc(doc(firestore, 'users', id));
          newNames[id] = userDoc.exists() ? userDoc.data().name || id : id;
        })
      );
      if (Object.keys(newNames).length > 0) {
        setUserNames(prev => ({ ...prev, ...newNames }));
      }
    };
    fetchNames();
  }, [groupInvitations]);

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
      let userGroups: string[] = userSnap.exists() && userSnap.data().groups ? userSnap.data().groups : [];
      await updateDoc(userRef, { groups: [...userGroups, groupDoc.id] });
      const newGroup: Group = {
        id: groupDoc.id,
        name: 'Gruppenavn',
        memberCount: 1,
        image: ImageMissing,
      };
      setGroups(prev => [...prev, newGroup]);
      router.push({ pathname: '/groups', params: { selectedGroup: JSON.stringify(newGroup) } });
    } catch (error) {
      console.error('Error creating group:', error);
      showAlert('Feil', 'Kunne ikke opprette gruppe');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAcceptInvitation = async (invitation: GroupInvitation) => {
    if (!user) return;
    setHandlingInvitation(true);
    try {
      const firestore = getFirestore();
      const invitationRef = doc(firestore, 'group_invitations', invitation.id);
      const groupRef = doc(firestore, 'groups', invitation.groupId);
      const groupSnap = await getDoc(groupRef);

      if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        const updatedMembers = [...(groupData.members || []), user.id];
        await updateDoc(groupRef, { members: updatedMembers });
        await updateDoc(invitationRef, { status: 'accepted' });
        setGroupInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
        setGroups(prev => [
          ...prev,
          {
            id: invitation.groupId,
            name: groupData.name,
            memberCount: updatedMembers.length,
            image: ImageMissing,
          },
        ]);
        showAlert('Suksess', `Du har blitt med i gruppen "${invitation.groupName}"`);
      } else {
        showAlert('Feil', 'Gruppen finnes ikke');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showAlert('Feil', 'Kunne ikke godta invitasjonen');
    } finally {
      setHandlingInvitation(false);
    }
  };

  const handleRejectInvitation = async (invitation: GroupInvitation) => {
    if (!user) return;
    setHandlingInvitation(true);
    try {
      const firestore = getFirestore();
      const invitationRef = doc(firestore, 'group_invitations', invitation.id);
      await updateDoc(invitationRef, { status: 'declined' });
      setGroupInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
      showAlert('Suksess', `Invitasjon til "${invitation.groupName}" avvist`);
    } catch (error) {
      console.error('Error declining invitation:', error);
      showAlert('Feil', 'Kunne ikke avslå invitasjonen');
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
        <Text style={globalStyles.secondaryText}>Fra: {userNames[item.senderId] || item.senderId}</Text>
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
              keyExtractor={(item) => `${item.groupId}_${item.senderId}`}
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