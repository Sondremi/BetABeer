import { useRouter } from 'expo-router';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authService } from '../services/firebase/authService';

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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Laster...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header med tilbakeknapp */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Innstillinger</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        {/* User Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brukerinformasjon</Text>
          
          {/* Username - not editable */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brukernavn</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{userInfo.username}</Text>
            </View>
            <Text style={styles.helpText}>Brukernavn kan ikke endres</Text>
          </View>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Navn</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedInfo.name}
                onChangeText={(text) => setEditedInfo({ ...editedInfo, name: text })}
                placeholder="Skriv inn navn"
                placeholderTextColor="#888"
              />
            ) : (
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{userInfo.name}</Text>
              </View>
            )}
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefonnummer</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedInfo.phone}
                onChangeText={(text) => setEditedInfo({ ...editedInfo, phone: text })}
                placeholder="Skriv inn telefonnummer"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
              />
            ) : (
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{userInfo.phone}</Text>
              </View>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-postadresse</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedInfo.email}
                onChangeText={(text) => setEditedInfo({ ...editedInfo, email: text })}
                placeholder="Skriv inn e-postadresse"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{userInfo.email}</Text>
              </View>
            )}
          </View>

          {/* Edit/Save/Cancel buttons */}
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <View style={styles.editButtonsContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Avbryt</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, isLoading && styles.disabledButton]} 
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {isLoading ? 'Lagrer...' : 'Lagre'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Text style={styles.editButtonText}>Rediger informasjon</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Account Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konto</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Image source={LogoutIcon} style={{ width: 20, height: 20, tintColor: '#FF9500' }} />
            <Text style={styles.logoutButtonText}>Logg ut</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerSectionTitle}>Farlig sone</Text>
          <Text style={styles.dangerWarning}>
            Sletting av bruker vil permanent fjerne all data knyttet til brukeren din. Dette kan ikke angres.
          </Text>
          <TouchableOpacity 
            style={[styles.deleteButton, isLoading && styles.disabledButton]} 
            onPress={handleDeleteUser}
            disabled={isLoading}
          >
            <Image source={DeleteIcon} style={{ width: 20, height: 20, tintColor: '#FF3B30' }} />
            <Text style={styles.deleteButtonText}>Slett bruker permanent</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    minWidth: 40,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#181A20',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  headerPlaceholder: {
    width: 40, // For å balansere header layout
  },
  content: {
    padding: 20,
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 16,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#23242A',
    color: '#fff',
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: '#23242A',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#23242A',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#fff',
  },
  helpText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#23242A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  editButtonText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 8,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#181A20',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#23242A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 8,
  },
  dangerSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#23242A',
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF2222',
    marginBottom: 15,
  },
  dangerWarning: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 15,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#23242A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF2222',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FF2222',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SettingsScreen;