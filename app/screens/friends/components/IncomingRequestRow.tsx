import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { friendsStyles } from '../../../styles/components/friendsStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { FriendRequest } from '../../../types/userTypes';

type IncomingRequestRowProps = {
  item: FriendRequest;
  onAccept: (request: FriendRequest) => void;
  onDecline: (request: FriendRequest) => void;
};

const IncomingRequestRow = ({ item, onAccept, onDecline }: IncomingRequestRowProps) => {
  return (
    <View style={[globalStyles.listItemRow, globalStyles.friendSpacing, friendsStyles.friendRow]}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, friendsStyles.friendImage]} />
      <View style={globalStyles.itemInfo}>
        <Text style={friendsStyles.friendName}>{item.name}</Text>
        <Text style={globalStyles.secondaryText}>@{item.username}</Text>
      </View>
      <View style={globalStyles.requestActionRow}>
        <TouchableOpacity
          style={[globalStyles.outlineButtonGold, globalStyles.actionButton, globalStyles.actionButtonDanger]}
          onPress={() => onDecline(item)}
        >
          <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionButtonText, globalStyles.actionButtonDangerText]}>Fjern</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[globalStyles.outlineButtonGold, globalStyles.actionButton]} onPress={() => onAccept(item)}>
          <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionButtonText]}>Godta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default IncomingRequestRow;
