import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
};

const PencilIcon = require('../../assets/icons/noun-pencil-969012.png')
const DeleteIcon = require('../../assets/icons/noun-delete-7938028.png')
const LogoutIcon = require('../../assets/icons/noun-login-7932862.png') // Reusing login icon for logout

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Dummy data - will be replaced with database data later
  const [userInfo, setUserInfo] = useState({
    username: 'sondremi', // This should not be editable
    name: 'Sondre',
    phone: '+47 123 45 678',
    email: 'sondre@example.com'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(userInfo);

  const handleSave = () => {
    // Here you would save to database
    setUserInfo(editedInfo);
    setIsEditing(false);
    Alert.alert('Lagret', 'Brukerinformasjon er oppdatert');
  };

  const handleCancel = () => {
    setEditedInfo(userInfo);
    setIsEditing(false);
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
          onPress: () => {
            // Here you would clear any stored user data/tokens
            // For now, just navigate back to login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleDeleteUser = () => {
    Alert.alert(
      'Slett bruker',
      'Er du sikker på at du vil slette brukeren din? Dette kan ikke angres.',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: () => {
            // Here you would delete from database
            Alert.alert('Bruker slettet', 'Brukeren din er slettet');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
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
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Lagre</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Image source={PencilIcon} style={{ width: 20, height: 20, tintColor: '#007AFF' }} />
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
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteUser}>
            <Image source={DeleteIcon} style={{ width: 20, height: 20, tintColor: '#FF3B30' }} />
            <Text style={styles.deleteButtonText}>Slett bruker</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    fontSize: 16,
    color: '#007AFF',
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
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6c757d',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#FF9500',
    fontWeight: '600',
    marginLeft: 8,
  },
  dangerSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SettingsScreen;