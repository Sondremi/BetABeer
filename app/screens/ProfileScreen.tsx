import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import { sendGroupInvitation } from '../services/groupService';
import { authService } from '../services/firebase/authService';
import { auth, firestore } from '../services/firebase/FirebaseConfig';
import { acceptGroupInvitation, createGroup, declineGroupInvitation, profileService } from '../services/profileService';
import { profileChartConfig, profileChartDataset, profileScreenTokens, profileStyles } from '../styles/components/profileStyles';
import { globalStyles } from '../styles/globalStyles';
import { DrinkCategory, DrinkEntry, Group, GroupInvitation } from '../types/drinkTypes';
import { Friend } from '../types/userTypes';
import { defaultProfileImageMap, defaultProfileImages } from '../utils/defaultProfileImages';
import { showAlert } from '../utils/platformAlert';

const DefaultProfilePicture = require('../../assets/images/default/default_profilepicture.png');
const ImageMissing = require('../../assets/images/image_missing.png');
const SettingsIcon = require('../../assets/icons/noun-settings-2650525.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');
const BeerIcon = require('../../assets/icons/noun-beer-7644526.png');

const ProfileScreen: React.FC = () => {
  const { user, loading } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const [profileImageModalVisible, setProfileImageModalVisible] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [profileNameFocused, setProfileNameFocused] = useState(false);

  useEffect(() => {
    if (user && (user as any).profileImage) {
      setSelectedProfileImage((user as any).profileImage);
    }
  }, [user]);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);

  const handleProfileSave = async () => {
    if (!user) return;
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      showAlert('Feil', 'Name cannot be empty');
      return;
    }

    const payload: { name: string; profileImage?: string | null } = { name: trimmedName };
    if (selectedProfileImage) {
      payload.profileImage = selectedProfileImage;
    }

    try {
      await updateDoc(doc(firestore, 'users', user.id), payload);
      setProfileImageModalVisible(false);
    } catch (error) {
      console.error(error)
      showAlert('Feil', 'Could not update profile');
    }
  };
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [createGroupName, setCreateGroupName] = useState('');
  const [createGroupNameFocused, setCreateGroupNameFocused] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupInviteCandidates, setGroupInviteCandidates] = useState<Friend[]>([]);
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<string[]>([]);
  const [loadingGroupInviteCandidates, setLoadingGroupInviteCandidates] = useState(false);
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([]);
  const [handlingInvitation, setHandlingInvitation] = useState(false);
  const [userNames, setUserNames] = useState<{ [id: string]: string }>({});
  // Move Hook call to top level
  const [userInfo, setUserInfo] = useState<{
    weight?: number;
    gender?: 'male' | 'female';
    drinks?: DrinkEntry[];
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [drinkModalVisible, setDrinkModalVisible] = useState(false);
  const [drinkForm, setDrinkForm] = useState<{
    category: DrinkCategory | '';
    sizeDl: number | '';
    alcoholPercent: number | '' | 'custom';
    quantity: number | '';
    customAlcoholPercent: string;
  }>({
    category: '',
    sizeDl: '',
    alcoholPercent: '',
    quantity: '',
    customAlcoholPercent: '',
  });
  const currentBAC = useMemo(() => {
    if (!userInfo.drinks || !userInfo.weight || !userInfo.gender) return '0.000';
    return profileService.calculateBAC(userInfo.drinks, userInfo.weight, userInfo.gender, Date.now()).toFixed(3);
  }, [userInfo.drinks, userInfo.gender, userInfo.weight]);
  const chartProjection = useMemo(() => {
    if (!userInfo.weight || !userInfo.gender || !userInfo.drinks || userInfo.drinks.length === 0) {
      return null;
    }

    const latestDrinkTimestamp = Math.max(...userInfo.drinks.map((d) => d.timestamp));
    const fifteenMinuteMs = 15 * 60 * 1000;
    const points = Array.from({ length: 21 }, (_, i) => {
      const time = latestDrinkTimestamp + i * fifteenMinuteMs;
      const value = profileService.calculateBAC(userInfo.drinks!, userInfo.weight!, userInfo.gender!, time);
      return { time, value };
    });

    const fullLabels = points.map((point) => new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    // Keep x-axis readable on mobile by showing hourly clock labels.
    const labels = points.map((_, index) => {
      if (index === points.length - 2) return fullLabels[points.length - 1];
      if (index === points.length - 1) return '';
      if (index % 4 === 0) return fullLabels[index];
      return '';
    });
    const values = points.map((point) => point.value);
    const peak = Math.max(...values);
    const peakIndex = values.findIndex((value) => value === peak);

    let soberTimeLabel = '--:--';
    const soberWithinProjectionIndex = values.findIndex((value, index) => index > 0 && value <= 0.001);
    if (soberWithinProjectionIndex >= 0) {
      soberTimeLabel = fullLabels[soberWithinProjectionIndex];
    } else {
      const maxLookaheadSteps = Math.floor((24 * 60) / 15);
      for (let step = points.length; step <= maxLookaheadSteps; step += 1) {
        const time = latestDrinkTimestamp + step * fifteenMinuteMs;
        const value = profileService.calculateBAC(userInfo.drinks!, userInfo.weight!, userInfo.gender!, time);
        if (value <= 0.001) {
          soberTimeLabel = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          break;
        }
      }
    }

    return {
      labels,
      values,
      peak,
      peakTime: peakIndex >= 0 ? fullLabels[peakIndex] : '--:--',
      soberTime: soberTimeLabel,
      endBAC: values[values.length - 1] ?? 0,
    };
  }, [userInfo.drinks, userInfo.gender, userInfo.weight]);
  const chartWidth = useMemo(() => {
    const calculated = windowWidth - 116;

    // Keep current mobile behavior, but clamp harder on wider screens/web so chart never spills outside card padding.
    const maxWidth = Platform.OS === 'web' || windowWidth >= 768 ? 372 : 440;
    return Math.max(280, Math.min(calculated, maxWidth));
  }, [windowWidth]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const currenUser = auth.currentUser
      if (currenUser) {
        try {
          const userData = await profileService.getUserData(currenUser.uid);
          setUserInfo(userData);
        } catch (error) {
          console.error(error)
        }
      }
    }
    fetchUserInfo();
  }, []);

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
      groupSnapshot.docs.forEach((docSnap) => {
        const groupData = docSnap.data();
        groupMap.set(docSnap.id, {
          id: docSnap.id,
          name: groupData.name || groupData.groupName || groupData.group_name || 'Gruppenavn',
          memberCount: groupData.members?.length || 0,
          image: ImageMissing,
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
    const fetchNames = async () => {
      if (!groupInvitations.length) return;
      const idsToFetch = groupInvitations
        .map(inv => inv.fromUserId)
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

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const userData = await profileService.getUserData(currentUser.uid);
        setUserInfo(userData);
        if (!userData.weight || !userData.gender) {
          showAlert(
            'Mangler informasjon',
            'Du må angi vekt og kjønn i innstillingene for å bruke promillekalkulatoren.',
            [
              {
                text: 'Gå til innstillinger',
                onPress: () => router.push('/settings'),
              },
              { text: 'Avbryt', style: 'cancel' },
            ]
          );
        }
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke laste brukerdata');
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeOptions = (category: DrinkCategory | '') => {
    switch (category) {
      case 'øl':
        return [3.3, 5];
      case 'vin':
        return [1.25, 1.5, 1.75, 3.75, 7.5];
      case 'sprit':
        return [0.4, 0.5, 3.5, 5, 7];
      default:
        return [];
    }
  };

  const getAlcoholPercentOptions = (category: DrinkCategory | '') => {
    switch (category) {
      case 'øl':
        return [4.7];
      case 'vin':
        return [10, 12, 14, 'custom'];
      case 'sprit':
        return [22, 30, 40, 60, 'custom'];
      default:
        return [];
    }
  };

  const validateCustomAlcoholPercent = () => {
    if (drinkForm.alcoholPercent !== 'custom') return true;
    const value = parseFloat(drinkForm.customAlcoholPercent);
    if (isNaN(value)) {
      showAlert('Feil', 'Ugyldig alkoholprosent');
      return false;
    }
    if (drinkForm.category === 'vin' && (value < 10 || value > 20)) {
      showAlert('Feil', 'Alkoholprosent for vin må være mellom 10 og 20');
      return false;
    }
    if (drinkForm.category === 'sprit' && (value < 22 || value > 70)) {
      showAlert('Feil', 'Alkoholprosent for sprit må være mellom 22 og 70');
      return false;
    }
    return true;
  };

  const navigateToSettings = () => {
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

  const handleAddDrink = async () => {
    if (!drinkForm.category) {
      showAlert('Feil', 'Velg en drikkekategori');
      return;
    }
    if (!drinkForm.sizeDl) {
      showAlert('Feil', 'Velg en størrelse');
      return;
    }
    if (!drinkForm.alcoholPercent) {
      showAlert('Feil', 'Velg en alkoholprosent');
      return;
    }
    if (!validateCustomAlcoholPercent()) {
      return;
    }
    if (!drinkForm.quantity) {
      showAlert('Feil', 'Velg antall');
      return;
    }
    const alcoholPercent =
      drinkForm.alcoholPercent === 'custom'
        ? parseFloat(drinkForm.customAlcoholPercent)
        : parseFloat(drinkForm.alcoholPercent.toString());
    const drink: DrinkEntry = {
      category: drinkForm.category,
      sizeDl: parseFloat(drinkForm.sizeDl.toString()),
      alcoholPercent,
      quantity: parseInt(drinkForm.quantity.toString(), 10),
      timestamp: Date.now(),
    };
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        await profileService.addDrink(currentUser.uid, drink);
        const updatedUserData = await profileService.getUserData(currentUser.uid);
        setUserInfo(updatedUserData);
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke legge til drikke');
    }
    setDrinkModalVisible(false);
    setDrinkForm({
      category: '',
      sizeDl: '',
      alcoholPercent: '',
      quantity: '',
      customAlcoholPercent: '',
    });
  };

  const handleResetDrinks = () => {
    showAlert(
      'Nullstill drikker',
      'Er du sikker på at du vil slette alle registrerte drikker?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Nullstill',
          style: 'destructive',
          async onPress() {
            try {
              const currentUser = authService.getCurrentUser();
              if (currentUser) {
                await profileService.resetDrinks(currentUser.uid);
                setUserInfo(prev => ({ ...prev, drinks: [] }));
              }
            } catch (error) {
              console.error(error);
              showAlert('Feil', 'Kunne ikke nullstille drikker');
            }
          },
        },
      ]
    );
  };

  const handleCreateGroup = async () => {
    if (!user) return;
    const trimmedGroupName = createGroupName.trim();
    if (!trimmedGroupName) {
      showAlert('Feil', 'Gruppenavn kan ikke være tomt');
      return;
    }
    setCreatingGroup(true);
    try {
      const newGroup = await createGroup(user.id, trimmedGroupName);
      const groupWithImage: Group = { ...newGroup, image: ImageMissing };
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
        showAlert('Delvis fullført', `Gruppen ble opprettet, men ${failedInvitations} invitasjon(er) feilet.`);
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
      setGroupInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showAlert('Feil', `Kunne ikke godta invitasjonen: ${(error as Error).message}`);
    } finally {
      setHandlingInvitation(false);
    }
  };

  const handleRejectInvitation = async (invitation: GroupInvitation) => {
    if (!user) return;
    setHandlingInvitation(true);
    try {
      await declineGroupInvitation(invitation.id);
      setGroupInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
    } catch (error) {
      console.error('Error declining invitation:', error);
      showAlert('Feil', 'Kunne ikke avslå invitasjonen');
    } finally {
      setHandlingInvitation(false);
    }
  };

  const loadGroupInviteCandidates = async () => {
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
            profilePicture: data.profileImage ? defaultProfileImageMap[data.profileImage] || DefaultProfilePicture : DefaultProfilePicture,
          } as Friend;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setGroupInviteCandidates(friends);
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke laste vennelisten');
      setGroupInviteCandidates([]);
    } finally {
      setLoadingGroupInviteCandidates(false);
    }
  };

  const toggleInvitee = (friendId: string) => {
    setSelectedInviteeIds((prev) => (
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    ));
  };

  useEffect(() => {
    if (!createGroupModalVisible) return;
    loadGroupInviteCandidates();
  }, [createGroupModalVisible, user?.id]);

  if (isLoading) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContent]}>
        <Text style={globalStyles.circularImage}>Laster...</Text>
      </View>
    );
  }

  const renderGroupItem = (item: Group) => (
    <TouchableOpacity style={profileStyles.groupItem} onPress={() => navigateToGroup(item)}>
      <Image source={item.image} style={globalStyles.groupHeaderImage} />
      <View style={globalStyles.overlay}>
        <Text style={profileStyles.groupName}>{item.name}</Text>
        <Text style={profileStyles.groupMembers}>{item.memberCount} medlemmer</Text>
      </View>
    </TouchableOpacity>
  );

  const renderInvitationItem = (item: GroupInvitation) => (
    <View style={[globalStyles.listItemRow, profileStyles.invitationItemRow]}>
      <View style={profileStyles.invitationInfo}>
        <Text style={globalStyles.modalText}>{item.groupName}</Text>
        <Text style={globalStyles.secondaryText}>Fra: {userNames[item.fromUserId] || item.fromUserId}</Text>
      </View>
      <View style={profileStyles.invitationActionRow}>
        <TouchableOpacity
          style={[globalStyles.selectionButton, profileStyles.invitationRejectButton, profileStyles.invitationAcceptButton]}
          onPress={() => handleRejectInvitation(item)}
          disabled={handlingInvitation}
        >
          <Text style={[globalStyles.selectionButtonText, profileStyles.invitationRejectButtonText]}>Avslå</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[globalStyles.selectionButton, profileStyles.invitationAcceptButton]}
          onPress={() => handleAcceptInvitation(item)}
          disabled={handlingInvitation}
        >
          <Text style={globalStyles.outlineButtonGoldText}>Godta</Text>
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
        profileStyles.pageContainer,
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={globalStyles.fullWidthScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile content */}
        <View style={[globalStyles.centeredSection, profileStyles.compactCenteredSection, profileStyles.heroSection]}>
          <View style={[globalStyles.premiumCard, profileStyles.profileHeroCard]}>
            <TouchableOpacity style={profileStyles.heroSettingsButton} onPress={navigateToSettings}>
              <Image source={SettingsIcon} style={globalStyles.primaryIcon} />
            </TouchableOpacity>
            {/* Profile picture */}
            <View style={profileStyles.profileImageContainer}>
              <Image
                source={
                  (selectedProfileImage && defaultProfileImageMap[selectedProfileImage])
                    ? defaultProfileImageMap[selectedProfileImage]
                    : (user && (user as any).profileImage && defaultProfileImageMap[(user as any).profileImage])
                      ? defaultProfileImageMap[(user as any).profileImage]
                      : DefaultProfilePicture
                }
                style={[globalStyles.circularImage, profileStyles.profileImage]}
              />
              <TouchableOpacity
                style={profileStyles.editProfileImageButton}
                onPress={() => setProfileImageModalVisible(true)}
              >
                <Image source={PencilIcon} style={globalStyles.primaryIcon} />
              </TouchableOpacity>
            </View>

            {/* Name and username */}
            <Text style={[globalStyles.largeBoldText, profileStyles.profileName]}>{user?.name || 'Navn'}</Text>
            <Text style={[globalStyles.secondaryText, profileStyles.profileUsername]}>{user?.username || 'Brukernavn'}</Text>
          </View>
        {/* Modal to change profilepicture */}
        <Modal
          visible={profileImageModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setProfileImageModalVisible(false)}
        >
          <View style={globalStyles.modalContainer}> 
            <View style={[globalStyles.modalContent, profileStyles.profileModalContent]}> 
              <Text style={globalStyles.modalTitle}>Velg profilbilde</Text>
              <ScrollView contentContainerStyle={profileStyles.profileModalGrid}>
                {defaultProfileImages.map((img) => (
                  <TouchableOpacity
                    key={img}
                    style={[
                      profileStyles.profileImageChoice,
                      selectedProfileImage === img && profileStyles.profileImageChoiceSelected,
                    ]}
                    onPress={() => setSelectedProfileImage(img)}
                  >
                    <Image
                      source={defaultProfileImageMap[img]}
                      style={profileStyles.profileImageChoiceImage}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={[globalStyles.inputGroup, profileStyles.profileNameGroup]}> 
                <Text style={globalStyles.label}>Navn</Text>
                <View style={[globalStyles.inputShellDark, profileNameFocused && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    style={[globalStyles.input, profileStyles.profileNameInput]}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Your name"
                    placeholderTextColor={profileScreenTokens.nameInputPlaceholderTextColor}
                    maxLength={40}
                    autoCapitalize="words"
                    onFocus={() => setProfileNameFocused(true)}
                    onBlur={() => setProfileNameFocused(false)}
                  />
                </View>
              </View>
              <View style={globalStyles.buttonRow}>
                <TouchableOpacity style={globalStyles.cancelButton} onPress={() => setProfileImageModalVisible(false)}>
                  <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={globalStyles.saveButton} onPress={handleProfileSave}>
                  <Text style={globalStyles.saveButtonTextAlt}>Lagre</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        </View>

        { /* Blood Alcohol Level */ }
        <View style={[globalStyles.section, profileStyles.compactSection]}>
          <View style={[globalStyles.premiumCard, profileStyles.sectionCard, profileStyles.sectionCardSpacing]}>
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.sectionTitle}>Promillekalkulator</Text>
              <View style={profileStyles.bacActionRow}>
                <TouchableOpacity
                  style={[globalStyles.primaryButtonShadow, profileStyles.bacActionButton, (!userInfo.weight || !userInfo.gender) && globalStyles.disabledButton]}
                  onPress={() => setDrinkModalVisible(true)}
                  disabled={!userInfo.weight || !userInfo.gender}
                >
                  <Text style={[globalStyles.primaryButtonText, profileStyles.bacActionButtonText]}>Legg til drikke</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.dangerButton, profileStyles.bacResetButton, (!userInfo.weight || !userInfo.gender) && globalStyles.disabledButton]}
                  onPress={handleResetDrinks}
                  disabled={!userInfo.weight || !userInfo.gender}
                >
                  <Text style={globalStyles.dangerButtonText}>Nullstill drikker</Text>
                </TouchableOpacity>
              </View>
            </View>
            {chartProjection && (
              <View style={[globalStyles.inputGroup, profileStyles.chartCard]}>
                <Text style={globalStyles.sectionTitle}>Anslått promille de neste 5 timene</Text>
                <View style={profileStyles.chartSummaryRow}>
                  <View style={profileStyles.statPill}>
                    <Text style={profileStyles.statLabel}>Promille nå</Text>
                    <View style={profileStyles.statMainSlot}>
                      <Text style={profileStyles.statValue}>{currentBAC}‰</Text>
                    </View>
                  </View>
                  <View style={profileStyles.statPill}>
                    <Text style={profileStyles.statLabel}>Høyeste {chartProjection.peakTime}</Text>
                    <View style={profileStyles.statMainSlot}>
                      <Text style={profileStyles.statValue}>{chartProjection.peak.toFixed(3)}‰</Text>
                    </View>
                  </View>
                  <View style={profileStyles.statPill}>
                    <Text style={profileStyles.statLabel}>Edru kl</Text>
                    <View style={profileStyles.statMainSlot}>
                      <Text style={profileStyles.statValue}>{chartProjection.soberTime}</Text>
                    </View>
                  </View>
                </View>
                <View style={[profileStyles.chartInteractiveShell, { width: chartWidth }]}>
                  <LineChart
                    data={{
                      labels: chartProjection.labels,
                      datasets: [
                        { data: chartProjection.values, ...profileChartDataset },
                      ],
                    }}
                    width={chartWidth}
                    height={260}
                    yAxisLabel=""
                    yAxisSuffix="‰"
                    fromZero
                    chartConfig={profileChartConfig}
                    bezier
                    style={profileStyles.chart}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Group Invitations Section */}
        <View style={[globalStyles.section, profileStyles.compactSection]}>
          <View style={[globalStyles.premiumCard, profileStyles.sectionCard, profileStyles.sectionCardSpacing]}>
            <View style={profileStyles.groupsHeader}>
              <Text style={globalStyles.sectionTitleLeft}>Gruppeinvitasjoner</Text>
              {groupInvitations.length > 0 && (
                <View style={profileStyles.invitationBadge}>
                  <Text style={profileStyles.invitationBadgeText}>{groupInvitations.length}</Text>
                </View>
              )}
            </View>
            {groupInvitations.length > 0 ? (
              <View style={[globalStyles.listContainer, profileStyles.listContainerCard]}>
                {groupInvitations.map((item) => (
                  <View key={`${item.id}_${item.groupId}`} style={profileStyles.invitationItemSpacing}>
                    {renderInvitationItem(item)}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={globalStyles.emptyStateText}>Ingen invitasjoner</Text>
            )}
          </View>
        </View>

        {/* Groups section */}
        <View style={profileStyles.groupsSection}>
          <View style={[globalStyles.premiumCard, profileStyles.sectionCard, profileStyles.sectionCardSpacing]}>
            <View style={profileStyles.groupsHeaderAction}>
              <Text style={globalStyles.sectionTitleLeft}>Mine grupper</Text>
              <TouchableOpacity
                style={[globalStyles.outlineButton, profileStyles.groupsHeaderActionButton]}
                onPress={() => {
                  setCreateGroupName('');
                  setSelectedInviteeIds([]);
                  setCreateGroupModalVisible(true);
                }}
                disabled={creatingGroup}
              >
                <Text
                  style={[globalStyles.outlineButtonGoldText, profileStyles.groupsHeaderActionButtonText]}
                  numberOfLines={1}
                >
                  {creatingGroup ? 'Oppretter...' : 'Opprett ny gruppe'}
                </Text>
              </TouchableOpacity>
            </View>
            <View>
              {Array.from({ length: Math.ceil(groups.length / 2) }, (_, rowIndex) => {
                const rowItems = groups.slice(rowIndex * 2, rowIndex * 2 + 2);
                return (
                  <View key={`group-row-${rowIndex}`} style={profileStyles.groupRow}>
                    {rowItems.map((item) => renderGroupItem(item))}
                    {rowItems.length === 1 && <View style={profileStyles.groupRowSpacer} />}
                  </View>
                );
              })}
            </View>
          </View>
          <Modal
            visible={createGroupModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => {
              setCreateGroupName('');
              setCreateGroupModalVisible(false);
            }}
          >
            <View style={globalStyles.modalContainer}>
              <View style={[globalStyles.modalContent, profileStyles.createGroupModalContent]}>
                <Text style={globalStyles.modalTitle}>Opprett gruppe</Text>
                <View style={globalStyles.inputGroup}>
                  <Text style={globalStyles.label}>Gruppenavn</Text>
                  <View style={profileStyles.createGroupRow}>
                    <View style={[globalStyles.inputShellDark, profileStyles.createGroupInputShell, createGroupNameFocused && globalStyles.inputShellFocusedGold]}>
                      <TextInput
                        placeholder="Skriv gruppenavn"
                        placeholderTextColor={profileScreenTokens.createGroupPlaceholderTextColor}
                        value={createGroupName}
                        onChangeText={setCreateGroupName}
                        style={[globalStyles.input, profileStyles.createGroupInput]}
                        maxLength={40}
                        onFocus={() => setCreateGroupNameFocused(true)}
                        onBlur={() => setCreateGroupNameFocused(false)}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        profileStyles.createGroupActionButton,
                        (!createGroupName.trim() || creatingGroup) && globalStyles.disabledButton,
                      ]}
                      onPress={handleCreateGroup}
                      disabled={creatingGroup || !createGroupName.trim()}
                    >
                      <Text style={profileStyles.createGroupActionButtonText}>Opprett</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={globalStyles.inputGroup}>
                  <Text style={globalStyles.label}>Inviter venner</Text>
                  {loadingGroupInviteCandidates ? (
                    <Text style={globalStyles.secondaryText}>Laster venner...</Text>
                  ) : groupInviteCandidates.length === 0 ? (
                    <Text style={globalStyles.secondaryText}>Du har ingen venner å invitere enda.</Text>
                  ) : (
                    <View>
                      <View style={profileStyles.inviteBulkActionsRow}>
                        <TouchableOpacity onPress={() => setSelectedInviteeIds(groupInviteCandidates.map((friend) => friend.id))}>
                          <Text style={profileStyles.inviteBulkActionText}>Velg alle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedInviteeIds([])}>
                          <Text style={profileStyles.inviteBulkActionText}>Fjern alle</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={profileStyles.inviteListBox}>
                        <ScrollView nestedScrollEnabled style={profileStyles.inviteListScroll} contentContainerStyle={profileStyles.inviteListScrollContent}>
                        {groupInviteCandidates.map((friend) => {
                          const selected = selectedInviteeIds.includes(friend.id);
                          return (
                            <TouchableOpacity
                              key={friend.id}
                              style={[profileStyles.inviteListRow, selected && profileStyles.inviteListRowSelected]}
                              onPress={() => toggleInvitee(friend.id)}
                            >
                              <Image source={friend.profilePicture} style={profileStyles.inviteListAvatar} />
                              <View style={profileStyles.inviteListInfo}>
                                <Text style={profileStyles.inviteListName}>{friend.name}</Text>
                                <Text style={globalStyles.secondaryText}>@{friend.username}</Text>
                              </View>
                              <Text style={[profileStyles.inviteStatusText, selected && profileStyles.inviteStatusTextSelected]}>
                                {selected ? 'Inviteres' : 'Trykk for å invitere'}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                        </ScrollView>
                      </View>
                    </View>
                  )}
                </View>
                <View style={globalStyles.editButtonsContainer}>
                  <TouchableOpacity onPress={() => {
                    setCreateGroupName('');
                    setSelectedInviteeIds([]);
                    setCreateGroupModalVisible(false);
                  }}>
                    <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <Modal
            visible={drinkModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setDrinkModalVisible(false)}
          >
            <View style={globalStyles.modalContainer}>
              <View style={[globalStyles.modalContent, profileStyles.drinkModalContent]}> 
                <ScrollView contentContainerStyle={profileStyles.drinkModalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={[globalStyles.modalTitle, profileStyles.drinkModalTitle]}> 
                    Legg til drikke
                  </Text>

                  <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                    <Text style={globalStyles.label}>Kategori</Text>
                    <View style={[globalStyles.pickerInput, profileStyles.pickerGlowShell]}>
                      <Picker
                        style={globalStyles.picker}
                        itemStyle={profileStyles.pickerItem}
                        selectedValue={drinkForm.category}
                        onValueChange={(value: DrinkCategory | '') =>
                          setDrinkForm({ ...drinkForm, category: value, sizeDl: '', alcoholPercent: '', customAlcoholPercent: '' })
                        }
                      >
                        <Picker.Item label="Velg kategori" value="" />
                        <Picker.Item label="Øl" value="øl" />
                        <Picker.Item label="Vin" value="vin" />
                        <Picker.Item label="Sprit" value="sprit" />
                      </Picker>
                    </View>
                  </View>

                  {drinkForm.category && (
                    <>
                      <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                        <Text style={globalStyles.label}>Størrelse (dl)</Text>
                        <View style={[globalStyles.pickerInput, profileStyles.pickerGlowShell]}>
                          <Picker
                            style={globalStyles.picker}
                            itemStyle={profileStyles.pickerItem}
                            selectedValue={drinkForm.sizeDl}
                            onValueChange={(value: number | '') => setDrinkForm({ ...drinkForm, sizeDl: value })}
                          >
                            <Picker.Item label="Velg størrelse" value="" />
                            {getSizeOptions(drinkForm.category).map(size => (
                              <Picker.Item key={size} label={`${size} dl`} value={size} />
                            ))}
                          </Picker>
                        </View>
                      </View>

                      <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                        <Text style={globalStyles.label}>Alkoholprosent</Text>
                        <View style={[globalStyles.pickerInput, profileStyles.pickerGlowShell]}>
                          <Picker
                            style={globalStyles.picker}
                            itemStyle={profileStyles.pickerItem}
                            selectedValue={drinkForm.alcoholPercent}
                            onValueChange={(value: number | '' | 'custom') =>
                              setDrinkForm({ ...drinkForm, alcoholPercent: value, customAlcoholPercent: '' })
                            }
                          >
                            <Picker.Item label="Velg alkoholprosent" value="" />
                            {getAlcoholPercentOptions(drinkForm.category).map(percent => (
                              <Picker.Item
                                key={percent}
                                label={percent === 'custom' ? 'Egendefinert' : `${percent}%`}
                                value={percent}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>

                      {drinkForm.alcoholPercent === 'custom' && (
                        <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                          <Text style={globalStyles.label}>Egendefinert alkoholprosent</Text>
                          <TextInput
                            style={[globalStyles.input, profileStyles.customAlcoholInput]}
                            value={drinkForm.customAlcoholPercent}
                            onChangeText={(text) => setDrinkForm({ ...drinkForm, customAlcoholPercent: text })}
                            placeholder={
                              drinkForm.category === 'vin' ? '10–20%' : '22–70%'
                            }
                            placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                            keyboardType="numeric"
                          />
                        </View>
                      )}

                      <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                        <Text style={globalStyles.label}>Antall</Text>
                        <View style={[globalStyles.pickerInput, profileStyles.pickerGlowShell]}>
                          <Picker
                            style={globalStyles.picker}
                            itemStyle={profileStyles.pickerItem}
                            selectedValue={drinkForm.quantity}
                            onValueChange={(value: number | '') => setDrinkForm({ ...drinkForm, quantity: value })}
                          >
                            <Picker.Item label="Velg antall" value="" />
                            {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                              <Picker.Item key={num} label={`${num}`} value={num} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                    </>
                  )}

                  <View style={globalStyles.buttonRow}>
                    <TouchableOpacity
                      style={globalStyles.cancelButton}
                      onPress={() => setDrinkModalVisible(false)}
                    >
                      <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={globalStyles.saveButton}
                      onPress={handleAddDrink}
                    >
                      <Text style={globalStyles.saveButtonTextAlt}>Lagre</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;