import React, { useState } from 'react';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { profileScreenTokens, profileStyles } from '../../../styles/components/profileStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { defaultProfileImageMap, defaultProfileImages } from '../../../utils/defaultProfileImages';
import { INPUT_LIMITS } from '../../../utils/inputValidation';
import { isDefaultProfileImageKey, resolveProfileImageSource } from '../../../utils/profileImage';
import { DefaultProfilePicture, ImageMissing } from '../profileAssets';

const PencilIcon = require('../../../../assets/icons/noun-pencil-969012.png');

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
            <TouchableOpacity
              onPress={onUpload}
              disabled={uploading || uploadDisabled}
              style={[profileStyles.profileImageContainer, profileStyles.profileImageContainerModal]}
            >
              <Image
                source={previewSource}
                style={profileStyles.profileUploadPreviewImageLarge}
              />
              <View style={[
                profileStyles.editProfileImageButton,
                (uploading || uploadDisabled) && globalStyles.disabledButton,
              ]}>
                <Image source={PencilIcon} style={globalStyles.primaryIcon} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={profileStyles.profileModalMeta}>
            {uploading && (
              <Text style={profileStyles.profileUploadHintText}>Laster opp...</Text>
            )}
            {canRemoveImage && !uploading && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedProfileImage(null);
                  setHasClearedImage(true);
                }}
              >
                <Text style={profileStyles.profileRemoveImageText}>Fjern bilde</Text>
              </TouchableOpacity>
            )}
            {uploadDisabled && (
              <Text style={[globalStyles.validationHelperText, profileStyles.profileUploadDisabledText]}>
                {uploadDisabledMessage}
              </Text>
            )}
          </View>
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
            <TouchableOpacity disabled={uploading} onPress={onClose}>
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={uploading} onPress={onSave}>
              <Text style={globalStyles.saveButtonText}>Lagre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ProfileImageModal;
