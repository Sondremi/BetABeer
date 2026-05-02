import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../styles/globalStyles';

type SettingsHeaderProps = {
  onBack: () => void;
};

const SettingsHeader = ({ onBack }: SettingsHeaderProps) => {
  return (
    <View style={[globalStyles.header, globalStyles.rowCenter]}>
      <TouchableOpacity style={globalStyles.iconBackButton} onPress={onBack}>
        <Text style={globalStyles.iconBackButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={globalStyles.headerTitle}>Innstillinger</Text>
    </View>
  );
};

export default SettingsHeader;
