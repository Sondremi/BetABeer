import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { firestore } from '../../../services/firebase/FirebaseConfig';
import { cancelGroupInvitation, removeFriendFromGroup, sendGroupInvitation } from '../../../services/groupService';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import { Group } from '../../../types/drinkTypes';
import { Friend } from '../../../types/userTypes';
import { getDefaultProfilePicture, resolveProfileImageSource } from '../../../utils/profileImage';
import MemberRow from './MemberRow';
import { useFriendActions } from '../hooks/useFriendActions';
import { buildGroupInviteLink } from '../../../services/groupInviteLinkService';

const DefaultProfilePicture = getDefaultProfilePicture();

type SentGroupInvitation = {
  id: string;
  toUserId: string;
};

const GroupMembersScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [memberData, setMemberData] = useState<Friend[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sentGroupInvitations, setSentGroupInvitations] = useState<SentGroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const {
    incomingFriendRequests,
    pendingFriendRequests,
    refreshPendingRequests,
    sendingFriendRequest,
    handleAcceptIncomingFriendRequest,
    handleCancelPendingFriendRequest,
    handleSendFriendRequest,
  } = useFriendActions({ userId: user?.id });

  const availableFriends = useMemo(() => {
    if (!group) return [];
    return friends.filter((friend) => !group.members.includes(friend.id));
  }, [friends, group]);

  const parseGroupParam = useCallback(() => {
    const raw = params.selectedGroup;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as Group;
      } catch (error) {
        console.error('Failed to parse selected group param:', error);
      }
    }
    return null;
  }, [params.selectedGroup]);

  const refreshMemberData = useCallback(async (nextGroup: Group) => {
    const members = await Promise.all(
      nextGroup.members.map(async (memberId) => {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', memberId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          return {
            id: memberId,
            name: userData?.name || 'Ukjent',
            username: userData?.username || 'ukjent',
            profilePicture: resolveProfileImageSource(userData?.profileImage || null, DefaultProfilePicture),
          } as Friend;
        } catch (error) {
          console.error(`Error fetching member ${memberId}:`, error);
          return {
            id: memberId,
            name: 'Ukjent',
            username: 'ukjent',
            profilePicture: DefaultProfilePicture,
          } as Friend;
        }
      })
    );
    setMemberData(members.sort((a, b) => a.username.localeCompare(b.username)));
  }, []);

  const refreshFriends = useCallback(async () => {
    if (!user?.id) return;
    const userSnap = await getDoc(doc(firestore, 'users', user.id));
    const friendIds = userSnap.exists() ? ((userSnap.data().friends || []) as string[]) : [];
    const friendSnaps = await Promise.all(friendIds.map((friendId) => getDoc(doc(firestore, 'users', friendId))));
    const nextFriends = friendSnaps
      .filter((friendDoc) => friendDoc.exists())
      .map((friendDoc) => {
        const friendData = friendDoc.data();
        return {
          id: friendDoc.id,
          name: friendData?.name || 'Ukjent',
          username: friendData?.username || 'ukjent',
          profilePicture: resolveProfileImageSource(friendData?.profileImage || null, DefaultProfilePicture),
        } as Friend;
      })
      .sort((a, b) => a.username.localeCompare(b.username));
    setFriends(nextFriends);
  }, [user?.id]);

  const refreshSentInvites = useCallback(async (groupId: string) => {
    if (!user?.id) return;
    const sentInvitationQuery = query(
      collection(firestore, 'group_invitations'),
      where('fromUserId', '==', user.id),
      where('groupId', '==', groupId),
      where('status', '==', 'pending')
    );
    const sentInvitationSnapshot = await getDocs(sentInvitationQuery);
    const pendingInvitations = sentInvitationSnapshot.docs
      .map((docSnap) => {
        const toUserId = docSnap.data().toUserId;
        if (typeof toUserId !== 'string') return null;
        return { id: docSnap.id, toUserId } as SentGroupInvitation;
      })
      .filter((invitation): invitation is SentGroupInvitation => Boolean(invitation));
    setSentGroupInvitations(pendingInvitations);
  }, [user?.id]);

  const loadAll = useCallback(async () => {
    const parsedGroup = parseGroupParam();
    if (!parsedGroup) {
      setLoading(false);
      return;
    }
    setGroup(parsedGroup);
    setLoading(true);
    try {
      await Promise.all([
        refreshMemberData(parsedGroup),
        refreshFriends(),
        refreshPendingRequests(),
        refreshSentInvites(parsedGroup.id),
      ]);
    } finally {
      setLoading(false);
    }
  }, [parseGroupParam, refreshFriends, refreshMemberData, refreshPendingRequests, refreshSentInvites]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const navigateBackToGroup = () => {
    if (!group) {
      router.replace('/groups');
      return;
    }
    router.replace({ pathname: '/groups', params: { selectedGroup: JSON.stringify(group) } });
  };

  const handleShareGroupInviteLink = async () => {
    if (!group) return;
    try {
      const inviteLink = buildGroupInviteLink(group.id);
      await Share.share({
        title: 'Inviter til gruppe',
        message: `Bli med i gruppen "${group.name}" på BetABeer: ${inviteLink}`,
      });
    } catch (error) {
      console.warn('Share group invite link was cancelled or unavailable:', error);
    }
  };

  const handleRemoveMember = async (member: Friend) => {
    if (!group || !user?.id) return;
    const isCurrentUserCreator = user.id === group.createdBy;
    if (!isCurrentUserCreator || member.id === user.id || member.id === group.createdBy) return;
    try {
      await removeFriendFromGroup(member.id, group.id);
      const updatedGroup = { ...group, members: group.members.filter((id) => id !== member.id), memberCount: Math.max(0, group.memberCount - 1) };
      setGroup(updatedGroup);
      await refreshMemberData(updatedGroup);
    } catch (error) {
      console.error('Error removing friend from group:', error);
    }
  };

  const handleInviteFriend = async (friend: Friend) => {
    if (!group) return;
    setInviting(true);
    try {
      await sendGroupInvitation(friend.id, group);
      await refreshSentInvites(group.id);
    } catch (error) {
      console.error('Error inviting friend to group:', error);
    } finally {
      setInviting(false);
    }
  };

  const handleCancelSentGroupInvitation = async (friend: Friend) => {
    if (!group) return;
    const invitation = sentGroupInvitations.find((item) => item.toUserId === friend.id);
    if (!invitation) return;
    setInviting(true);
    try {
      await cancelGroupInvitation(invitation.id);
      await refreshSentInvites(group.id);
    } catch (error) {
      console.error('Error cancelling group invitation:', error);
    } finally {
      setInviting(false);
    }
  };

  return (
    <View style={globalStyles.containerWeb}>
      <View style={groupStyles.groupMembersHeaderBar}>
        <TouchableOpacity onPress={navigateBackToGroup} style={groupStyles.heroImageBackButton}>
          <Text style={globalStyles.iconBackButtonText}>←</Text>
        </TouchableOpacity>
        <View style={groupStyles.groupMembersHeaderTitleWrap}>
          <Text style={groupStyles.groupHeaderName}>{group?.name || 'Gruppe'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[globalStyles.fullWidthScrollContent, groupStyles.pageScrollContent]} showsVerticalScrollIndicator={false}>
        <View style={groupStyles.actionCard}>
          <TouchableOpacity style={[globalStyles.outlineButtonGold, groupStyles.actionGridButton]} onPress={handleShareGroupInviteLink} disabled={!group}>
            <Text style={[globalStyles.outlineButtonGoldText, globalStyles.actionGridButtonText]}>Inviter med lenke</Text>
          </TouchableOpacity>
        </View>

        <View style={groupStyles.actionCard}>
          <Text style={[globalStyles.sectionTitleLeft, { marginBottom: theme.spacing.sm }]}>Medlemmer</Text>
          {loading ? (
            <Text style={groupStyles.modalLoadingText}>Laster...</Text>
          ) : memberData.length > 0 ? (
            <View style={globalStyles.listContainer}>
              {memberData.map((member) => {
                const isCreator = group?.createdBy === member.id;
                const isCurrentUserCreator = user?.id === group?.createdBy;
                const isCurrentUser = user?.id === member.id;
                const isFriend = friends.some((friend) => friend.id === member.id);
                const hasOutgoingRequest = pendingFriendRequests.some((request) => request.toUserId === member.id);
                const hasIncomingRequest = incomingFriendRequests.some((request) => request.fromUserId === member.id);

                return (
                  <MemberRow
                    key={member.id}
                    item={member}
                    isCreator={Boolean(isCreator)}
                    isCurrentUser={Boolean(isCurrentUser)}
                    isCurrentUserCreator={Boolean(isCurrentUserCreator)}
                    isFriend={isFriend}
                    hasOutgoingRequest={hasOutgoingRequest}
                    hasIncomingRequest={hasIncomingRequest}
                    sendingFriendRequest={sendingFriendRequest}
                    inviting={inviting}
                    onRemoveMember={handleRemoveMember}
                    onAddFriend={handleSendFriendRequest}
                    onAcceptFriend={handleAcceptIncomingFriendRequest}
                    onCancelFriend={handleCancelPendingFriendRequest}
                  />
                );
              })}
            </View>
          ) : (
            <Text style={[globalStyles.secondaryText, { textAlign: 'center' }]}>Ingen medlemmer i gruppen</Text>
          )}
        </View>

        <View style={groupStyles.actionCard}>
          <Text style={[globalStyles.sectionTitleLeft, { marginBottom: theme.spacing.sm }]}>Inviter venner</Text>
          {loading ? (
            <Text style={groupStyles.modalLoadingText}>Laster...</Text>
          ) : availableFriends.length > 0 ? (
            <View style={globalStyles.listContainer}>
              {availableFriends.map((friend) => {
                const invitationSent = sentGroupInvitations.some((item) => item.toUserId === friend.id);
                return (
                  <View key={friend.id} style={groupStyles.memberRow}>
                    <Image source={friend.profilePicture} style={[globalStyles.circularImage, groupStyles.memberAvatar]} />
                    <View style={groupStyles.memberMeta}>
                      <Text style={[groupStyles.wagerUser, groupStyles.memberName]}>{friend.name}</Text>
                      <Text style={[globalStyles.secondaryText, groupStyles.memberUsername]}>@{friend.username}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        globalStyles.outlineButtonGold,
                        globalStyles.actionButton,
                        invitationSent && globalStyles.actionButtonDanger,
                      ]}
                      onPress={() => (invitationSent ? handleCancelSentGroupInvitation(friend) : handleInviteFriend(friend))}
                      disabled={inviting}
                    >
                      <Text
                        style={[
                          globalStyles.outlineButtonGoldText,
                          globalStyles.actionButtonText,
                          invitationSent && globalStyles.actionButtonDangerText,
                        ]}
                      >
                        {invitationSent ? 'Angre' : 'Inviter'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={[globalStyles.secondaryText, { textAlign: 'center' }]}>Ingen flere å invitere</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default GroupMembersScreen;

