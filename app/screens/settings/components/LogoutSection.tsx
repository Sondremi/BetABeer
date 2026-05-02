import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../styles/globalStyles';

type LogoutSectionProps = {
  onLogout: () => void;
};

const LogoutSection = ({ onLogout }: LogoutSectionProps) => {
  return (
    <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
      <Text style={globalStyles.sectionTitle}>Logg ut</Text>
      <TouchableOpacity style={globalStyles.outlineButton} onPress={onLogout}>
        <Text style={globalStyles.outlineButtonGoldText}>Logg ut</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LogoutSection;
