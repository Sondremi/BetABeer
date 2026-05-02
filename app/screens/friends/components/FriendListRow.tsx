import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { friendsStyles } from '../../../styles/components/friendsStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { FriendWithPending } from '../../../types/userTypes';

type FriendListRowProps = {
  item: FriendWithPending;
  onRemove: (friend: FriendWithPending) => void;
};

const FriendListRow = ({ item, onRemove }: FriendListRowProps) => {
  return (
    <View style={[globalStyles.listItemRow, globalStyles.friendSpacing, friendsStyles.friendRow]}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, friendsStyles.friendImage]} />
      <View style={globalStyles.itemInfo}>
        <Text style={friendsStyles.friendName}>{item.name}</Text>
        <Text style={globalStyles.secondaryText}>@{item.username}</Text>
        {item.type === 'pending' && <Text style={friendsStyles.pendingText}>Forespørsel sendt</Text>}
      </View>
      <TouchableOpacity
        style={[globalStyles.outlineButtonGold, globalStyles.actionButton, globalStyles.actionButtonDanger]}
        onPress={() => onRemove(item)}
      >
        <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionButtonText, globalStyles.actionButtonDangerText]}>Fjern</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FriendListRow;
