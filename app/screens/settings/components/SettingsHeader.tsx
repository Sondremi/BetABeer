import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../../../styles/globalStyles';

type SettingsHeaderProps = {
  onBack: () => void;
};

const SettingsHeader = ({ onBack }: SettingsHeaderProps) => {
  const safeTop = Platform.OS === 'web' ? ('max(env(safe-area-inset-top), 30px)' as unknown as number) : undefined;
  return (
    <View style={[globalStyles.header, globalStyles.rowCenter, safeTop !== undefined && { paddingTop: safeTop }]}>
      <TouchableOpacity style={globalStyles.iconBackButton} onPress={onBack}>
        <Text style={globalStyles.iconBackButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={globalStyles.headerTitle}>Innstillinger</Text>
    </View>
  );
};

export default SettingsHeader;
