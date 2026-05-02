import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const SelectCorrectModal = (props: any) => {
  const {
    selectCorrectModalVisible,
    setSelectCorrectModalVisible,
    globalStyles,
    groupStyles,
    theme,
    selectCorrectBetIdx,
    bets,
    handleSelectCorrectOption,
  } = props;

  return (
    <Modal visible={selectCorrectModalVisible} animationType="slide" transparent onRequestClose={() => setSelectCorrectModalVisible(false)}>
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={groupStyles.modalScrollContent}>
            <Text style={globalStyles.modalTitle}>
              {selectCorrectBetIdx !== null && bets[selectCorrectBetIdx]?.isFinished ? 'Administrer ferdig bet' : 'Velg riktig alternativ'}
            </Text>

            {selectCorrectBetIdx !== null && (
              <View>
                <Text style={globalStyles.modalText}>{bets[selectCorrectBetIdx]?.title}</Text>
                {bets[selectCorrectBetIdx]?.isFinished && (
                  <TouchableOpacity
                    style={[globalStyles.selectionButton, { marginBottom: theme.spacing.md, backgroundColor: theme.colors.error }]}
                    onPress={() => handleSelectCorrectOption(null)}
                  >
                    <Text style={[globalStyles.selectionButtonText, { color: theme.colors.background }]}>Gjør bettet aktivt igjen</Text>
                  </TouchableOpacity>
                )}
                <Text style={[globalStyles.label, { marginBottom: theme.spacing.sm }]}>
                  {bets[selectCorrectBetIdx]?.isFinished ? 'Eller velg nytt riktig alternativ:' : 'Velg riktig alternativ:'}
                </Text>
                {bets[selectCorrectBetIdx]?.options.map((option: any) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      globalStyles.selectionButton,
                      { marginBottom: theme.spacing.sm },
                      bets[selectCorrectBetIdx]?.correctOptionId === option.id && globalStyles.selectionButtonSelected,
                    ]}
                    onPress={() => handleSelectCorrectOption(option.id)}
                  >
                    <Text
                      style={[
                        globalStyles.selectionButtonText,
                        bets[selectCorrectBetIdx]?.correctOptionId === option.id && globalStyles.selectionButtonTextSelected,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={globalStyles.editButtonsContainer}>
            <TouchableOpacity onPress={() => setSelectCorrectModalVisible(false)}>
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SelectCorrectModal;
