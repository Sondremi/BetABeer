import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/firebase/authService';
import { firestore } from '../services/firebase/FirebaseConfig';
import { settingsScreenTokens, settingsStyles } from '../styles/components/settingsStyles';
import { globalStyles } from '../styles/globalStyles';
import { Gender } from '../types/userTypes';
import { INPUT_LIMITS, clampDigits, normalizeSingleLineText } from '../utils/inputValidation';
import { showAlert } from '../utils/platformAlert';

const SettingsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();

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
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [isSendingVerificationEmail, setIsSendingVerificationEmail] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [focusedField, setFocusedField] = useState<'' | 'name' | 'email' | 'weight'>('');

  const loadUserData = useCallback(async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData) {
            const userInfoData = {
              id: currentUser.uid,
              username: userData.username || user?.username || '',
              name: userData.name || user?.name || '',
              email: userData.email || currentUser.email || user?.email || '',
              weight: typeof userData.weight === 'number' ? userData.weight : undefined,
              gender: userData.gender === 'male' || userData.gender === 'female' ? userData.gender : undefined,
            };
            setUserInfo(userInfoData);
            setEditedInfo(userInfoData);
            setIsEmailVerified(Boolean(currentUser.emailVerified));
            return;
          }
        }

        const fallbackUserInfo = {
          id: currentUser.uid,
          username: user?.username || '',
          name: user?.name || '',
          email: currentUser.email || user?.email || '',
          weight: undefined as number | undefined,
          gender: undefined as Gender | undefined,
        };
        setUserInfo(fallbackUserInfo);
        setEditedInfo(fallbackUserInfo);
        setIsEmailVerified(Boolean(currentUser.emailVerified));
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke laste brukerdata');
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, user?.name, user?.username]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const validateEditedData = () => {
    const normalizedName = normalizeSingleLineText(editedInfo.name);
    const normalizedEmail = editedInfo.email.trim();

    if (!normalizedName) {
      showAlert('Feil', 'Navn er påkrevd');
      return false;
    }

    if (normalizedName.length > INPUT_LIMITS.profileNameMax) {
      showAlert('Feil', `Navn kan maks være ${INPUT_LIMITS.profileNameMax} tegn.`);
      return false;
    }

    if (!normalizedEmail) {
      showAlert('Feil', 'E-postadresse er påkrevd');
      return false;
    }

    if (normalizedEmail.length > INPUT_LIMITS.emailMax) {
      showAlert('Feil', `E-postadresse kan maks være ${INPUT_LIMITS.emailMax} tegn.`);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      showAlert('Feil', 'Ugyldig e-postadresse');
      return false;
    }

    if (editedInfo.weight != null && (isNaN(editedInfo.weight) || editedInfo.weight < INPUT_LIMITS.weightMinKg || editedInfo.weight > INPUT_LIMITS.weightMaxKg)) {
      showAlert('Feil', `Vekt må være mellom ${INPUT_LIMITS.weightMinKg} og ${INPUT_LIMITS.weightMaxKg} kg.`);
      return false;
    }

    return true;
  };

  const canSaveEditedData = useMemo(() => {
    const normalizedName = normalizeSingleLineText(editedInfo.name);
    const normalizedEmail = editedInfo.email.trim();

    if (!normalizedName) return false;
    if (normalizedName.length > INPUT_LIMITS.profileNameMax) return false;
    if (!normalizedEmail) return false;
    if (normalizedEmail.length > INPUT_LIMITS.emailMax) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) return false;

    if (editedInfo.weight != null && (isNaN(editedInfo.weight) || editedInfo.weight < INPUT_LIMITS.weightMinKg || editedInfo.weight > INPUT_LIMITS.weightMaxKg)) {
      return false;
    }

    return true;
  }, [editedInfo]);

  const handleSave = async () => {
    if (!validateEditedData()) return;

    try {
      setIsLoading(true);

      const normalizedCurrentEmail = userInfo.email.trim().toLowerCase();
      const normalizedEditedEmail = editedInfo.email.trim().toLowerCase();
      const trimmedEditedEmail = editedInfo.email.trim();
      const hasEmailChanged = normalizedEditedEmail !== normalizedCurrentEmail;

      if (hasEmailChanged) {
        await authService.requestEmailChange(trimmedEditedEmail);
      }

      const updateData: {
        name: string;
        weight: number | null;
        gender: Gender | null;
        email?: string;
      } = {
        name: normalizeSingleLineText(editedInfo.name),
        weight: editedInfo.weight ?? null,
        gender: editedInfo.gender ?? null,
      };

      if (!hasEmailChanged) {
        updateData.email = trimmedEditedEmail;
      }

      await authService.updateUser(userInfo.id, updateData);

      const nextUserInfo = {
        ...editedInfo,
        email: hasEmailChanged ? userInfo.email : editedInfo.email,
      };
      setUserInfo(nextUserInfo);
      setEditedInfo(nextUserInfo);
      setIsEditing(false);

      if (hasEmailChanged) {
        showAlert(
          'Bekreft e-postendring',
          `Vi har sendt en bekreftelse til ${trimmedEditedEmail}. Når du bekrefter, blir e-postadressen oppdatert.`
        );
      }
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

  const handleSendPasswordReset = async () => {
    const currentAuthUser = authService.getCurrentUser();
    const targetEmail = String(currentAuthUser?.email || userInfo.email || '').trim();

    if (!targetEmail) {
      showAlert('Feil', 'Fant ingen e-postadresse å sende reset-lenke til');
      return;
    }

    try {
      setIsSendingPasswordReset(true);
      await authService.requestPasswordReset(targetEmail);
      showAlert('E-post sendt', `Vi har sendt en passord-reset lenke til ${targetEmail}.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kunne ikke sende passord-reset e-post';
      showAlert('Feil', errorMessage);
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    try {
      setIsSendingVerificationEmail(true);
      const result = await authService.resendEmailVerification();

      if (result.status === 'already-verified') {
        setIsEmailVerified(true);
        showAlert('E-post verifisert', 'E-postadressen din er allerede verifisert.');
        return;
      }

      showAlert('Verifiseringsmail sendt', `Vi har sendt en ny verifiseringsmail til ${result.email}.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kunne ikke sende verifiseringsmail';
      showAlert('Feil', errorMessage);
    } finally {
      setIsSendingVerificationEmail(false);
      loadUserData();
    }
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
                    onChangeText={(text) => setEditedInfo({ ...editedInfo, name: text.slice(0, INPUT_LIMITS.profileNameMax) })}
                    placeholder="Skriv inn navn"
                    placeholderTextColor={settingsScreenTokens.inputPlaceholderTextColor}
                    maxLength={INPUT_LIMITS.profileNameMax}
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
                    onChangeText={(text) => setEditedInfo({ ...editedInfo, email: text.slice(0, INPUT_LIMITS.emailMax) })}
                    placeholder="Skriv inn e-postadresse"
                    placeholderTextColor={settingsScreenTokens.inputPlaceholderTextColor}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxLength={INPUT_LIMITS.emailMax}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                  />
                </View>
              ) : (
                <View style={globalStyles.readOnlyInput}>
                  <Text style={settingsStyles.readOnlyText}>{userInfo.email}</Text>
                </View>
              )}
              <Text
                style={[
                  globalStyles.mutedText,
                  settingsStyles.emailVerificationStatus,
                  isEmailVerified ? settingsStyles.emailVerifiedText : settingsStyles.emailNotVerifiedText,
                ]}
              >
                {isEmailVerified ? 'E-post er verifisert' : 'E-post er ikke verifisert'}
              </Text>
              {!isEmailVerified && !isEditing && (
                <TouchableOpacity
                  style={[globalStyles.outlineButtonGold, settingsStyles.emailVerificationButton, (isLoading || isSendingVerificationEmail) && globalStyles.disabledButton]}
                  onPress={handleResendVerificationEmail}
                  disabled={isLoading || isSendingVerificationEmail}
                >
                  <Text style={globalStyles.outlineButtonGoldText}>
                    {isSendingVerificationEmail ? 'Sender...' : 'Send verifiseringsmail på nytt'}
                  </Text>
                </TouchableOpacity>
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
                      const value = text ? parseInt(clampDigits(text, 3), 10) : undefined;
                      if (value === undefined || !isNaN(value)) {
                        setEditedInfo({ ...editedInfo, weight: value });
                      }
                    }}
                    placeholder="Skriv inn vekt (kg)"
                    placeholderTextColor={settingsScreenTokens.inputPlaceholderTextColor}
                    keyboardType="numeric"
                    maxLength={3}
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
                <View style={[globalStyles.pickerInput, globalStyles.inputShellFocusedGold]}>
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
            <View style={globalStyles.editButtonsContainer}>
              {isEditing ? (
                <>
                  <TouchableOpacity onPress={handleCancel} disabled={isLoading}>
                    <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isLoading || !canSaveEditedData}
                  >
                    <Text style={[globalStyles.saveButtonText, (!canSaveEditedData || isLoading) && settingsStyles.disabledActionText]}>
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

          {/* Password reset section */}
          <View style={[globalStyles.premiumCard, settingsStyles.sectionCard]}>
            <Text style={globalStyles.sectionTitle}>Passord</Text>
            <Text style={[globalStyles.mutedText, settingsStyles.dangerHelperText, settingsStyles.neutralHelperText]}> 
              Send e-post for å tilbakestille passordet ditt.
            </Text>
            <TouchableOpacity
              style={[globalStyles.outlineButton, (isLoading || isSendingPasswordReset) && globalStyles.disabledButton]}
              onPress={handleSendPasswordReset}
              disabled={isLoading || isSendingPasswordReset}
            >
              <Text style={globalStyles.outlineButtonGoldText}>
                {isSendingPasswordReset ? 'Sender...' : 'Tilbakestill passord'}
              </Text>
            </TouchableOpacity>
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