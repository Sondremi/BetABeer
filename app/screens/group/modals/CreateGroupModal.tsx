import React from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CreateGroupModal = (props: any) => {
  const {
    createGroupModalVisible,
    setCreateGroupModalVisible,
    globalStyles,
    groupStyles,
    theme,
    INPUT_LIMITS,
    createGroupName,
    setCreateGroupName,
    createGroupNameFocused,
    setCreateGroupNameFocused,
    creatingGroup,
    handleCreateGroup,
  } = props;

  return (
    <Modal
      visible={createGroupModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        setCreateGroupName('');
        setCreateGroupModalVisible(false);
      }}
    >
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
          <Text style={globalStyles.modalTitle}>Opprett gruppe</Text>
          <View style={globalStyles.inputGroup}>
            <Text style={globalStyles.label}>Gruppenavn</Text>
            <View style={[globalStyles.inputShellDark, globalStyles.betSelectionHintText, createGroupNameFocused && globalStyles.inputShellFocusedGold]}>
              <TextInput
                placeholder="Skriv gruppenavn"
                placeholderTextColor={theme.colors.textSecondary}
                value={createGroupName}
                onChangeText={(text) => setCreateGroupName(text.slice(0, INPUT_LIMITS.groupNameMax))}
                onFocus={() => setCreateGroupNameFocused(true)}
                onBlur={() => setCreateGroupNameFocused(false)}
                style={[globalStyles.input, groupStyles.inputInsideShell]}
                maxLength={INPUT_LIMITS.groupNameMax}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[globalStyles.selectionButton, { marginBottom: theme.spacing.sm }, !createGroupName.trim() && globalStyles.disabledButton]}
            onPress={handleCreateGroup}
            disabled={creatingGroup || !createGroupName.trim()}
          >
            <Text style={globalStyles.selectionButtonText}>{creatingGroup ? 'Oppretter...' : 'Opprett gruppe'}</Text>
          </TouchableOpacity>

          <View style={globalStyles.editButtonsContainer}>
            <TouchableOpacity
              onPress={() => {
                setCreateGroupName('');
                setCreateGroupModalVisible(false);
              }}
            >
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreateGroupModal;
