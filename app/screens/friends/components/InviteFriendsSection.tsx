import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { friendsStyles } from '../../../styles/components/friendsStyles';
import { globalStyles } from '../../../styles/globalStyles';

type InviteFriendsSectionProps = {
  onInviteFriends: () => void;
};

const InviteFriendsSection = ({ onInviteFriends }: InviteFriendsSectionProps) => {
  return (
    <View style={[globalStyles.section, friendsStyles.compactSection]}>
      <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
        <TouchableOpacity style={globalStyles.outlineButtonGold} onPress={onInviteFriends}>
          <Text style={globalStyles.outlineButtonGoldText}>Inviter venner</Text>
        </TouchableOpacity>
        <Text style={[globalStyles.sectionDescription, globalStyles.collapsedHeaderRow]}>
          Del lenken med venner for å invitere dem til appen
        </Text>
      </View>
    </View>
  );
};

export default InviteFriendsSection;
