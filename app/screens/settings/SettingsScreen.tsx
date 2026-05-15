import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import BeerLoader from '../../components/BeerLoader';
import { GuestUpgradePrompt } from '../../components/GuestUpgradePrompt';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/firebase/authService';
import { settingsStyles } from '../../styles/components/settingsStyles';
import { globalStyles } from '../../styles/globalStyles';
import type { Gender } from '../../types/userTypes';
import { normalizeSingleLineText } from '../../utils/inputValidation';
import { showAlert } from '../../utils/platformAlert';
import DeleteAccountSection from './components/DeleteAccountSection';
import LogoutSection from './components/LogoutSection';
import PasswordResetSection from './components/PasswordResetSection';
import SettingsHeader from './components/SettingsHeader';
import UserInfoSection from './components/UserInfoSection';
import { useSettingsUserData } from './hooks/useSettingsUserData';
import { useSettingsValidation } from './hooks/useSettingsValidation';
import type { SettingsFocusedField } from './types';

const SettingsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [isSendingVerificationEmail, setIsSendingVerificationEmail] = useState(false);
  const [focusedField, setFocusedField] = useState<SettingsFocusedField>('');

  const {
    userInfo,
    setUserInfo,
    editedInfo,
    setEditedInfo,
    isLoading,
    setIsLoading,
    isEmailVerified,
    setIsEmailVerified,
    loadUserData,
  } = useSettingsUserData({ fallbackUser: user });

  const { validateEditedData, canSaveEditedData } = useSettingsValidation({ editedInfo });

  const handleSave = async () => {
    if (!validateEditedData()) return;
    if (!userInfo.id) {
      showAlert('Feil', 'Kunne ikke finne brukerdata');
      return;
    }

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
      setFocusedField('');

      if (hasEmailChanged) {
        showAlert(
          'Bekreft e-postendring',
          `Vi har sendt en bekreftelse til ${trimmedEditedEmail}. Når du bekrefter, blir e-postadressen oppdatert`
        );
      }
    } catch {
      showAlert('Feil', 'Kunne ikke lagre endringene');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedInfo(userInfo);
    setIsEditing(false);
    setFocusedField('');
  };

  const handleBack = () => {
    router.replace('/profile');
  };

  const handleLogout = () => {
    showAlert(
      'Logg ut',
      'Er du sikker på at du vil logge ut?',
      [
        { text: 'Avbryt', style: 'cancel' },
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
      'Er du sikker på at du vil slette brukeren din? Dette kan ikke angres og vil slette all data knyttet til brukeren',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: () => {
            showAlert(
              'Bekreft sletting',
              'Dette vil permanent slette brukeren din. Er du helt sikker?',
              [
                { text: 'Avbryt', style: 'cancel' },
                {
                  text: 'Slett permanent',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      if (!userInfo.id) {
                        showAlert('Feil', 'Kunne ikke finne brukerdata');
                        return;
                      }

                      setIsLoading(true);
                      await authService.deleteUser(userInfo.id);
                      showAlert(
                        'Bruker slettet',
                        'Brukeren din er permanent slettet',
                        [{ text: 'OK', onPress: () => router.replace('/login') }]
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

    if (!targetEmail) return;

    try {
      setIsSendingPasswordReset(true);
      await authService.requestPasswordReset(targetEmail);
      showAlert('E-post sendt', `Vi har sendt en passord-reset lenke til ${targetEmail}.`);
    } catch {
      showAlert('Feil', 'Kunne ikke sende passord-reset e-post');
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
        showAlert('E-post verifisert', 'E-postadressen din er allerede verifisert');
        return;
      }

      showAlert('Verifiseringsmail sendt', `Vi har sendt en ny verifiseringsmail til ${result.email}. Den kan havne i spam`);
    } catch {
      showAlert('Feil', 'Kunne ikke sende verifiseringsmail');
    } finally {
      setIsSendingVerificationEmail(false);
      loadUserData();
    }
  };

  if (isLoading) {
    return <BeerLoader />;
  }

  if ((user as any)?.isGuest) {
    return (
      <GuestUpgradePrompt
        title="Innstillinger er låst for gjest"
        description="Opprett en bruker for å endre kontoinnstillinger, passord og sikkerhet."
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={globalStyles.fullWidthScrollContent} keyboardShouldPersistTaps="handled">
        <SettingsHeader onBack={handleBack} />

        <View style={[globalStyles.section, settingsStyles.screenSection]}>
          <UserInfoSection
            userInfo={userInfo}
            editedInfo={editedInfo}
            isEditing={isEditing}
            isLoading={isLoading}
            isEmailVerified={isEmailVerified}
            isSendingVerificationEmail={isSendingVerificationEmail}
            focusedField={focusedField}
            canSaveEditedData={canSaveEditedData}
            onStartEdit={() => setIsEditing(true)}
            onCancelEdit={handleCancel}
            onSave={() => void handleSave()}
            onResendVerificationEmail={() => void handleResendVerificationEmail()}
            setFocusedField={setFocusedField}
            setEditedInfo={setEditedInfo}
          />

          <PasswordResetSection
            isLoading={isLoading}
            isSendingPasswordReset={isSendingPasswordReset}
            onSendPasswordReset={() => void handleSendPasswordReset()}
          />

          <LogoutSection onLogout={handleLogout} />

          <DeleteAccountSection
            isLoading={isLoading}
            onDeleteAccount={handleDeleteUser}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SettingsScreen;
