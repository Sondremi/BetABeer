import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { friendsStyles } from '../../../styles/components/friendsStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { Friend } from '../../../types/userTypes';

type SearchResultRowProps = {
  item: Friend;
  onAddFriend: (friend: Friend) => void;
};

const SearchResultRow = ({ item, onAddFriend }: SearchResultRowProps) => {
  return (
    <View style={[globalStyles.listItemRow, globalStyles.friendSpacing, friendsStyles.friendRow]}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, friendsStyles.friendImage]} />
      <View style={globalStyles.itemInfo}>
        <Text style={friendsStyles.friendName}>{item.name}</Text>
        <Text style={globalStyles.secondaryText}>@{item.username}</Text>
      </View>
      <TouchableOpacity style={[globalStyles.outlineButtonGold, globalStyles.actionButton]} onPress={() => onAddFriend(item)}>
        <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionButtonText]}>Legg til</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SearchResultRow;
