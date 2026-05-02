import React, { useState } from 'react';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { profileScreenTokens, profileStyles } from '../../../styles/components/profileStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { INPUT_LIMITS } from '../../../utils/inputValidation';
import { defaultProfileImageMap, defaultProfileImages } from '../../../utils/defaultProfileImages';
import { isDefaultProfileImageKey, resolveProfileImageSource } from '../../../utils/profileImage';
import { DefaultProfilePicture } from '../profileAssets';

type ProfileImageModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  onUpload: () => void;
  uploading: boolean;
  selectedProfileImage: string | null;
  setSelectedProfileImage: (value: string | null) => void;
  currentProfileImage: string | null;
  displayName: string;
  setDisplayName: (value: string) => void;
};

const ProfileImageModal = ({
  visible,
  onClose,
  onSave,
  onUpload,
  uploading,
  selectedProfileImage,
  setSelectedProfileImage,
  currentProfileImage,
  displayName,
  setDisplayName,
}: ProfileImageModalProps) => {
  const [nameFocused, setNameFocused] = useState(false);
  const previewSource = resolveProfileImageSource(currentProfileImage, DefaultProfilePicture);
  const canRemoveImage = Boolean(selectedProfileImage && !isDefaultProfileImageKey(selectedProfileImage));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, profileStyles.profileModalContent]}>
          <Text style={globalStyles.modalTitle}>Velg profilbilde</Text>
          <View style={profileStyles.profileUploadPreviewWrap}>
            <Image
              source={previewSource}
              style={globalStyles.profileUploadPreviewImage}
            />
          </View>
          <View style={profileStyles.profileModalActionRow}>
            <TouchableOpacity
              style={[
                globalStyles.outlineButtonGold,
                profileStyles.profileModalActionButtonGroupLike,
                uploading && globalStyles.disabledButton,
              ]}
              onPress={onUpload}
              disabled={uploading}
            >
              <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionGridButtonText]}>
                {uploading ? 'Laster opp...' : 'Last opp'}
              </Text>
            </TouchableOpacity>
            {canRemoveImage && (
              <TouchableOpacity
                style={[
                  globalStyles.outlineButtonGold,
                  profileStyles.profileModalActionButtonGroupLike,
                  globalStyles.actionButtonDanger,
                  uploading && globalStyles.disabledButton,
                ]}
                onPress={() => setSelectedProfileImage(null)}
                disabled={uploading}
              >
                <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionGridButtonText, globalStyles.actionButtonDangerText]}>
                  Fjern bilde
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {canRemoveImage && (
            <Text style={profileStyles.profileUploadHintText}>Eget bilde valgt</Text>
          )}
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
                  style={globalStyles.profileUploadPreviewImage}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={[globalStyles.inputGroup, profileStyles.profileNameGroup]}>
            <Text style={globalStyles.label}>Navn</Text>
            <View style={[globalStyles.inputShellDark, nameFocused && globalStyles.inputShellFocusedGold]}>
              <TextInput
                style={[globalStyles.input, globalStyles.createGroupInput]}
                value={displayName}
                onChangeText={(text) => setDisplayName(text.slice(0, INPUT_LIMITS.profileNameMax))}
                placeholder="Your name"
                placeholderTextColor={profileScreenTokens.nameInputPlaceholderTextColor}
                maxLength={INPUT_LIMITS.profileNameMax}
                autoCapitalize="words"
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>
          </View>
          <View style={globalStyles.editButtonsContainer}>
            <TouchableOpacity
              disabled={uploading}
              onPress={onClose}
            >
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={uploading}
              onPress={onSave}
            >
              <Text style={globalStyles.saveButtonText}>Lagre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProfileImageModal;
