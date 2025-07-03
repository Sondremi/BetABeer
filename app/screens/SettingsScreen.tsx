import { useRouter } from 'expo-router';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authService } from '../services/firebase/authService';
import { theme } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { settingsStyles } from '../styles/components/settingsStyles';

const DeleteIcon = require('../../assets/icons/noun-delete-7938028.png');
const LogoutIcon = require('../../assets/icons/noun-login-7932862.png');

const SettingsScreen = () => {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState({
    id: '',
    username: '',
    name: '',
    phone: '',
    email: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(userInfo);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const firestore = getFirestore();
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData) {
            const userInfoData = {
              id: currentUser.uid,
              username: userData.username,
              name: userData.name,
              phone: userData.phone,
              email: userData.email,
            };
            setUserInfo(userInfoData);
            setEditedInfo(userInfoData);
          }
        }
      }
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke laste brukerdata');
    } finally {
      setIsLoading(false);
    }
  };

  const validateEditedData = () => {
    if (!editedInfo.name.trim()) {
      Alert.alert('Feil', 'Navn er påkrevd');
      return false;
    }

    if (!editedInfo.email.trim()) {
      Alert.alert('Feil', 'E-postadresse er påkrevd');
      return false;
    }

    if (!editedInfo.phone.trim()) {
      Alert.alert('Feil', 'Telefonnummer er påkrevd');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedInfo.email)) {
      Alert.alert('Feil', 'Ugyldig e-postadresse');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateEditedData()) return;

    try {
      setIsLoading(true);
      
      await authService.updateUser(userInfo.id, {
        name: editedInfo.name,
        phone: editedInfo.phone,
        email: editedInfo.email,
      });
      
      setUserInfo(editedInfo);
      setIsEditing(false);
      Alert.alert('Lagret', 'Brukerinformasjon er oppdatert');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kunne ikke lagre endringene';
      Alert.alert('Feil', errorMessage);
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
    Alert.alert(
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
              Alert.alert('Feil', 'Kunne ikke logge ut');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = () => {
    Alert.alert(
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
            Alert.alert(
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
                      Alert.alert(
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
                      
                      Alert.alert('Feil', errorMessage);
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
    <ScrollView style={globalStyles.container}>
      {/* Header */}
      <View style={[globalStyles.header, globalStyles.rowSpread]}>
        <TouchableOpacity style={settingsStyles.backButton} onPress={handleBack}>
          <Text style={settingsStyles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={globalStyles.headerTitleMedium}>Innstillinger</Text>
        <View style={settingsStyles.headerPlaceholder} />
      </View>

      <View style={globalStyles.section}>
        {/* User Information Section */}
        <View style={globalStyles.inputGroup}>
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
              <TextInput
                style={globalStyles.input}
                value={editedInfo.name}
                onChangeText={(text) => setEditedInfo({ ...editedInfo, name: text })}
                placeholder="Skriv inn navn"
                placeholderTextColor="#888"
              />
            ) : (
              <View style={globalStyles.readOnlyInput}>
                <Text style={settingsStyles.readOnlyText}>{userInfo.name}</Text>
              </View>
            )}
          </View>

          {/* Phone */}
          <View style={globalStyles.inputGroup}>
            <Text style={globalStyles.label}>Telefonnummer</Text>
            {isEditing ? (
              <TextInput
                style={globalStyles.input}
                value={editedInfo.phone}
                onChangeText={(text) => setEditedInfo({ ...editedInfo, phone: text })}
                placeholder="Skriv inn telefonnummer"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
              />
            ) : (
              <View style={globalStyles.readOnlyInput}>
                <Text style={settingsStyles.readOnlyText}>{userInfo.phone}</Text>
              </View>
            )}
          </View>

          {/* Email */}
          <View style={globalStyles.inputGroup}>
            <Text style={globalStyles.label}>E-postadresse</Text>
            {isEditing ? (
              <TextInput
                style={globalStyles.input}
                value={editedInfo.email}
                onChangeText={(text) => setEditedInfo({ ...editedInfo, email: text })}
                placeholder="Skriv inn e-postadresse"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <View style={globalStyles.readOnlyInput}>
                <Text style={settingsStyles.readOnlyText}>{userInfo.email}</Text>
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
                  style={[settingsStyles.halfWidthSaveButton, isLoading && globalStyles.disabledButton]} 
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Text style={globalStyles.saveButtonTextAlt}>
                    {isLoading ? 'Lagrer...' : 'Lagre'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={settingsStyles.fullWidthButton} onPress={() => setIsEditing(true)}>
                <Text style={globalStyles.outlineButtonText}>Rediger informasjon</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Account Actions Section */}
        <View style={globalStyles.inputGroup}>
          <Text style={globalStyles.sectionTitle}>Konto</Text>
          <TouchableOpacity style={globalStyles.outlineButton} onPress={handleLogout}>
            <Image source={LogoutIcon} style={{ width: 20, height: 20, tintColor: '#FFD700' }} />
            <Text style={globalStyles.outlineButtonText}>Logg ut</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={globalStyles.dangerSection}>
          <Text style={globalStyles.dangerSectionTitle}>Farlig sone</Text>
          <Text style={[globalStyles.mutedText, { color: theme.colors.dangerLight, lineHeight: 20 }]}>
            Sletting av bruker vil permanent fjerne all data knyttet til brukeren din. Dette kan ikke angres.
          </Text>
          <TouchableOpacity 
            style={[globalStyles.dangerButton, isLoading && globalStyles.disabledButton]} 
            onPress={handleDeleteUser}
            disabled={isLoading}
          >
            <Image source={DeleteIcon} style={globalStyles.deleteIcon} />
            <Text style={globalStyles.dangerButtonText}>Slett bruker permanent</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;