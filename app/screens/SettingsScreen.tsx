import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authService } from '../services/firebase/authService';
import { firestore } from '../services/firebase/FirebaseConfig';
import { settingsScreenTokens, settingsStyles } from '../styles/components/settingsStyles';
import { globalStyles } from '../styles/globalStyles';
import { Gender } from '../types/userTypes';
import { showAlert } from '../utils/platformAlert';

const SettingsScreen = () => {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState({
    id: '',
    username: '',
    name: '',
    email: '',
    weight: undefined as number | undefined,
    gender: undefined as Gender | undefined,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(userInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedField, setFocusedField] = useState<'' | 'name' | 'email' | 'weight'>('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData) {
            const userInfoData = {
              id: currentUser.uid,
              username: userData.username || '',
              name: userData.name || '',
              email: userData.email || '',
              weight: typeof userData.weight === 'number' ? userData.weight : undefined,
              gender: userData.gender === 'male' || userData.gender === 'female' ? userData.gender : undefined,
            };
            setUserInfo(userInfoData);
            setEditedInfo(userInfoData);
          }
        }
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke laste brukerdata');
    } finally {
      setIsLoading(false);
    }
  };

  const validateEditedData = () => {
    if (!editedInfo.name.trim()) {
      showAlert('Feil', 'Navn er påkrevd');
      return false;
    }

    if (!editedInfo.email.trim()) {
      showAlert('Feil', 'E-postadresse er påkrevd');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedInfo.email)) {
      showAlert('Feil', 'Ugyldig e-postadresse');
      return false;
    }

    if (editedInfo.weight != null && (isNaN(editedInfo.weight) || editedInfo.weight <= 0)) {
      showAlert('Feil', 'Vekt må være et positivt tall');
      return false;
    }

    return true;
  };

  const canSaveEditedData = useMemo(() => {
    if (!editedInfo.name.trim()) return false;
    if (!editedInfo.email.trim()) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedInfo.email)) return false;

    if (editedInfo.weight != null && (isNaN(editedInfo.weight) || editedInfo.weight <= 0)) {
      return false;
    }

    return true;
  }, [editedInfo]);

  const handleSave = async () => {
    if (!validateEditedData()) return;

    try {
      setIsLoading(true);

      const updateData = {
        name: editedInfo.name,
        email: editedInfo.email,
        weight: editedInfo.weight ?? null,
        gender: editedInfo.gender ?? null,
      };

      await authService.updateUser(userInfo.id, updateData);

      setUserInfo(editedInfo);
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kunne ikke lagre endringene';
      showAlert('Feil', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedInfo(userInfo);
    setIsEditing(false);
  };

  const handleBack = () => {
    router.replace('/profile');
  };

  const handleLogout = () => {
    showAlert(
      'Logg ut',
      'Er du sikker på at du vil logge ut?',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Logg ut',
          style: 'default',
          onPress: async () => {
            try {
              await authService.logoutUser();
              router.replace('/login');
            } catch (error) {
              console.error(error);
              showAlert('Feil', 'Kunne ikke logge ut');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = () => {
    showAlert(
      'Slett bruker',
      'Er du sikker på at du vil slette brukeren din? Dette kan ikke angres og vil slette all data knyttet til brukeren.',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: () => {
            showAlert(
              'Bekreft sletting',
              'Dette vil permanent slette brukeren din. Er du helt sikker?',
              [
                {
                  text: 'Avbryt',
                  style: 'cancel',
                },
                {
                  text: 'Slett permanent',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setIsLoading(true);
                      await authService.deleteUser(userInfo.id);
                      showAlert(
                        'Bruker slettet',
                        'Brukeren din er permanent slettet',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              router.replace('/login');
                            }
                          }
                        ]
                      );
                    } catch (error) {
                      setIsLoading(false);
                      let errorMessage = 'Kunne ikke slette brukeren';

                      if (error instanceof Error) {
                        if (error.message.includes('requires-recent-login')) {
                          errorMessage = 'Du må logge inn på nytt før du kan slette brukeren din';
                        } else {
                          errorMessage = error.message;
                        }
                      }

                      showAlert('Feil', errorMessage);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContent]}>
        <Text style={settingsStyles.loadingText}>Laster...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container,
        settingsStyles.pageContainer,
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={globalStyles.fullWidthScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[globalStyles.header, globalStyles.rowCenter]}>
          <TouchableOpacity style={settingsStyles.backButton} onPress={handleBack}>
            <Text style={settingsStyles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={globalStyles.headerTitle}>Innstillinger</Text>
        </View>

        <View style={[globalStyles.section, settingsStyles.screenSection]}>
          {/* User Information Section */}
          <View style={[globalStyles.premiumCard, settingsStyles.sectionCard]}>
            <Text style={globalStyles.sectionTitle}>Brukerinformasjon</Text>

            {/* Username - not editable */}
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Brukernavn</Text>
              <View style={globalStyles.readOnlyInput}>
                <Text style={settingsStyles.readOnlyText}>{userInfo.username}</Text>
              </View>
              <Text style={globalStyles.mutedText}>Brukernavn kan ikke endres</Text>
            </View>

            {/* Name */}
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Navn</Text>
              {isEditing ? (
                <View style={[globalStyles.inputShellDark, focusedField === 'name' && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    style={[globalStyles.input, settingsStyles.compactInput]}
                    value={editedInfo.name}
                    onChangeText={(text) => setEditedInfo({ ...editedInfo, name: text })}
                    placeholder="Skriv inn navn"
                    placeholderTextColor={settingsScreenTokens.inputPlaceholderTextColor}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField('')}
                  />
                </View>
              ) : (
                <View style={globalStyles.readOnlyInput}>
                  <Text style={settingsStyles.readOnlyText}>{userInfo.name}</Text>
                </View>
              )}
            </View>

            {/* Email */}
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>E-postadresse</Text>
              {isEditing ? (
                <View style={[globalStyles.inputShellDark, focusedField === 'email' && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    style={[globalStyles.input, settingsStyles.compactInput]}
                    value={editedInfo.email}
                    onChangeText={(text) => setEditedInfo({ ...editedInfo, email: text })}
                    placeholder="Skriv inn e-postadresse"
                    placeholderTextColor={settingsScreenTokens.inputPlaceholderTextColor}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                  />
                </View>
              ) : (
                <View style={globalStyles.readOnlyInput}>
                  <Text style={settingsStyles.readOnlyText}>{userInfo.email}</Text>
                </View>
              )}
            </View>

            {/* Weight */}
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Vekt</Text>
              {isEditing ? (
                <View style={[globalStyles.inputShellDark, focusedField === 'weight' && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    style={[globalStyles.input, settingsStyles.compactInput]}
                    value={editedInfo.weight ? editedInfo.weight.toString() : ''}
                    onChangeText={(text) => {
                      const value = text ? parseInt(text) : undefined;
                      if (value === undefined || !isNaN(value)) {
                        setEditedInfo({ ...editedInfo, weight: value });
                      }
                    }}
                    placeholder="Skriv inn vekt (kg)"
                    placeholderTextColor={settingsScreenTokens.inputPlaceholderTextColor}
                    keyboardType="numeric"
                    onFocus={() => setFocusedField('weight')}
                    onBlur={() => setFocusedField('')}
                  />
                </View>
              ) : (
                <View style={globalStyles.readOnlyInput}>
                  <Text style={settingsStyles.readOnlyText}>{userInfo.weight != null ? `${userInfo.weight} kg` : 'Ikke satt'}</Text>
                </View>
              )}
            </View>

            {/* Gender */}
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Kjønn</Text>
              {isEditing ? (
                <View style={globalStyles.pickerInput}>
                  <Picker
                    style={globalStyles.picker}
                    itemStyle={settingsStyles.pickerItem}
                    selectedValue={editedInfo.gender || ''}
                    onValueChange={(value: Gender | '') => setEditedInfo({ ...editedInfo, gender: value || undefined })}
                  >
                    <Picker.Item label="Velg kjønn" value="" />
                    <Picker.Item label="Mann" value="male" />
                    <Picker.Item label="Dame" value="female" />
                  </Picker>
                </View>
              ) : (
                <View style={globalStyles.readOnlyInput}>
                  <Text style={settingsStyles.readOnlyText}>
                    {userInfo.gender === 'male' ? 'Mann' : userInfo.gender === 'female' ? 'Kvinne' : 'Ikke satt'}
                  </Text>
                </View>
              )}
            </View>

            {/* Edit/Save/Cancel buttons */}
            <View style={settingsStyles.buttonRowNoGap}>
              {isEditing ? (
                <>
                  <TouchableOpacity style={[settingsStyles.halfWidthCancelButton, isLoading && globalStyles.disabledButton]} onPress={handleCancel} disabled={isLoading}>
                    <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[settingsStyles.halfWidthSaveButton, (isLoading || !canSaveEditedData) && globalStyles.disabledButton]}
                    onPress={handleSave}
                    disabled={isLoading || !canSaveEditedData}
                  >
                    <Text style={globalStyles.saveButtonTextAlt}>
                      {isLoading ? 'Lagrer...' : 'Lagre'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={settingsStyles.fullWidthButton} onPress={() => setIsEditing(true)}>
                  <Text style={globalStyles.outlineButtonGoldText}>Rediger informasjon</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Log out Section */}
          <View style={[globalStyles.premiumCard, settingsStyles.sectionCard]}>
            <Text style={globalStyles.sectionTitle}>Logg ut</Text>
            <TouchableOpacity style={globalStyles.outlineButton} onPress={handleLogout}>
              <Text style={globalStyles.outlineButtonGoldText}>Logg ut</Text>
            </TouchableOpacity>
          </View>

          {/* Delete Account Section */}
          <View style={[globalStyles.premiumCard, settingsStyles.sectionCard, settingsStyles.deleteSectionCard]}>
            <Text style={globalStyles.dangerSectionTitle}>Slett bruker</Text>
            <Text style={[globalStyles.mutedText, settingsStyles.dangerHelperText]}> 
              Sletting av bruker vil permanent fjerne all data knyttet til brukeren din. Dette kan ikke angres.
            </Text>
            <TouchableOpacity
              style={[globalStyles.dangerButton, isLoading && globalStyles.disabledButton]}
              onPress={handleDeleteUser}
              disabled={isLoading}
            >
              <Text style={globalStyles.dangerButtonText}>Slett bruker permanent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SettingsScreen;