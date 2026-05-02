import React from 'react';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const BetModal = (props: any) => {
  const {
    INPUT_LIMITS,
    betModalVisible,
    setBetModalVisible,
    globalStyles,
    groupStyles,
    theme,
    betTitleFocused,
    setBetTitleFocused,
    betTitle,
    setBetTitle,
    shouldScrollBetOptions,
    betOptions,
    focusedBetOptionIndex,
    setFocusedBetOptionIndex,
    updateBetOption,
    removeBetOption,
    canAddBetOption,
    addBetOption,
    addAllGroupMembersAsBetOptions,
    betAnonymous,
    setBetAnonymous,
    memberData,
    user,
    hiddenBetMemberIds,
    toggleHiddenBetMember,
    handleSaveBet,
    betSaving,
    canSaveBet,
  } = props;

  return (
    <Modal visible={betModalVisible} animationType="slide" transparent onRequestClose={() => setBetModalVisible(false)}>
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={groupStyles.modalScrollContent}
          >
            <Text style={globalStyles.modalTitle}>Opprett nytt bet</Text>
            <Text style={[globalStyles.mutedText, { marginBottom: theme.spacing.sm }]}>Trykk på blyant ikonet etter du har opprettet bettet for å redigere eller markere det som ferdig</Text>
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Tittel på bet</Text>
              <View style={[globalStyles.inputShellDark, globalStyles.betSelectionHintText, betTitleFocused && globalStyles.inputShellFocusedGold]}>
                <TextInput
                  placeholder="Tittel på bet"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={betTitle}
                  onChangeText={(text) => setBetTitle(text.slice(0, INPUT_LIMITS.betTitleMax))}
                  onFocus={() => setBetTitleFocused(true)}
                  onBlur={() => setBetTitleFocused(false)}
                  style={[globalStyles.input, groupStyles.inputInsideShell]}
                  maxLength={INPUT_LIMITS.betTitleMax}
                />
              </View>
            </View>

            <ScrollView
              style={shouldScrollBetOptions ? globalStyles.betOptionsScrollWrap : undefined}
              nestedScrollEnabled={shouldScrollBetOptions}
              showsVerticalScrollIndicator={shouldScrollBetOptions}
            >
              {betOptions.map((opt: any, idx: number) => (
                <View key={`bet-option-${idx}`} style={globalStyles.inputGroup}>
                  <View style={globalStyles.rowSpread}>
                    <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                      <Text style={globalStyles.label}>Alternativ {idx + 1}</Text>
                      <View style={[globalStyles.inputShellDark, globalStyles.betSelectionHintText, focusedBetOptionIndex === idx && globalStyles.inputShellFocusedGold]}>
                        <TextInput
                          placeholder={`Alternativ ${idx + 1}`}
                          placeholderTextColor={theme.colors.textSecondary}
                          value={opt.name}
                          onChangeText={(text) => updateBetOption(idx, 'name', text.slice(0, INPUT_LIMITS.betOptionNameMax))}
                          onFocus={() => setFocusedBetOptionIndex(idx)}
                          onBlur={() => setFocusedBetOptionIndex(null)}
                          style={[globalStyles.input, groupStyles.inputInsideShell]}
                          maxLength={INPUT_LIMITS.betOptionNameMax}
                        />
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeBetOption(idx)} disabled={betOptions.length <= 1} style={{ alignSelf: 'flex-end', marginBottom: 10 }}>
                      <Text
                        style={[
                          globalStyles.secondaryText,
                          { fontWeight: '700', color: betOptions.length <= 1 ? theme.colors.textSecondary : theme.colors.primary },
                        ]}
                      >
                        Slett
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={addBetOption} disabled={!canAddBetOption} style={{ marginBottom: theme.spacing.md, alignSelf: 'flex-start' }}>
              <Text style={[globalStyles.addOptionText, !canAddBetOption && globalStyles.disabledGoldActionText]}>+ Legg til alternativ</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={addAllGroupMembersAsBetOptions} style={{ marginBottom: theme.spacing.md, alignSelf: 'flex-start' }}>
              <Text style={globalStyles.addOptionText}>+ Fyll med alle gruppemedlemmer</Text>
            </TouchableOpacity>

            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Anonymitet</Text>
              <Text style={[globalStyles.secondaryText, { marginBottom: theme.spacing.sm }]}>Vis navnet ditt på bettet.</Text>
              <View style={groupStyles.anonymousToggleRow}>
                <TouchableOpacity
                  style={[globalStyles.selectionButton, groupStyles.anonymousToggleButton, !betAnonymous && globalStyles.selectionButtonSelected]}
                  onPress={() => setBetAnonymous(false)}
                >
                  <Text style={[globalStyles.selectionButtonText, !betAnonymous && globalStyles.selectionButtonTextSelected]}>Ikke anonym</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.selectionButton, groupStyles.anonymousToggleButton, betAnonymous && globalStyles.selectionButtonSelected]}
                  onPress={() => setBetAnonymous(true)}
                >
                  <Text style={[globalStyles.selectionButtonText, betAnonymous && globalStyles.selectionButtonTextSelected]}>Anonym</Text>
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
                      const isHidden = hiddenBetMemberIds.includes(member.id);
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
                          onPress={() => toggleHiddenBetMember(member.id)}
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

          <View style={globalStyles.editButtonsContainer}>
            <TouchableOpacity onPress={() => setBetModalVisible(false)} disabled={betSaving}>
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveBet} disabled={betSaving || !canSaveBet} style={!canSaveBet ? globalStyles.disabledButton : undefined}>
              <Text style={[globalStyles.saveButtonText, !canSaveBet && globalStyles.disabledGoldActionText]}>
                {betSaving ? 'Oppretter...' : 'Opprett'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default BetModal;
