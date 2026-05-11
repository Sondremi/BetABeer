import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { friendsStyles } from '../../../styles/components/friendsStyles';
import { globalStyles } from '../../../styles/globalStyles';

type FriendsHeaderProps = {
  onBack: () => void;
};

const FriendsHeader = ({ onBack }: FriendsHeaderProps) => {
  return (
    <View style={[globalStyles.header, friendsStyles.headerRow]}>
      <TouchableOpacity style={globalStyles.iconBackButton} onPress={onBack}>
        <Text style={globalStyles.iconBackButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={[globalStyles.headerTitle, friendsStyles.headerTitle]}>Venner</Text>
    </View>
  );
};

export default FriendsHeader;
