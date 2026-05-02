import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';

type GroupExitSectionProps = {
  isCreator: boolean;
  deleting: boolean;
  onDeleteGroup: () => void;
  onExitGroup: () => void;
};

const GroupExitSection = ({ isCreator, deleting, onDeleteGroup, onExitGroup }: GroupExitSectionProps) => {
  return (
    <View style={groupStyles.groupBottomExitArea}>
      <TouchableOpacity
        onPress={isCreator ? onDeleteGroup : onExitGroup}
        disabled={deleting}
        style={[groupStyles.groupBottomExitButton, deleting && globalStyles.disabledButton]}
      >
        <Text style={groupStyles.groupBottomExitButtonText}>{isCreator ? 'Slett gruppe' : 'Forlat gruppe'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GroupExitSection;
