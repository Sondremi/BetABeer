import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/firebase/authService';
import { firestore } from '../services/firebase/FirebaseConfig';
import { acceptGroupInvitation, createGroup, declineGroupInvitation, profileService } from '../services/profileService';
import { profileStyles } from '../styles/components/profileStyles';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { DrinkCategory, DrinkEntry, Group, GroupInvitation } from '../types/drinkTypes';
import { defaultProfileImageMap, defaultProfileImages } from '../utils/defaultProfileImages';
import { showAlert } from '../utils/platformAlert';

const useAnimatedBACText = (
  drinks: DrinkEntry[] | undefined,
  weight: number | undefined,
  gender: 'male' | 'female' | undefined,
  currentTime: number
) => {
  const currentBAC = drinks && weight && gender
    ? profileService.calculateBAC(drinks, weight, gender, currentTime)
    : 0;
  const color = currentBAC < 1 ? ('#4CAF50') :
                currentBAC <= 2 ? ('#F57C00') :
                ('#FF0000');
  const emoji = currentBAC < 1 ? '🥂' :
                currentBAC <= 2 ? '🍻' :
                currentBAC < 3 ? '🥴' : '💀'
  const exclamationMarks = currentBAC > 2.5 ? '!'.repeat(Math.min(3, Math.floor((currentBAC - 2.5) / 0.1))) : '';
  const isHighBAC = currentBAC >= 3;
  const scale = useSharedValue(isHighBAC ? 1.2 : 1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));
  scale.value = isHighBAC ? 1.2 : 1; // Update scale on re-render

  return {
    currentBAC: currentBAC.toFixed(3),
    color,
    emoji,
    exclamationMarks,
    isHighBAC,
    animatedStyle,
  };
};

const DefaultProfilePicture = require('../../assets/images/default/default_profilepicture.png');
const ImageMissing = require('../../assets/images/image_missing.png');
const SettingsIcon = require('../../assets/icons/noun-settings-2650525.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');

type DrinkFormState = {
  category: DrinkCategory | 'custom' | '';
  sizeDl: number | '';
  alcoholPercent: number | '' | 'custom';
  quantity: number | '';
  customAlcoholPercent: string;
  customDrinkName: string;
  customSizeDl: string;
  customAlcoholPercentManual: string;
  customQuantity: string;
};

const INITIAL_DRINK_FORM: DrinkFormState = {
  category: '',
  sizeDl: '',
  alcoholPercent: '',
  quantity: '',
  customAlcoholPercent: '',
  customDrinkName: '',
  customSizeDl: '',
  customAlcoholPercentManual: '',
  customQuantity: '',
};

const ProfileScreen: React.FC = () => {
  const { user, loading } = useAuth();
  const [profileImageModalVisible, setProfileImageModalVisible] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');

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
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([]);
  const [handlingInvitation, setHandlingInvitation] = useState(false);
  const [userNames, setUserNames] = useState<{ [id: string]: string }>({});
  // Move Hook call to top level
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    username?: string;
    weight?: number;
    gender?: 'male' | 'female';
    drinks?: DrinkEntry[];
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [drinkModalVisible, setDrinkModalVisible] = useState(false);
  const [drinkForm, setDrinkForm] = useState<DrinkFormState>(INITIAL_DRINK_FORM);
  const [bacCalculationTime, setBacCalculationTime] = useState(() => Date.now());
  const { currentBAC, color, emoji, exclamationMarks, isHighBAC, animatedStyle } = useAnimatedBACText(
    userInfo.drinks,
    userInfo.weight,
    userInfo.gender,
    bacCalculationTime
  );

  useEffect(() => {
    if (!userInfo.drinks?.length || !userInfo.weight || !userInfo.gender) {
      return;
    }

    // Keep BAC display current as metabolism changes over time.
    const intervalId = setInterval(() => {
      setBacCalculationTime(Date.now());
    }, 15000);

    return () => clearInterval(intervalId);
  }, [userInfo.drinks, userInfo.weight, userInfo.gender]);

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
  }, [groupInvitations, userNames]);

  const loadUserData = useCallback(async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const userData = await profileService.getUserData(currentUser.uid);
        setUserInfo(userData);

        if (!userData.weight || !userData.gender) {
          const alertStorageKey = `bacMissingInfoAlertShown:${currentUser.uid}`;
          const hasShownAlert = await AsyncStorage.getItem(alertStorageKey);

          if (!hasShownAlert) {
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
            await AsyncStorage.setItem(alertStorageKey, 'true');
          }
        }
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke laste brukerdata');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  useEffect(() => {
    if (userInfo.name) {
      setDisplayName(userInfo.name);
    }
  }, [userInfo.name]);

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

  const getSizeOptionLabel = (category: DrinkCategory | 'custom' | '', size: number) => {
    if (category === 'sprit') {
      if (size === 0.4) return `${size} dl (shot)`;
      if (size === 0.5) return `${size} dl (stor shot)`;
    }

    return `${size} dl`;
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

  const inferCategoryFromAlcoholPercent = (alcoholPercent: number): DrinkCategory => {
    if (alcoholPercent < 8) return 'øl';
    if (alcoholPercent < 22) return 'vin';
    return 'sprit';
  };

  const parseNumericInput = (value: string): number => parseFloat(value.replace(',', '.'));

  const validateCustomAlcoholPercent = () => {
    if (drinkForm.category === 'custom') return true;
    if (drinkForm.alcoholPercent !== 'custom') return true;
    const value = parseNumericInput(drinkForm.customAlcoholPercent);
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
    let drink: DrinkEntry;

    if (drinkForm.category !== 'custom') {
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
          ? parseNumericInput(drinkForm.customAlcoholPercent)
          : parseFloat(drinkForm.alcoholPercent.toString());

      drink = {
        category: drinkForm.category,
        sizeDl: parseFloat(drinkForm.sizeDl.toString()),
        alcoholPercent,
        quantity: parseInt(drinkForm.quantity.toString(), 10),
        timestamp: Date.now(),
      };
    } else {
      const sizeDl = parseNumericInput(drinkForm.customSizeDl);
      const alcoholPercent = parseNumericInput(drinkForm.customAlcoholPercentManual);
      const quantity = parseInt(drinkForm.customQuantity, 10);

      if (isNaN(alcoholPercent) || alcoholPercent <= 0 || alcoholPercent > 100) {
        showAlert('Feil', 'Alkoholprosent må være mellom 0 og 100');
        return;
      }
      if (isNaN(sizeDl) || sizeDl <= 0) {
        showAlert('Feil', 'Størrelse må være større enn 0');
        return;
      }
      if (isNaN(quantity) || quantity <= 0) {
        showAlert('Feil', 'Antall må være et heltall større enn 0');
        return;
      }

      const trimmedName = drinkForm.customDrinkName.trim();
      drink = {
        name: trimmedName || undefined,
        category: inferCategoryFromAlcoholPercent(alcoholPercent),
        sizeDl,
        alcoholPercent,
        quantity,
        timestamp: Date.now(),
      };
    }

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
    setDrinkForm(INITIAL_DRINK_FORM);
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
      
      await AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(groupWithImage));
      setCreateGroupName('');
      setCreateGroupModalVisible(false);
      
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
    <View style={[globalStyles.listItemRow, { paddingVertical: 10 }]}>
      <View style={{ flex: 1, paddingBottom: 0 }}>
        <Text style={globalStyles.modalText}>{item.groupName}</Text>
        <Text style={globalStyles.secondaryText}>Fra: {userNames[item.fromUserId] || item.fromUserId}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          style={[globalStyles.selectionButton, { marginRight: theme.spacing.sm }]}
          onPress={() => handleAcceptInvitation(item)}
          disabled={handlingInvitation}
        >
          <Text style={globalStyles.outlineButtonGoldText}>Godta</Text>
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
            <TouchableOpacity style={profileStyles.headerButton} onPress={navigateToSettings}>
              <Image source={SettingsIcon} style={globalStyles.primaryIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile content */}
        <View style={globalStyles.centeredSection}>
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
              style={[globalStyles.circularImage, { width: 120, height: 120 }]}
            />
            <TouchableOpacity
              style={profileStyles.editProfileImageButton}
              onPress={() => setProfileImageModalVisible(true)}
            >
              <Image source={PencilIcon} style={globalStyles.primaryIcon} />
            </TouchableOpacity>
          </View>
        {/* Modal to change profilepicture */}
        <Modal
          visible={profileImageModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setProfileImageModalVisible(false)}
        >
          <View style={globalStyles.modalContainer}> 
            <View style={[globalStyles.modalContent, { padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, maxHeight: 500 }]}> 
              <Text style={globalStyles.modalTitle}>Velg profilbilde</Text>
              <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                {defaultProfileImages.map((img) => (
                  <TouchableOpacity
                    key={img}
                    style={{ margin: 8, borderWidth: selectedProfileImage === img ? 3 : 0, borderColor: theme.colors.primary, borderRadius: 60 }}
                    onPress={() => setSelectedProfileImage(img)}
                  >
                    <Image
                      source={defaultProfileImageMap[img]}
                      style={{ width: 60, height: 60, borderRadius: 30 }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={[globalStyles.inputGroup, { marginTop: theme.spacing.md, marginBottom: theme.spacing.md }]}> 
                <Text style={globalStyles.label}>Name</Text>
                <TextInput
                  style={globalStyles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={theme.colors.textMuted}
                  maxLength={40}
                  autoCapitalize="words"
                />
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

          {/* Name and username */}
          <Text style={globalStyles.largeBoldText}>{userInfo.name || user?.name || 'Navn'}</Text>
          <Text style={globalStyles.secondaryText}>{userInfo.username || user?.username || 'Brukernavn'}</Text>
        </View>

        { /* Blood Alcohol Level */ }
        <View style={globalStyles.section}>
          <View style={globalStyles.inputGroup}>
            <Text style={globalStyles.sectionTitle}>Promillekalkulator</Text>
            <TouchableOpacity
              style={[globalStyles.primaryButtonShadow, (!userInfo.weight || !userInfo.gender) && globalStyles.disabledButton]}
              onPress={() => setDrinkModalVisible(true)}
              disabled={!userInfo.weight || !userInfo.gender}
            >
              <Text style={globalStyles.primaryButtonText}>Legg til drikke</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[globalStyles.dangerButton, (!userInfo.weight || !userInfo.gender) && globalStyles.disabledButton]}
              onPress={handleResetDrinks}
              disabled={!userInfo.weight || !userInfo.gender}
            >
              <Text style={globalStyles.dangerButtonText}>Nullstill drikker</Text>
            </TouchableOpacity>
          </View>
          {userInfo.weight && userInfo.gender && userInfo.drinks && userInfo.drinks.length > 0 && (() => {
            return (
            <View style={[globalStyles.inputGroup, {marginBottom: theme.spacing.sm, marginTop: theme.spacing.xl}]}>
              <Text style={globalStyles.sectionTitle}>Anslått promille de neste 3 timene</Text>
              <LineChart
                data={{
                  labels: Array.from({ length: 7 }, (_, i) => {
                    const time = Math.max(...userInfo.drinks!.map(d => d.timestamp)) + i * 0.5 * 60 * 60 * 1000;
                    return new Date(time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
                  }), // 0 to 3h, every 30min
                  datasets: [
                    {
                      data: Array.from({ length: 7 }, (_, i) => {
                        const time = Math.max(...userInfo.drinks!.map(d => d.timestamp)) + i * 0.5 * 60 * 60 * 1000;
                        return profileService.calculateBAC(userInfo.drinks!, userInfo.weight!, userInfo.gender!, time);
                      }),
                      color: () => theme.colors.primary,
                      strokeWidth: 3,
                    },
                  ],
                }}
                width={Math.min(Dimensions.get('window').width - theme.spacing.md * 2, 420)} // Adjust for padding
                height={240}
                yAxisLabel=""
                yAxisSuffix="‰"
                chartConfig={{
                  backgroundColor: theme.colors.background ?? '#000000',
                  backgroundGradientFrom: theme.colors.background ?? '#000000',
                  backgroundGradientTo: theme.colors.background ?? '#000000',
                  decimalPlaces: 3,
                  color: () => theme.colors.text ?? '#FFFFFF',
                  labelColor: () => theme.colors.text ?? '#FFFFFF',
                  style: { borderRadius: theme.borderRadius.md },
                  propsForDots: { r: '6', strokeWidth: '2', stroke: theme.colors.primary },
                  propsForLabels: { fontSize: 12 }
                }}
                bezier
                style={{padding: theme.spacing.sm, marginTop: theme.spacing.sm }}
              />
              <Animated.Text
                style={[
                  globalStyles.label,
                  {
                    color,
                    marginTop: theme.spacing.sm,
                    fontWeight: isHighBAC ? 'bold' : 'normal',
                    textAlign: 'center',
                    flexWrap: 'wrap',
                  },
                  animatedStyle,
                ]}
              >        
              Nåværende promille: {currentBAC}‰{exclamationMarks} {emoji}
              </Animated.Text>
            </View>
          );
        })()}
        </View>

        {/* Group Invitations Section */}
        <View style={globalStyles.section}>
          <View style={profileStyles.groupsHeader}>
            <Text style={globalStyles.sectionTitleLeft}>Gruppeinvitasjoner</Text>
            {groupInvitations.length > 0 && (
              <View style={profileStyles.invitationBadge}>
                <Text style={profileStyles.invitationBadgeText}>{groupInvitations.length}</Text>
              </View>
            )}
          </View>
          {groupInvitations.length > 0 ? (
            <View style={globalStyles.listContainer}>
              {groupInvitations.map((item) => (
                <View key={`${item.id}_${item.groupId}`} style={{ marginBottom: theme.spacing.sm }}>
                  {renderInvitationItem(item)}
                </View>
              ))}
            </View>
          ) : (
            <Text style={globalStyles.emptyStateText}>Ingen invitasjoner</Text>
          )}
        </View>

        {/* Groups section */}
        <View style={profileStyles.groupsSection}>
          <View style={profileStyles.groupsHeader}>
            <Text style={globalStyles.sectionTitleLeft}>Mine grupper</Text>
            <TouchableOpacity
              style={globalStyles.outlineButton}
              onPress={() => {
                setCreateGroupName('');
                setCreateGroupModalVisible(true);
              }}
              disabled={creatingGroup}
            >
              <Text style={globalStyles.outlineButtonGoldText}>
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
                  {rowItems.length === 1 && <View style={{ width: '48%' }} />}
                </View>
              );
            })}
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
              <View style={globalStyles.modalContent}>
                <Text style={globalStyles.modalTitle}>Opprett gruppe</Text>
                <View style={globalStyles.inputGroup}>
                  <Text style={globalStyles.label}>Gruppenavn</Text>
                  <TextInput
                    placeholder="Skriv gruppenavn"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={createGroupName}
                    onChangeText={setCreateGroupName}
                    style={globalStyles.input}
                    maxLength={40}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    globalStyles.selectionButton,
                    { marginBottom: theme.spacing.sm },
                    (!createGroupName.trim() || creatingGroup) && globalStyles.disabledButton,
                  ]}
                  onPress={handleCreateGroup}
                  disabled={creatingGroup || !createGroupName.trim()}
                >
                  <Text style={globalStyles.selectionButtonText}>
                    {creatingGroup ? 'Oppretter...' : 'Opprett gruppe'}
                  </Text>
                </TouchableOpacity>
                <View style={globalStyles.editButtonsContainer}>
                  <TouchableOpacity onPress={() => {
                    setCreateGroupName('');
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
              <View style={[globalStyles.modalContent, { padding: theme.spacing.md, borderRadius: theme.borderRadius.lg }]}>
                <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.md }} showsVerticalScrollIndicator={false}>
                  <Text style={[globalStyles.modalTitle, { marginBottom: theme.spacing.md }]}>
                    Legg til drikke
                  </Text>

                  <View style={[globalStyles.inputGroup, { marginBottom: theme.spacing.sm }]}> 
                    <Text style={globalStyles.label}>Kategori</Text>
                    <View style={globalStyles.pickerInput}>
                      <Picker
                        style={globalStyles.picker}
                        itemStyle={{ color: theme.colors.text }}
                        selectedValue={drinkForm.category}
                        onValueChange={(value: DrinkCategory | 'custom' | '') =>
                          setDrinkForm({ ...INITIAL_DRINK_FORM, category: value })
                        }
                      >
                        <Picker.Item label="Velg kategori" value="" />
                        <Picker.Item label="Øl" value="øl" />
                        <Picker.Item label="Vin" value="vin" />
                        <Picker.Item label="Sprit" value="sprit" />
                        <Picker.Item label="Egendefinert" value="custom" />
                      </Picker>
                    </View>
                  </View>

                  {drinkForm.category && (
                    <>
                      {drinkForm.category !== 'custom' && (
                        <>
                          <View style={[globalStyles.inputGroup, { marginBottom: theme.spacing.sm }]}> 
                            <Text style={globalStyles.label}>Størrelse (dl)</Text>
                            <View style={globalStyles.pickerInput}>
                              <Picker
                                style={globalStyles.picker}
                                itemStyle={{ color: theme.colors.text }}
                                selectedValue={drinkForm.sizeDl}
                                onValueChange={(value: number | '') => setDrinkForm({ ...drinkForm, sizeDl: value })}
                              >
                                <Picker.Item label="Velg størrelse" value="" />
                                {getSizeOptions(drinkForm.category).map(size => (
                                  <Picker.Item
                                    key={size}
                                    label={getSizeOptionLabel(drinkForm.category, size)}
                                    value={size}
                                  />
                                ))}
                              </Picker>
                            </View>
                          </View>

                          <View style={[globalStyles.inputGroup, { marginBottom: theme.spacing.sm }]}> 
                            <Text style={globalStyles.label}>Alkoholprosent</Text>
                            <View style={globalStyles.pickerInput}>
                              <Picker
                                style={globalStyles.picker}
                                itemStyle={{ color: theme.colors.text }}
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
                            <View style={[globalStyles.inputGroup, { marginBottom: theme.spacing.sm }]}> 
                              <Text style={globalStyles.label}>Egendefinert alkoholprosent</Text>
                              <TextInput
                                style={[globalStyles.input, { height: 40 }]}
                                value={drinkForm.customAlcoholPercent}
                                onChangeText={(text) => setDrinkForm({ ...drinkForm, customAlcoholPercent: text })}
                                placeholder={
                                  drinkForm.category === 'vin' ? '10-20%' : '22-70%'
                                }
                                placeholderTextColor={theme.colors.textMuted}
                                keyboardType="numeric"
                              />
                            </View>
                          )}

                          <View style={[globalStyles.inputGroup, { marginBottom: theme.spacing.sm }]}> 
                            <Text style={globalStyles.label}>Antall</Text>
                            <View style={globalStyles.pickerInput}>
                              <Picker
                                style={globalStyles.picker}
                                itemStyle={{ color: theme.colors.text }}
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

                      {drinkForm.category === 'custom' && (
                        <>
                      <View style={[globalStyles.inputGroup, { marginBottom: theme.spacing.sm }]}> 
                        <Text style={globalStyles.label}>Navn (valgfritt)</Text>
                        <TextInput
                          style={globalStyles.input}
                          value={drinkForm.customDrinkName}
                          onChangeText={(text) => setDrinkForm({ ...drinkForm, customDrinkName: text })}
                          placeholder="F.eks. Hjemmelaget vodka redubull"
                          placeholderTextColor={theme.colors.textMuted}
                          maxLength={40}
                        />
                      </View>

                      <View style={[globalStyles.inputGroup, { marginBottom: theme.spacing.sm }]}> 
                        <Text style={globalStyles.label}>Alkoholprosent</Text>
                        <TextInput
                          style={[globalStyles.input, { height: 40 }]}
                          value={drinkForm.customAlcoholPercentManual}
                          onChangeText={(text) => setDrinkForm({ ...drinkForm, customAlcoholPercentManual: text })}
                          placeholder="F.eks. 6.5"
                          placeholderTextColor={theme.colors.textMuted}
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={[globalStyles.inputGroup, { marginBottom: theme.spacing.sm }]}> 
                        <Text style={globalStyles.label}>Størrelse (dl)</Text>
                        <TextInput
                          style={[globalStyles.input, { height: 40 }]}
                          value={drinkForm.customSizeDl}
                          onChangeText={(text) => setDrinkForm({ ...drinkForm, customSizeDl: text })}
                          placeholder="F.eks. 4.5"
                          placeholderTextColor={theme.colors.textMuted}
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={[globalStyles.inputGroup, { marginBottom: theme.spacing.sm }]}> 
                        <Text style={globalStyles.label}>Antall</Text>
                        <TextInput
                          style={[globalStyles.input, { height: 40 }]}
                          value={drinkForm.customQuantity}
                          onChangeText={(text) => setDrinkForm({ ...drinkForm, customQuantity: text })}
                          placeholder="F.eks. 2"
                          placeholderTextColor={theme.colors.textMuted}
                          keyboardType="number-pad"
                        />
                      </View>
                        </>
                      )}
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