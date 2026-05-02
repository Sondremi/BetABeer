import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import type { Friend } from '../../../types/userTypes';

type FriendInviteRowProps = {
  item: Friend;
  invitationSent: boolean;
  inviting: boolean;
  onInvite: (friend: Friend) => void;
  onCancelInvitation: (friend: Friend) => void;
};

const FriendInviteRow = ({
  item,
  invitationSent,
  inviting,
  onInvite,
  onCancelInvitation,
}: FriendInviteRowProps) => {
  return (
    <View style={groupStyles.memberRow}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, groupStyles.memberAvatar]} />
      <View style={groupStyles.memberMeta}>
        <Text style={[groupStyles.wagerUser, groupStyles.memberName]}>{item.name}</Text>
        <Text style={[globalStyles.secondaryText, groupStyles.memberUsername]}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={[
          globalStyles.outlineButtonGold,
          globalStyles.actionButton,
          invitationSent && { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary },
        ]}
        onPress={() => (invitationSent ? onCancelInvitation(item) : onInvite(item))}
        disabled={inviting}
      >
        <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionButtonText, { color: invitationSent ? theme.colors.primary : undefined }]}>
          {invitationSent ? 'Angre' : 'Inviter'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FriendInviteRow;
