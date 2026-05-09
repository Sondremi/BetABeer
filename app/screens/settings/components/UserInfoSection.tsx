import React from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { settingsScreenTokens, settingsStyles } from '../../../styles/components/settingsStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { INPUT_LIMITS, clampDigits } from '../../../utils/inputValidation';
import type { SettingsFocusedField, SettingsUserInfo } from '../types';

type UserInfoSectionProps = {
  userInfo: SettingsUserInfo;
  editedInfo: SettingsUserInfo;
  isEditing: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  isSendingVerificationEmail: boolean;
  focusedField: SettingsFocusedField;
  canSaveEditedData: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onResendVerificationEmail: () => void;
  setFocusedField: (field: SettingsFocusedField) => void;
  setEditedInfo: React.Dispatch<React.SetStateAction<SettingsUserInfo>>;
};

const UserInfoSection = ({
  userInfo,
  editedInfo,
  isEditing,
  isLoading,
  isEmailVerified,
  isSendingVerificationEmail,
  focusedField,
  canSaveEditedData,
  onStartEdit,
  onCancelEdit,
  onSave,
  onResendVerificationEmail,
  setFocusedField,
  setEditedInfo,
}: UserInfoSectionProps) => {
  const PencilIcon = require('../../../../assets/icons/noun-pencil-969012.png');

  return (
    <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
      <View style={settingsStyles.userInfoHeaderRow}>
        <Text style={globalStyles.sectionTitleLeft}>Brukerinformasjon</Text>
        {!isEditing && (
          <TouchableOpacity
            style={globalStyles.iconBackButton}
            onPress={onStartEdit}
            accessibilityRole="button"
            accessibilityLabel="Rediger brukerinformasjon"
          >
            <Image source={PencilIcon} style={globalStyles.primaryIcon} />
          </TouchableOpacity>
        )}
      </View>

      <View style={globalStyles.inputGroup}>
        <Text style={globalStyles.label}>Brukernavn</Text>
        <View style={globalStyles.readOnlyInput}>
          <Text style={settingsStyles.readOnlyText}>{userInfo.username}</Text>
        </View>
        <Text style={globalStyles.mutedText}>Brukernavn kan ikke endres</Text>
      </View>

      <View style={globalStyles.inputGroup}>
        <Text style={globalStyles.label}>Navn</Text>
        {isEditing ? (
          <View style={[globalStyles.inputShellDark, focusedField === 'name' && globalStyles.inputShellFocusedGold]}>
            <TextInput
              style={[globalStyles.input, settingsStyles.compactInput]}
              value={editedInfo.name}
              onChangeText={(text) => setEditedInfo((prev) => ({ ...prev, name: text.slice(0, INPUT_LIMITS.profileNameMax) }))}
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

      <View style={globalStyles.inputGroup}>
        <Text style={globalStyles.label}>E-postadresse</Text>
        {isEditing ? (
          <View style={[globalStyles.inputShellDark, focusedField === 'email' && globalStyles.inputShellFocusedGold]}>
            <TextInput
              style={[globalStyles.input, settingsStyles.compactInput]}
              value={editedInfo.email}
              onChangeText={(text) => setEditedInfo((prev) => ({ ...prev, email: text.slice(0, INPUT_LIMITS.emailMax) }))}
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
            globalStyles.betSelectionHintText,
            isEmailVerified ? globalStyles.primaryColorText : settingsStyles.emailNotVerifiedText,
          ]}
        >
          {isEmailVerified ? 'E-post er verifisert' : 'E-post er ikke verifisert'}
        </Text>

        {!isEmailVerified && !isEditing && (
          <TouchableOpacity
            style={[globalStyles.outlineButtonGold, globalStyles.bacQuickAddButton, (isLoading || isSendingVerificationEmail) && globalStyles.disabledButton]}
            onPress={onResendVerificationEmail}
            disabled={isLoading || isSendingVerificationEmail}
          >
            <Text style={globalStyles.outlineButtonGoldText}>
              {isSendingVerificationEmail ? 'Sender...' : 'Send verifiseringsmail på nytt'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

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
                  setEditedInfo((prev) => ({ ...prev, weight: value }));
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

      <View style={globalStyles.inputGroup}>
        <Text style={globalStyles.label}>Kjønn</Text>
        {isEditing ? (
          <View style={settingsStyles.genderSelectRow}>
            <TouchableOpacity
              style={[
                globalStyles.selectionButton,
                settingsStyles.genderSelectButton,
                editedInfo.gender === 'male' && globalStyles.selectionButtonSelected,
                editedInfo.gender === 'male' && globalStyles.inputShellFocusedGold,
              ]}
              onPress={() => setEditedInfo((prev) => ({ ...prev, gender: 'male' }))}
            >
              <Text style={[globalStyles.selectionButtonText, editedInfo.gender === 'male' && globalStyles.selectionButtonTextSelected]}>Mann</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                globalStyles.selectionButton,
                settingsStyles.genderSelectButton,
                editedInfo.gender === 'female' && globalStyles.selectionButtonSelected,
                editedInfo.gender === 'female' && globalStyles.inputShellFocusedGold,
              ]}
              onPress={() => setEditedInfo((prev) => ({ ...prev, gender: 'female' }))}
            >
              <Text style={[globalStyles.selectionButtonText, editedInfo.gender === 'female' && globalStyles.selectionButtonTextSelected]}>Kvinne</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                globalStyles.selectionButton,
                settingsStyles.genderSelectButton,
                !editedInfo.gender && globalStyles.selectionButtonSelected,
                !editedInfo.gender && globalStyles.inputShellFocusedGold,
              ]}
              onPress={() => setEditedInfo((prev) => ({ ...prev, gender: undefined }))}
            >
              <Text style={[globalStyles.selectionButtonText, !editedInfo.gender && globalStyles.selectionButtonTextSelected]}>Ikke satt</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={globalStyles.readOnlyInput}>
            <Text style={settingsStyles.readOnlyText}>
              {userInfo.gender === 'male' ? 'Mann' : userInfo.gender === 'female' ? 'Kvinne' : 'Ikke satt'}
            </Text>
          </View>
        )}
      </View>

      <View style={[globalStyles.editButtonsContainer, settingsStyles.editButtonsContainer]}>
        {isEditing ? (
          <>
            <TouchableOpacity style={globalStyles.cancelButton} onPress={onCancelEdit} disabled={isLoading}>
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[globalStyles.saveButton, (isLoading || !canSaveEditedData) && globalStyles.disabledButton]}
              onPress={onSave}
              disabled={isLoading || !canSaveEditedData}
            >
              <Text style={globalStyles.saveButtonTextAlt}>{isLoading ? 'Lagrer...' : 'Lagre'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          null
        )}
      </View>
    </View>
  );
};

export default UserInfoSection;
