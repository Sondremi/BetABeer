import React from 'react';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const EditBetModal = (props: any) => {
  const {
    INPUT_LIMITS,
    editBetModalVisible,
    setEditBetModalVisible,
    globalStyles,
    groupStyles,
    theme,
    editBetTitleFocused,
    setEditBetTitleFocused,
    editBetTitle,
    setEditBetTitle,
    shouldScrollEditBetOptions,
    editBetOptions,
    focusedEditBetOptionIndex,
    setFocusedEditBetOptionIndex,
    updateEditBetOption,
    removeEditBetOption,
    canAddEditBetOption,
    addEditBetOption,
    editBetAnonymous,
    setEditBetAnonymous,
    memberData,
    user,
    editHiddenBetMemberIds,
    toggleEditHiddenBetMember,
    handleSaveEditBet,
    editBetSaving,
  } = props;

  return (
    <Modal visible={editBetModalVisible} animationType="slide" transparent onRequestClose={() => setEditBetModalVisible(false)}>
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={groupStyles.modalScrollContent}>
            <Text style={globalStyles.modalTitle}>Rediger bet</Text>
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Tittel på bet</Text>
              <View style={[globalStyles.inputShellDark, globalStyles.betSelectionHintText, editBetTitleFocused && globalStyles.inputShellFocusedGold]}>
                <TextInput
                  placeholder="Tittel på bett"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={editBetTitle}
                  onChangeText={(text) => setEditBetTitle(text.slice(0, INPUT_LIMITS.betTitleMax))}
                  onFocus={() => setEditBetTitleFocused(true)}
                  onBlur={() => setEditBetTitleFocused(false)}
                  style={[globalStyles.input, groupStyles.inputInsideShell]}
                  maxLength={INPUT_LIMITS.betTitleMax}
                />
              </View>
            </View>

            <ScrollView
              style={shouldScrollEditBetOptions ? globalStyles.betOptionsScrollWrap : undefined}
              nestedScrollEnabled={shouldScrollEditBetOptions}
              showsVerticalScrollIndicator={shouldScrollEditBetOptions}
            >
              {editBetOptions.map((opt: any, idx: number) => (
                <View key={`edit-bet-option-${idx}`} style={globalStyles.inputGroup}>
                  <View style={globalStyles.rowSpread}>
                    <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                      <Text style={globalStyles.label}>Alternativ {idx + 1}</Text>
                      <View style={[globalStyles.inputShellDark, globalStyles.betSelectionHintText, focusedEditBetOptionIndex === idx && globalStyles.inputShellFocusedGold]}>
                        <TextInput
                          placeholder={`Alternativ ${idx + 1}`}
                          placeholderTextColor={theme.colors.textSecondary}
                          value={opt.name}
                          onChangeText={(text) => updateEditBetOption(idx, 'name', text.slice(0, INPUT_LIMITS.betOptionNameMax))}
                          onFocus={() => setFocusedEditBetOptionIndex(idx)}
                          onBlur={() => setFocusedEditBetOptionIndex(null)}
                          style={[globalStyles.input, groupStyles.inputInsideShell]}
                          maxLength={INPUT_LIMITS.betOptionNameMax}
                        />
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeEditBetOption(idx)} disabled={editBetOptions.length <= 1} style={{ alignSelf: 'flex-end', marginBottom: 10 }}>
                      <Text
                        style={[
                          globalStyles.secondaryText,
                          { fontWeight: '700', color: editBetOptions.length <= 1 ? theme.colors.textSecondary : theme.colors.primary },
                        ]}
                      >
                        Slett
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={addEditBetOption} disabled={!canAddEditBetOption} style={{ marginBottom: theme.spacing.md, alignSelf: 'flex-start' }}>
              <Text style={[globalStyles.addOptionText, !canAddEditBetOption && globalStyles.disabledGoldActionText]}>+ Legg til alternativ</Text>
            </TouchableOpacity>

            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Anonymitet</Text>
              <Text style={[globalStyles.secondaryText, { marginBottom: theme.spacing.sm }]}>Vis navnet ditt på bettet.</Text>
              <View style={groupStyles.anonymousToggleRow}>
                <TouchableOpacity
                  style={[globalStyles.selectionButton, groupStyles.anonymousToggleButton, !editBetAnonymous && globalStyles.selectionButtonSelected]}
                  onPress={() => setEditBetAnonymous(false)}
                >
                  <Text style={[globalStyles.selectionButtonText, !editBetAnonymous && globalStyles.selectionButtonTextSelected]}>Ikke anonym</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.selectionButton, groupStyles.anonymousToggleButton, editBetAnonymous && globalStyles.selectionButtonSelected]}
                  onPress={() => setEditBetAnonymous(true)}
                >
                  <Text style={[globalStyles.selectionButtonText, editBetAnonymous && globalStyles.selectionButtonTextSelected]}>Anonym</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Skjul bettet for medlemmer</Text>
              <Text style={[globalStyles.secondaryText, { marginBottom: theme.spacing.sm }]}>Disse kan ikke se bettet før det markeres som ferdig.</Text>
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator>
                <View style={{ gap: theme.spacing.xs, paddingRight: 2 }}>
                  {memberData
                    .filter((member: any) => member.id !== user?.id)
                    .map((member: any) => {
                      const isHidden = editHiddenBetMemberIds.includes(member.id);
                      return (
                        <TouchableOpacity
                          key={member.id}
                          style={[
                            globalStyles.listItemRow,
                            {
                              paddingVertical: theme.spacing.sm,
                              backgroundColor: isHidden ? theme.colors.primary + '20' : theme.colors.surface,
                              borderColor: isHidden ? theme.colors.primary : theme.colors.border,
                            },
                          ]}
                          onPress={() => toggleEditHiddenBetMember(member.id)}
                        >
                          <Image source={member.profilePicture} style={[globalStyles.circularImage, { width: 32, height: 32, marginRight: 10 }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={groupStyles.wagerUser}>{member.name}</Text>
                            <Text style={globalStyles.secondaryText}>@{member.username}</Text>
                          </View>
                          <Text style={[globalStyles.selectionButtonText, { color: isHidden ? theme.colors.primary : theme.colors.textSecondary, fontWeight: '700' }]}>
                            {isHidden ? 'Skjult' : 'Synlig'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </ScrollView>
            </View>
          </ScrollView>

          <View style={[globalStyles.editButtonsContainer, globalStyles.modalFooter]}>
            <TouchableOpacity onPress={() => setEditBetModalVisible(false)} disabled={editBetSaving}>
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveEditBet} disabled={editBetSaving}>
              <Text style={globalStyles.saveButtonText}>{editBetSaving ? 'Lagrer...' : 'Lagre'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditBetModal;
