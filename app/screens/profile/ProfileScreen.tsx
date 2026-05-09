import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { GuestUpgradePrompt } from '../../components/GuestUpgradePrompt';
import { useAuth } from '../../context/AuthContext';
import { MEDIA_UPLOAD_VERIFICATION_MESSAGE, authService } from '../../services/firebase/authService';
import { firestore } from '../../services/firebase/FirebaseConfig';
import { sendGroupInvitation } from '../../services/groupService';
import { uploadProfileImage } from '../../services/profileImageUploadService';
import { acceptGroupInvitation, createGroup, declineGroupInvitation, profileService } from '../../services/profileService';
import { globalStyles } from '../../styles/globalStyles';
import type { Group, GroupInvitation } from '../../types/drinkTypes';
import type { Friend } from '../../types/userTypes';
import { INPUT_LIMITS, normalizeSingleLineText } from '../../utils/inputValidation';
import { showAlert } from '../../utils/platformAlert';
import { resolveProfileImageSource } from '../../utils/profileImage';
import ImageCropModal from '../../components/ImageCropModal';
import ProfileBacSection from './bac/ProfileBacSection';
import ProfileGroupInvitationsSection from './components/ProfileGroupInvitationsSection';
import ProfileGroupsSection from './components/ProfileGroupsSection';
import ProfileHeaderSection from './components/ProfileHeaderSection';
import ProfileImageModal from './components/ProfileImageModal';
import ProfileOnboardingModal from './components/ProfileOnboardingModal';
import { DefaultProfilePicture, ImageMissing } from './profileAssets';
import type { ProfileUserInfo } from './profileTypes';

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [profileImageModalVisible, setProfileImageModalVisible] = useState(false);
  const [profileCropModalVisible, setProfileCropModalVisible] = useState(false);
  const [onboardingModalVisible, setOnboardingModalVisible] = useState(false);
  const [onboardingStorageKey, setOnboardingStorageKey] = useState<string | null>(null);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [pendingProfileCrop, setPendingProfileCrop] = useState<{
    uri: string;
    width?: number;
    height?: number;
  } | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [createGroupName, setCreateGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupInviteCandidates, setGroupInviteCandidates] = useState<Friend[]>([]);
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<string[]>([]);
  const [loadingGroupInviteCandidates, setLoadingGroupInviteCandidates] = useState(false);

  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([]);
  const [handlingInvitation, setHandlingInvitation] = useState(false);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [incomingFriendRequestCount, setIncomingFriendRequestCount] = useState(0);

  const [userInfo, setUserInfo] = useState<ProfileUserInfo>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInvitationsExpanded, setIsInvitationsExpanded] = useState(true);

  const lastProfileImageRef = useRef<string | null>(null);

  useEffect(() => {
    const userProfileImage = (user as any)?.profileImage || null;
    if (userProfileImage !== lastProfileImageRef.current) {
      if (selectedProfileImage === null || selectedProfileImage === lastProfileImageRef.current) {
        setSelectedProfileImage(userProfileImage);
      }
      lastProfileImageRef.current = userProfileImage;
    }
  }, [selectedProfileImage, user]);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (userInfo.name) {
      setDisplayName(userInfo.name);
    }
  }, [userInfo.name]);

  const loadUserData = useCallback(async () => {
    try {
      const currentUserId = user?.id ?? authService.getCurrentUser()?.uid;
      if (!currentUserId) {
        setUserInfo({});
        return;
      }

      setIsLoading(true);
      const userData = await profileService.getUserData(currentUserId);
      setUserInfo(userData);

      if (!userData.weight || !userData.gender) {
        const alertStorageKey = `bacMissingInfoAlertShown:${currentUserId}`;
        const hasShownAlert = await AsyncStorage.getItem(alertStorageKey);

        if (!hasShownAlert) {
          setOnboardingStorageKey(alertStorageKey);
          setOnboardingModalVisible(true);
        }
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke laste brukerdata');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  useEffect(() => {
    if (!user?.id) return;
    loadUserData();
  }, [user?.id, loadUserData]);

  useEffect(() => {
    if (!user) return;

    const groupQuery = query(collection(firestore, 'groups'), where('members', 'array-contains', user.id));
    const invitationQuery = query(
      collection(firestore, 'group_invitations'),
      where('toUserId', '==', user.id),
      where('status', '==', 'pending')
    );

    const unsubscribeGroups = onSnapshot(groupQuery, (groupSnapshot) => {
      const groupMap = new Map<string, Group>();
      const sortedGroupDocs = [...groupSnapshot.docs].sort((a, b) => {
        const aCreatedAt = a.data().createdAt?.toMillis?.() ?? 0;
        const bCreatedAt = b.data().createdAt?.toMillis?.() ?? 0;
        return bCreatedAt - aCreatedAt;
      });

      sortedGroupDocs.forEach((docSnap) => {
        const groupData = docSnap.data();
        groupMap.set(docSnap.id, {
          id: docSnap.id,
          name: groupData.name || groupData.groupName || groupData.group_name || 'Gruppenavn',
          memberCount: groupData.members?.length || 0,
          image: resolveProfileImageSource(groupData.image, ImageMissing),
          imageUrl: typeof groupData.image === 'string' ? groupData.image : null,
          createdBy: groupData.createdBy || '',
          members: groupData.members || [],
        });
      });

      setGroups(Array.from(groupMap.values()));
    });

    const unsubscribeInvitations = onSnapshot(invitationQuery, (snapshot) => {
      const invitationList = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          groupName: data.groupName || data.group_name || 'Group',
        };
      }) as GroupInvitation[];

      setGroupInvitations(invitationList);
    });

    return () => {
      unsubscribeGroups();
      unsubscribeInvitations();
    };
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setIncomingFriendRequestCount(0);
      return;
    }

    const incomingFriendRequestsQuery = query(
      collection(firestore, 'friendRequests'),
      where('toUserId', '==', user.id),
      where('status', '==', 'pending')
    );

    const unsubscribeIncomingFriendRequests = onSnapshot(incomingFriendRequestsQuery, (snapshot) => {
      setIncomingFriendRequestCount(snapshot.size);
    });

    return () => {
      unsubscribeIncomingFriendRequests();
    };
  }, [user?.id]);

  useEffect(() => {
    const fetchNames = async () => {
      if (!groupInvitations.length) return;

      const idsToFetch = groupInvitations
        .map((invitation) => invitation.fromUserId)
        .filter((id) => !(id in userNames));

      if (!idsToFetch.length) return;

      const newNames: Record<string, string> = {};
      await Promise.all(
        idsToFetch.map(async (id) => {
          const userDoc = await getDoc(doc(firestore, 'users', id));
          newNames[id] = userDoc.exists() ? userDoc.data().name || id : id;
        })
      );

      if (Object.keys(newNames).length > 0) {
        setUserNames((prev) => ({ ...prev, ...newNames }));
      }
    };

    fetchNames();
  }, [groupInvitations, userNames]);

  const loadGroupInviteCandidates = useCallback(async () => {
    if (!user) {
      setGroupInviteCandidates([]);
      return;
    }

    setLoadingGroupInviteCandidates(true);
    try {
      const userSnap = await getDoc(doc(firestore, 'users', user.id));
      const friendIds = userSnap.exists() ? ((userSnap.data().friends || []) as string[]) : [];

      if (!friendIds.length) {
        setGroupInviteCandidates([]);
        return;
      }

      const friendSnaps = await Promise.all(friendIds.map((friendId) => getDoc(doc(firestore, 'users', friendId))));
      const friends = friendSnaps
        .filter((snap) => snap.exists())
        .map((snap) => {
          const data = snap.data();
          return {
            id: snap.id,
            name: data.name || 'Ukjent',
            username: data.username || 'ukjent',
            profilePicture: resolveProfileImageSource(data.profileImage, DefaultProfilePicture),
          } as Friend;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setGroupInviteCandidates(friends);
    } catch (error) {
      console.error(error);
      setGroupInviteCandidates([]);
    } finally {
      setLoadingGroupInviteCandidates(false);
    }
  }, [user]);

  useEffect(() => {
    if (!createGroupModalVisible) return;
    loadGroupInviteCandidates();
  }, [createGroupModalVisible, loadGroupInviteCandidates]);

  const handleProfileSave = async () => {
    if (!user) return;

    const trimmedName = normalizeSingleLineText(displayName);
    if (!trimmedName) {
      showAlert('Feil', 'Navn kan ikke være tomt');
      return;
    }
    if (trimmedName.length > INPUT_LIMITS.profileNameMax) {
      showAlert('Feil', `Navn kan maks være ${INPUT_LIMITS.profileNameMax} tegn`);
      return;
    }

    const payload: { name: string; profileImage?: string | null } = {
      name: trimmedName,
      profileImage: selectedProfileImage ?? null,
    };

    try {
      await updateDoc(doc(firestore, 'users', user.id), payload);
      setProfileImageModalVisible(false);
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke oppdatere');
    }
  };

  const showProfileUploadAlert = useCallback((title: string, message: string) => {
    const shouldReopenModal = profileImageModalVisible;

    if (shouldReopenModal) {
      setProfileImageModalVisible(false);
    }

    setTimeout(() => {
      showAlert(title, message, [
        {
          text: 'OK',
          onPress: () => {
            if (shouldReopenModal) {
              setProfileImageModalVisible(true);
            }
          },
        },
      ]);
    }, shouldReopenModal ? 80 : 0);
  }, [profileImageModalVisible]);

  const handleUploadProfileImage = async () => {
    if (!user?.emailVerified) {
      return;
    }

    if (!user?.id) {
      showProfileUploadAlert('Feil', 'Du må være logget inn for å laste opp bilde');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          showProfileUploadAlert('Tilgang mangler', 'Gi tilgang til bilder for å laste opp profilbilde.');
          return;
        }
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (pickerResult.canceled || !pickerResult.assets?.length) {
        return;
      }

      const selectedAsset = pickerResult.assets[0];
      setPendingProfileCrop({
        uri: selectedAsset.uri,
        width: selectedAsset.width,
        height: selectedAsset.height,
      });
      setProfileImageModalVisible(false);
      setProfileCropModalVisible(true);
    } catch (error) {
      console.error(error);
      showProfileUploadAlert('Feil', (error as Error).message || 'Kunne ikke laste opp profilbildet.');
    }
  };

  const handleProfileCropCancel = () => {
    setProfileCropModalVisible(false);
    setPendingProfileCrop(null);
    setProfileImageModalVisible(true);
  };

  const handleProfileCropConfirm = async (croppedUri: string) => {
    if (!user?.id) return;
    setProfileCropModalVisible(false);
    setPendingProfileCrop(null);
    setProfileImageModalVisible(true);

    try {
      await authService.ensureVerifiedEmailForMediaUpload();
      setUploadingProfileImage(true);
      const uploadedImageUrl = await uploadProfileImage(user.id, croppedUri);
      const cacheBustedUrl = `${uploadedImageUrl}${uploadedImageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setSelectedProfileImage(cacheBustedUrl);
    } catch (error) {
      console.error(error);
      showProfileUploadAlert('Feil', (error as Error).message || 'Kunne ikke laste opp profilbildet.');
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const navigateToFriends = () => {
    router.push('/friends');
  };

  const navigateToSettings = () => {
    router.push('/settings');
  };

  const dismissOnboarding = async () => {
    setOnboardingModalVisible(false);
    if (!onboardingStorageKey) return;

    try {
      await AsyncStorage.setItem(onboardingStorageKey, 'true');
    } catch (error) {
      console.error('Failed to persist onboarding dismissal:', error);
    }
  };

  const goToSettingsFromOnboarding = async () => {
    await dismissOnboarding();
    router.push('/settings');
  };

  const navigateToGroup = async (group: Group) => {
    try {
      await AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(group));
    } catch (error) {
      console.error('Error saving selected group:', error);
    }
    router.push({ pathname: '/groups', params: { selectedGroup: JSON.stringify(group) } });
  };

  const handleCreateGroup = async () => {
    if (!user) return;

    const trimmedGroupName = normalizeSingleLineText(createGroupName);
    if (!trimmedGroupName) {
      showAlert('Feil', 'Gruppenavn kan ikke være tomt');
      return;
    }
    if (trimmedGroupName.length > INPUT_LIMITS.groupNameMax) {
      showAlert('Feil', `Gruppenavn kan maks være ${INPUT_LIMITS.groupNameMax} tegn`);
      return;
    }

    setCreatingGroup(true);
    try {
      const newGroup = await createGroup(user.id, trimmedGroupName);
      const groupWithImage: Group = { ...newGroup, image: ImageMissing, imageUrl: null };
      const inviteTargets = selectedInviteeIds.filter((inviteeId) => inviteeId !== user.id);

      const invitationResults = await Promise.allSettled(
        inviteTargets.map((inviteeId) => sendGroupInvitation(inviteeId, groupWithImage))
      );
      const failedInvitations = invitationResults.filter((result) => result.status === 'rejected').length;

      await AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(groupWithImage));
      setCreateGroupName('');
      setSelectedInviteeIds([]);
      setCreateGroupModalVisible(false);

      if (failedInvitations > 0) {
        showAlert('Delvis fullført', `Gruppen ble opprettet, men ${failedInvitations} invitasjon(er) feilet`);
      }

      router.push({ pathname: '/groups', params: { selectedGroup: JSON.stringify(groupWithImage) } });
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
      await acceptGroupInvitation(invitation);
      setGroupInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
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
      await declineGroupInvitation(invitation.id);
      setGroupInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
    } catch (error) {
      console.error('Error declining invitation:', error);
      showAlert('Feil', 'Kunne ikke avslå invitasjonen');
    } finally {
      setHandlingInvitation(false);
    }
  };

  const toggleInvitee = (friendId: string) => {
    setSelectedInviteeIds((prev) => (
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    ));
  };

  const openCreateGroupModal = () => {
    setCreateGroupName('');
    setSelectedInviteeIds([]);
    setCreateGroupModalVisible(true);
  };

  const closeCreateGroupModal = () => {
    setCreateGroupName('');
    setSelectedInviteeIds([]);
    setCreateGroupModalVisible(false);
  };

  const selectAllInvitees = () => {
    setSelectedInviteeIds(groupInviteCandidates.map((friend) => friend.id));
  };

  const clearInvitees = () => {
    setSelectedInviteeIds([]);
  };

  if (isLoading) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContent]}>
        <Text style={globalStyles.circularImage}>Laster...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContent]}>
        <Text style={globalStyles.largeBoldText}>Laster...</Text>
      </View>
    );
  }

  if ((user as any)?.isGuest) {
    const guestHasGroups = groups.length > 0;
    return (
      <GuestUpgradePrompt
        title="Profil er låst for gjest"
        description="Opprett en bruker for å få tilgang til profil, drikkehistorikk og gruppeinvitasjoner."
        showBackToGroupButton
        backToGroupButtonLabel={guestHasGroups ? 'Tilbake til gruppe' : 'Bli med i gruppen igjen'}
        backToGroupRoute={guestHasGroups ? '/groups' : '/login'}
      />
    );
  }

  const displayNameLabel = user?.name || userInfo.name || 'Navn';
  const usernameLabel = user?.username || userInfo.username || 'Brukernavn';
  const currentProfileImage = selectedProfileImage || (user as any)?.profileImage || null;
  const profileImageSource = resolveProfileImageSource(currentProfileImage, DefaultProfilePicture);
  const isEmailVerified = Boolean(user?.emailVerified);

  return (
    <KeyboardAvoidingView
      style={Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={globalStyles.fullWidthScrollContent} keyboardShouldPersistTaps="handled">
        <ProfileHeaderSection
          displayName={displayNameLabel}
          username={usernameLabel}
          profileImageSource={profileImageSource}
          incomingFriendRequestCount={incomingFriendRequestCount}
          onNavigateToSettings={navigateToSettings}
          onNavigateToFriends={navigateToFriends}
          onOpenImageModal={() => setProfileImageModalVisible(true)}
        />

        <ProfileImageModal
          visible={profileImageModalVisible}
          onClose={() => setProfileImageModalVisible(false)}
          onSave={handleProfileSave}
          onUpload={handleUploadProfileImage}
          uploading={uploadingProfileImage}
          uploadDisabled={!isEmailVerified}
          uploadDisabledMessage={MEDIA_UPLOAD_VERIFICATION_MESSAGE}
          selectedProfileImage={selectedProfileImage}
          setSelectedProfileImage={setSelectedProfileImage}
          currentProfileImage={currentProfileImage}
          displayName={displayName}
          setDisplayName={setDisplayName}
        />

        <ImageCropModal
          visible={profileCropModalVisible}
          imageUri={pendingProfileCrop?.uri ?? null}
          imageWidth={pendingProfileCrop?.width}
          imageHeight={pendingProfileCrop?.height}
          aspectRatio={1}
          shape="circle"
          title="Tilpass profilbilde"
          onCancel={handleProfileCropCancel}
          onConfirm={handleProfileCropConfirm}
        />

        <ProfileOnboardingModal
          visible={onboardingModalVisible}
          onDismiss={dismissOnboarding}
          onGoToSettings={goToSettingsFromOnboarding}
        />

        <ProfileBacSection
          userId={user?.id}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
        />

        <ProfileGroupInvitationsSection
          invitations={groupInvitations}
          userNames={userNames}
          handlingInvitation={handlingInvitation}
          isExpanded={isInvitationsExpanded}
          onToggleExpanded={() => setIsInvitationsExpanded((prev) => !prev)}
          onAcceptInvitation={handleAcceptInvitation}
          onRejectInvitation={handleRejectInvitation}
        />

        <ProfileGroupsSection
          groups={groups}
          creatingGroup={creatingGroup}
          createGroupModalVisible={createGroupModalVisible}
          onOpenCreateGroupModal={openCreateGroupModal}
          onCloseCreateGroupModal={closeCreateGroupModal}
          onCreateGroup={handleCreateGroup}
          onNavigateToGroup={navigateToGroup}
          createGroupName={createGroupName}
          setCreateGroupName={setCreateGroupName}
          groupInviteCandidates={groupInviteCandidates}
          loadingGroupInviteCandidates={loadingGroupInviteCandidates}
          selectedInviteeIds={selectedInviteeIds}
          onToggleInvitee={toggleInvitee}
          onSelectAllInvitees={selectAllInvitees}
          onClearInvitees={clearInvitees}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;
