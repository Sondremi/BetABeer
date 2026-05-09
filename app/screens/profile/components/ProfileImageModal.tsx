import React, { useState } from 'react';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { profileScreenTokens, profileStyles } from '../../../styles/components/profileStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { INPUT_LIMITS } from '../../../utils/inputValidation';
import { defaultProfileImageMap, defaultProfileImages } from '../../../utils/defaultProfileImages';
import { isDefaultProfileImageKey, resolveProfileImageSource } from '../../../utils/profileImage';
import { DefaultProfilePicture, ImageMissing } from '../profileAssets';

type ProfileImageModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  onUpload: () => void;
  uploading: boolean;
  uploadDisabled: boolean;
  uploadDisabledMessage: string;
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
  uploadDisabled,
  uploadDisabledMessage,
  selectedProfileImage,
  setSelectedProfileImage,
  currentProfileImage,
  displayName,
  setDisplayName,
}: ProfileImageModalProps) => {
  const [nameFocused, setNameFocused] = useState(false);
  const [hasClearedImage, setHasClearedImage] = useState(false);
  const previewSource = hasClearedImage
    ? ImageMissing
    : resolveProfileImageSource(selectedProfileImage ?? currentProfileImage, DefaultProfilePicture);
  const canRemoveImage = Boolean(selectedProfileImage && !isDefaultProfileImageKey(selectedProfileImage));

  React.useEffect(() => {
    if (visible) {
      setHasClearedImage(false);
    }
  }, [visible, currentProfileImage]);

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
              style={profileStyles.profileUploadPreviewImageLarge}
            />
          </View>
          <View style={profileStyles.profileModalActionRow}>
            <TouchableOpacity
              style={[
                globalStyles.outlineButtonGold,
                profileStyles.profileModalActionButtonGroupLike,
                (uploading || uploadDisabled) && globalStyles.disabledButton,
              ]}
              onPress={onUpload}
              disabled={uploading || uploadDisabled}
            >
              <Text style={[
                globalStyles.outlineButtonGoldText,
                globalStyles.actionGridButtonText,
                uploadDisabled && globalStyles.disabledGoldActionText,
              ]}>
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
                  onPress={() => {
                    setSelectedProfileImage(null);
                    setHasClearedImage(true);
                  }}
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
          {uploadDisabled && (
            <Text style={globalStyles.validationHelperText}>{uploadDisabledMessage}</Text>
          )}
          <ScrollView contentContainerStyle={profileStyles.profileModalGrid}>
            {defaultProfileImages.map((img) => (
              <TouchableOpacity
                key={img}
                style={[
                  profileStyles.profileImageChoice,
                  selectedProfileImage === img && profileStyles.profileImageChoiceSelected,
                ]}
                onPress={() => {
                  setSelectedProfileImage(img);
                  setHasClearedImage(false);
                }}
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
