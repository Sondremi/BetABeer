import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import type { BettingOption } from '../../../types/drinkTypes';

const EditMenuModal = (props: any) => {
  const {
    editMenuModalVisible,
    setEditMenuModalVisible,
    globalStyles,
    groupStyles,
    theme,
    selectedEditBet,
    setEditBetIdx,
    setEditBetTitle,
    setEditBetAnonymous,
    setEditHiddenBetMemberIds,
    setEditBetOptions,
    setEditBetModalVisible,
    setSelectCorrectBetIdx,
    setSelectCorrectModalVisible,
    showAlert,
    handleDeleteBet,
  } = props;

  return (
    <Modal visible={editMenuModalVisible} animationType="slide" transparent onRequestClose={() => setEditMenuModalVisible(false)}>
      <View style={globalStyles.modalContainer}>
        <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
          <Text style={globalStyles.modalTitle}>Administrer bet</Text>
          <Text style={globalStyles.modalText}>{selectedEditBet?.bet.title || 'Velg en handling for bettet'}</Text>

          <TouchableOpacity
            style={[globalStyles.selectionButton, { marginBottom: theme.spacing.sm }]}
            onPress={() => {
              if (selectedEditBet) {
                setEditBetIdx(selectedEditBet.index);
                setEditBetTitle(selectedEditBet.bet.title);
                setEditBetAnonymous(Boolean(selectedEditBet.bet.isAnonymous));
                setEditHiddenBetMemberIds(selectedEditBet.bet.hiddenFromUserIds || []);
                setEditBetOptions(
                  selectedEditBet.bet.options.map((opt: BettingOption) => ({
                    name: opt.name,
                  }))
                );
                setEditBetModalVisible(true);
                setEditMenuModalVisible(false);
              }
            }}
          >
            <Text style={globalStyles.selectionButtonText}>Rediger bet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[globalStyles.selectionButton, { marginBottom: theme.spacing.sm }]}
            onPress={() => {
              if (selectedEditBet) {
                setSelectCorrectBetIdx(selectedEditBet.index);
                setSelectCorrectModalVisible(true);
                setEditMenuModalVisible(false);
              }
            }}
          >
            <Text style={globalStyles.selectionButtonText}>{selectedEditBet?.bet.isFinished ? 'Gjør aktivt igjen' : 'Marker som ferdig'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[globalStyles.selectionButton, { marginBottom: theme.spacing.sm, backgroundColor: theme.colors.error }]}
            onPress={() => {
              if (selectedEditBet) {
                setEditMenuModalVisible(false);
                showAlert(
                  'Bekreft sletting',
                  'Er du sikker på at du vil slette dette bettet? Dette kan ikke angres',
                  [
                    { text: 'Avbryt', style: 'cancel' },
                    {
                      text: 'Slett',
                      style: 'destructive',
                      onPress: () => handleDeleteBet(selectedEditBet.index),
                    },
                  ]
                );
              }
            }}
          >
            <Text style={[globalStyles.selectionButtonText, { color: theme.colors.background }]}>Slett bet</Text>
          </TouchableOpacity>

          <View style={globalStyles.editButtonsContainer}>
            <TouchableOpacity onPress={() => setEditMenuModalVisible(false)}>
              <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditMenuModal;
