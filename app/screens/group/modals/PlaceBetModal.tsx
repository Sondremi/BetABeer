import React from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PlaceBetModal = (props: any) => {
  const {
    placeBetModalVisible,
    setPlaceBetModalVisible,
    globalStyles,
    groupStyles,
    theme,
    INPUT_LIMITS,
    selectedBetOption,
    drinkTypes,
    selectedDrinkType,
    setSelectedDrinkType,
    customDrinkName,
    setCustomDrinkName,
    measureTypes,
    selectedMeasureType,
    setSelectedMeasureType,
    placeBetMaxAmount,
    betAmountFocused,
    setBetAmountFocused,
    betAmount,
    setBetAmount,
    clampDigits,
    setHasInteractedPlaceBetAmount,
    hasInteractedPlaceBetAmount,
    placeBetAttempted,
    placeBetValidationMessage,
    placingBet,
    canPlaceBet,
    handlePlaceBet,
  } = props;

  return (
    <Modal visible={placeBetModalVisible} animationType="slide" transparent onRequestClose={() => setPlaceBetModalVisible(false)}>
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={groupStyles.modalScrollContent}>
            <Text style={globalStyles.modalTitle}>Plasser bet</Text>

            {selectedBetOption && (
              <View>
                <Text style={globalStyles.modalText}>Bet: {selectedBetOption.bet.title}</Text>
                <Text style={globalStyles.secondaryText}>Alternativ: {selectedBetOption.option.name}</Text>
              </View>
            )}

            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Type drikke</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.md }}>
                {drinkTypes.map((drinkType: any) => (
                  <TouchableOpacity
                    key={drinkType}
                    style={[globalStyles.selectionButton, selectedDrinkType === drinkType && globalStyles.selectionButtonSelected]}
                    onPress={() => setSelectedDrinkType(drinkType)}
                  >
                    <Text style={[globalStyles.selectionButtonText, selectedDrinkType === drinkType && globalStyles.selectionButtonTextSelected]}>
                      {drinkType}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {selectedDrinkType === 'Egendefinert' && (
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Navn på drikke</Text>
                <View style={[globalStyles.inputShellDark, globalStyles.betSelectionHintText]}>
                  <TextInput
                    placeholder="Skriv inn drikke"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={customDrinkName}
                    onChangeText={(text) => setCustomDrinkName(text.slice(0, INPUT_LIMITS.drinkNameMax))}
                    style={[globalStyles.input, groupStyles.inputInsideShell]}
                    maxLength={INPUT_LIMITS.drinkNameMax}
                    autoFocus
                  />
                </View>
                {placeBetAttempted && customDrinkName.trim().length === 0 ? (
                  <Text style={globalStyles.validationHelperText}>Skriv inn navn på drikken.</Text>
                ) : null}
              </View>
            )}

            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Måleenhet</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.md }}>
                {measureTypes.map((measureType: any) => (
                  <TouchableOpacity
                    key={measureType}
                    style={[globalStyles.selectionButton, selectedMeasureType === measureType && globalStyles.selectionButtonSelected]}
                    onPress={() => setSelectedMeasureType(measureType)}
                  >
                    <Text style={[globalStyles.selectionButtonText, selectedMeasureType === measureType && globalStyles.selectionButtonTextSelected]}>
                      {measureType}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Antall</Text>
              <Text style={globalStyles.secondaryText}>{`Tillatt for valget ditt: 1-${placeBetMaxAmount}`}</Text>
              <View style={[globalStyles.inputShellDark, globalStyles.betSelectionHintText, betAmountFocused && globalStyles.inputShellFocusedGold]}>
                <TextInput
                  placeholder="Antall"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={betAmount}
                  onChangeText={(text) => {
                    setBetAmount(clampDigits(text, 2));
                    setHasInteractedPlaceBetAmount(true);
                  }}
                  onFocus={() => {
                    setBetAmountFocused(true);
                    setHasInteractedPlaceBetAmount(true);
                  }}
                  onBlur={() => setBetAmountFocused(false)}
                  keyboardType="numeric"
                  style={[globalStyles.input, groupStyles.inputInsideShell]}
                  maxLength={2}
                />
              </View>
              {(hasInteractedPlaceBetAmount || placeBetAttempted) && placeBetValidationMessage ? (
                <Text style={globalStyles.validationHelperText}>{placeBetValidationMessage}</Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={globalStyles.editButtonsContainer}>
            <TouchableOpacity onPress={() => setPlaceBetModalVisible(false)} disabled={placingBet}>
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlaceBet} disabled={placingBet || !canPlaceBet} style={!canPlaceBet ? globalStyles.disabledButton : undefined}>
              <Text style={globalStyles.saveButtonText}>{placingBet ? 'Plasserer...' : 'Plasser bet'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PlaceBetModal;
