import React from 'react';
import { Image, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import { INPUT_LIMITS } from '../../../utils/inputValidation';

type GroupHeaderProps = {
  currentGroup: { name: string; memberCount: number; image: any };
  editingName: boolean;
  groupName: string;
  groupNameFocused: boolean;
  saving: boolean;
  canEditGroupName: boolean;
  canManageGroupImage: boolean;
  hasCustomGroupImage: boolean;
  uploadingGroupImage: boolean;
  pencilIcon: any;
  groupImageIcon: any;
  trashIcon: any;
  peopleIcon: any;
  onBackToProfile: () => void;
  onOpenMembers: () => void;
  onGroupNameChange: (value: string) => void;
  onSetGroupNameFocused: (value: boolean) => void;
  onSaveGroupName: () => void;
  onCancelEditGroupName: () => void;
  onStartEditGroupName: () => void;
  onUploadOrChangeGroupImage: () => void;
  onRemoveGroupImage: () => void;
};

const GroupHeader = ({
  currentGroup,
  editingName,
  groupName,
  groupNameFocused,
  saving,
  canEditGroupName,
  canManageGroupImage,
  hasCustomGroupImage,
  uploadingGroupImage,
  pencilIcon,
  groupImageIcon,
  trashIcon,
  peopleIcon,
  onBackToProfile,
  onOpenMembers,
  onGroupNameChange,
  onSetGroupNameFocused,
  onSaveGroupName,
  onCancelEditGroupName,
  onStartEditGroupName,
  onUploadOrChangeGroupImage,
  onRemoveGroupImage,
}: GroupHeaderProps) => {
  const buttonTopStyle = Platform.OS === 'web'
    ? { top: 'env(safe-area-inset-top)' as unknown as number }
    : {};

  return (
    <View style={globalStyles.headerContainer}>
      <Image source={currentGroup.image} style={globalStyles.groupHeaderImage} />
      <TouchableOpacity onPress={onBackToProfile} style={[groupStyles.heroImageBackButton, buttonTopStyle]}>
        <Text style={globalStyles.iconBackButtonText}>←</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onOpenMembers} style={[groupStyles.heroImageTopRightButton, buttonTopStyle]}>
        <Image source={peopleIcon} style={globalStyles.primaryIcon} />
      </TouchableOpacity>
      <View style={[globalStyles.overlay, groupStyles.groupHeaderOverlayCompact]}>
        <View style={globalStyles.headerInfo}>
          {editingName ? (
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Gruppenavn</Text>
              <View style={globalStyles.rowCenter}>
                <TextInput
                  value={groupName}
                  onChangeText={(text) => onGroupNameChange(text.slice(0, INPUT_LIMITS.groupNameMax))}
                  style={[
                    groupStyles.groupNameInput,
                    groupStyles.groupNameInputCompact,
                    groupNameFocused && globalStyles.inputShellFocusedGold,
                  ]}
                  editable={!saving}
                  autoFocus
                  placeholder="Gruppenavn"
                  placeholderTextColor={theme.colors.textSecondary}
                  maxLength={INPUT_LIMITS.groupNameMax}
                  onFocus={() => onSetGroupNameFocused(true)}
                  onBlur={() => onSetGroupNameFocused(false)}
                  onSubmitEditing={onSaveGroupName}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={onSaveGroupName} disabled={saving} style={groupStyles.inlineIconActionButton}>
                  <Image source={pencilIcon} style={globalStyles.primaryIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onCancelEditGroupName} disabled={saving} style={groupStyles.inlineIconActionButton}>
                  <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={groupStyles.groupHeaderRow}>
              <Text style={groupStyles.groupHeaderName}>{currentGroup.name}</Text>
              <View style={globalStyles.groupHeaderActions}>
                {canEditGroupName && (
                  <TouchableOpacity onPress={onStartEditGroupName} style={globalStyles.groupActionIconButton}>
                    <Image source={pencilIcon} style={globalStyles.primaryIcon} />
                  </TouchableOpacity>
                )}
                {canManageGroupImage && (
                  <TouchableOpacity
                    onPress={onUploadOrChangeGroupImage}
                    disabled={uploadingGroupImage}
                    style={globalStyles.groupActionIconButton}
                  >
                    <Image source={groupImageIcon} style={globalStyles.primaryIcon} />
                  </TouchableOpacity>
                )}
                {canManageGroupImage && hasCustomGroupImage && (
                  <TouchableOpacity
                    onPress={onRemoveGroupImage}
                    disabled={uploadingGroupImage}
                    style={globalStyles.groupActionIconButton}
                  >
                    <Image source={trashIcon} style={globalStyles.deleteIcon} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          <Text style={groupStyles.groupHeaderMembers}>{currentGroup.memberCount} medlemmer</Text>
        </View>
      </View>
    </View>
  );
};

export default GroupHeader;
