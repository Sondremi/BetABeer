import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { Friend } from '../../../types/userTypes';

type MemberRowProps = {
  item: Friend;
  isCreator: boolean;
  isCurrentUserCreator: boolean;
  isCurrentUser: boolean;
  isFriend: boolean;
  hasOutgoingRequest: boolean;
  hasIncomingRequest: boolean;
  sendingFriendRequest: boolean;
  inviting?: boolean;
  onRemoveMember?: (member: Friend) => void;
  onAddFriend?: (member: Friend) => void;
  onAcceptFriend?: (member: Friend) => void;
  onCancelFriend?: (member: Friend) => void;
  creatorLabel?: string;
};

const MemberRow = ({
  item,
  isCreator,
  isCurrentUserCreator,
  isCurrentUser,
  isFriend,
  hasOutgoingRequest,
  hasIncomingRequest,
  sendingFriendRequest,
  inviting = false,
  onRemoveMember,
  onAddFriend,
  onAcceptFriend,
  onCancelFriend,
  creatorLabel = '(Eier)',
}: MemberRowProps) => {
  return (
    <View style={groupStyles.memberRow}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, groupStyles.memberAvatar]} />
      <View style={groupStyles.memberMeta}>
        <Text style={[groupStyles.wagerUser, groupStyles.memberName]}>
          {item.name} {isCreator ? creatorLabel : ''}
        </Text>
        <Text style={[globalStyles.secondaryText, groupStyles.memberUsername]}>@{item.username}</Text>
      </View>

      {!isCreator && isCurrentUserCreator && !isCurrentUser && onRemoveMember ? (
        <TouchableOpacity
          style={[globalStyles.outlineButtonGold, globalStyles.actionButton, globalStyles.actionButtonDanger]}
          onPress={() => onRemoveMember(item)}
        >
          <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionButtonText, globalStyles.actionButtonDangerText]}>Fjern</Text>
        </TouchableOpacity>
      ) : null}

      {!isFriend && !hasOutgoingRequest && !hasIncomingRequest && !isCurrentUser && !isCurrentUserCreator && onAddFriend ? (
        <TouchableOpacity
          style={[globalStyles.outlineButtonGold, globalStyles.actionButton, globalStyles.groupActionIconButton]}
          onPress={() => onAddFriend(item)}
          disabled={inviting || sendingFriendRequest}
        >
          <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionButtonText]}>Legg til venn</Text>
        </TouchableOpacity>
      ) : null}

      {!isFriend && hasIncomingRequest && !isCurrentUser && !isCurrentUserCreator && onAcceptFriend ? (
        <TouchableOpacity
          style={[globalStyles.outlineButtonGold, globalStyles.actionButton, globalStyles.groupActionIconButton]}
          onPress={() => onAcceptFriend(item)}
          disabled={sendingFriendRequest}
        >
          <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionButtonText]}>Godta</Text>
        </TouchableOpacity>
      ) : null}

      {!isFriend && hasOutgoingRequest && !isCurrentUser && !isCurrentUserCreator && onCancelFriend ? (
        <TouchableOpacity
          style={[globalStyles.outlineButtonGold, globalStyles.actionButton, globalStyles.groupActionIconButton, globalStyles.actionButtonDanger]}
          onPress={() => onCancelFriend(item)}
          disabled={sendingFriendRequest}
        >
          <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionButtonText, globalStyles.actionButtonDangerText]}>Angre</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default MemberRow;

