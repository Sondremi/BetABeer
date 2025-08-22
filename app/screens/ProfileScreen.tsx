import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/firebase/authService';
import { firestore } from '../services/firebase/FirebaseConfig';
import { acceptGroupInvitation, createGroup, declineGroupInvitation, getGroupInvitation, profileService } from '../services/profileService';
import { profileStyles } from '../styles/components/profileStyles';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { DrinkCategory, DrinkEntry, Group, GroupInvitation } from '../types/drinkTypes';
import { defaultProfileImageMap, defaultProfileImages } from '../utils/defaultProfileImages';
import { showAlert } from '../utils/platformAlert';

const DefaultProfilePicture = require('../../assets/images/default/default_profilepicture.png');
const ImageMissing = require('../../assets/images/image_missing.png');
const SettingsIcon = require('../../assets/icons/noun-settings-2650525.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');

const ProfileScreen: React.FC = () => {
  const { user, loading } = useAuth();
  const [profileImageModalVisible, setProfileImageModalVisible] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (user && (user as any).profileImage) {
      setSelectedProfileImage((user as any).profileImage);
    }
  }, [user]);

  const handleProfileImageSave = async () => {
    if (!user || !selectedProfileImage) return;
    try {
      await updateDoc(doc(firestore, 'users', user.id), { profileImage: selectedProfileImage });
      setProfileImageModalVisible(false);
    } catch (error) {
      showAlert('Feil', 'Kunne ikke oppdatere profilbilde');
    }
  };
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([]);
  const [handlingInvitation, setHandlingInvitation] = useState(false);
  const [userNames, setUserNames] = useState<{ [id: string]: string }>({});
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

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchGroupsAndInvitations = async () => {
      const groupQuery = query(collection(firestore, 'groups'), where('members', 'array-contains', user.id));
      const groupSnapshot = await getDocs(groupQuery);
      if (!isMounted) return;
      const groupList: Group[] = groupSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        name: docSnap.data().name,
        memberCount: docSnap.data().members.length,
        image: ImageMissing,
        createdBy: docSnap.data().createdBy,
        members: docSnap.data().members,
      }));
      setGroups(groupList);

      const invitationList = await getGroupInvitation(user.id);
      if (!isMounted) return;
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

  const navigateToGroup = (group: Group) => {
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
        setUserInfo(prev => ({ ...prev, drinks: [...(prev.drinks || []), drink] }));
        showAlert('Suksess', 'Drikke lagt til');
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
                showAlert('Suksess', 'Drikker nullstilt');
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
    setCreatingGroup(true);
    try {
      const newGroup = await createGroup(user.id);
      const groupWithImage: Group = { ...newGroup, image: ImageMissing };
      setGroups(prev => [...prev, groupWithImage]);
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
      const groupRef = doc(firestore, 'groups', invitation.groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        const newGroup: Group = {
          id: invitation.groupId,
          name: groupData.name,
          memberCount: groupData.members.length,
          image: ImageMissing,
          createdBy: groupData.createdBy,
          members: [...groupData.members, user.id],
        };
        setGroups(prev => [...prev, newGroup]);
      }
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
              <Image source={SettingsIcon} style={globalStyles.settingsIcon} />
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
              <Image source={PencilIcon} style={globalStyles.pencilIcon} />
            </TouchableOpacity>
          </View>
        {/* Modal for å velge profilbilde */}
        <Modal
          visible={profileImageModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setProfileImageModalVisible(false)}
        >
          <View style={[globalStyles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}> 
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
              <View style={globalStyles.buttonRow}>
                <TouchableOpacity style={globalStyles.cancelButton} onPress={() => setProfileImageModalVisible(false)}>
                  <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={globalStyles.saveButton} onPress={handleProfileImageSave}>
                  <Text style={globalStyles.saveButtonTextAlt}>Lagre</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

          {/* Name and username */}
          <Text style={globalStyles.largeBoldText}>{user?.name || 'Navn'}</Text>
          <Text style={globalStyles.secondaryText}>{user?.username || 'Brukernavn'}</Text>
        </View>

        { /* Promillegreier */ }
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
          {userInfo.weight && userInfo.gender && userInfo.drinks && userInfo.drinks.length > 0 && (
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.sectionTitle}>Promille over tid</Text>
              <LineChart
                data={{
                  labels: Array.from({ length: 7 }, (_, i) => `${i * 0.5}h`), // 0 to 3h, every 30min
                  datasets: [
                    {
                      data: Array.from({ length: 7 }, (_, i) => {
                        const time = Math.min(...userInfo.drinks!.map(d => d.timestamp)) + i * 0.5 * 60 * 60 * 1000;
                        return profileService.calculateBAC(userInfo.drinks!, userInfo.weight!, userInfo.gender!, time);
                      }),
                      color: () => theme.colors.primary ?? '#FFD700', // Gold line
                    },
                  ],
                }}
                width={Dimensions.get('window').width - theme.spacing.md * 2} // Adjust for padding
                height={220}
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
                }}
                bezier
                style={{ marginVertical: theme.spacing.md }}
              />
              <Text style={[globalStyles.label, { color: theme.colors.primary ?? '#FFD700' }]}>
                Maks promille neste 30 min: {
                  Math.max(
                    ...Array.from({ length: 2 }, (_, i) => {
                      const time = Date.now() + i * 15 * 60 * 1000; // Next 0 and 15min
                      return profileService.calculateBAC(userInfo.drinks!, userInfo.weight!, userInfo.gender!, time);
                    })
                  ).toFixed(3)
                }‰
              </Text>
            </View>
          )}
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
            <FlatList
              data={groupInvitations}
              renderItem={renderInvitationItem}
              keyExtractor={(item) => `${item.groupId}_${item.groupName}`}
              contentContainerStyle={globalStyles.listContainer}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
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
          <Modal
            visible={drinkModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setDrinkModalVisible(false)}
          >
            <View style={[globalStyles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
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
                              <Picker.Item key={size} label={`${size} dl`} value={size} />
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
                              drinkForm.category === 'vin' ? '10–20%' : '22–70%'
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