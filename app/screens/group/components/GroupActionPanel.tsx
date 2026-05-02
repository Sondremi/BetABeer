import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';

type GroupActionPanelProps = {
  onOpenBetModal: () => void;
  onOpenDistributeModal: () => void;
  onOpenLeaderboardModal: () => void;
};

const GroupActionPanel = ({
  onOpenBetModal,
  onOpenDistributeModal,
  onOpenLeaderboardModal,
}: GroupActionPanelProps) => {
  return (
    <View style={groupStyles.actionCard}>
      <View style={groupStyles.actionGridRow}>
        <TouchableOpacity style={[globalStyles.outlineButtonGold, groupStyles.actionGridButton]} onPress={onOpenBetModal}>
          <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionGridButtonText]}>Opprett bett</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[globalStyles.outlineButtonGold, groupStyles.actionGridButton]} onPress={onOpenDistributeModal}>
          <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionGridButtonText]}>Del ut slurker</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[globalStyles.outlineButtonGold, groupStyles.actionGridButton]} onPress={onOpenLeaderboardModal}>
          <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionGridButtonText]}>Tabell</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupActionPanel;
