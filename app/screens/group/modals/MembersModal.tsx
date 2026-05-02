import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import type { Friend } from '../../../types/userTypes';

type MembersModalProps = {
  availableFriends: Friend[];
  memberData: Friend[];
  membersLoading: boolean;
  renderFriendItem: (args: { item: Friend }) => React.ReactNode;
  renderMemberItem: (args: { item: Friend }) => React.ReactNode;
  selectedGroupName?: string;
  setMembersModalVisible: (visible: boolean) => void;
  shouldScrollAvailableFriends: boolean;
  shouldScrollMembers: boolean;
  visible: boolean;
};

const MembersModal = ({
  availableFriends,
  memberData,
  membersLoading,
  renderFriendItem,
  renderMemberItem,
  selectedGroupName,
  setMembersModalVisible,
  shouldScrollAvailableFriends,
  shouldScrollMembers,
  visible,
}: MembersModalProps) => {
  if (!visible) return null;

  return (
    <View style={globalStyles.modalContainer}>
      <View style={[globalStyles.modalContent, groupStyles.modalContentLarge]}>
        <ScrollView contentContainerStyle={groupStyles.modalScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[globalStyles.modalTitle, { marginBottom: theme.spacing.md, fontSize: 18, fontWeight: '600', color: theme.colors.text }]}>
            Medlemmer i {selectedGroupName}
          </Text>

          <View style={{ marginBottom: theme.spacing.md }}>
            <Text style={[globalStyles.sectionTitleLeft, { fontSize: 16, marginBottom: theme.spacing.sm }]}>Medlemmer</Text>
            {membersLoading ? (
              <Text style={groupStyles.modalLoadingText}>Laster...</Text>
            ) : memberData.length > 0 ? (
              <View style={globalStyles.listContainer}>
                <ScrollView
                  style={shouldScrollMembers ? groupStyles.scrollableListWrap : undefined}
                  nestedScrollEnabled={shouldScrollMembers}
                  showsVerticalScrollIndicator={shouldScrollMembers}
                >
                  {memberData.map((member) => (
                    <View key={member.id}>{renderMemberItem({ item: member })}</View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <Text style={[globalStyles.emptyStateText, { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginVertical: theme.spacing.md }]}>
                Ingen medlemmer i gruppen
              </Text>
            )}
          </View>

          <View>
            <Text style={[globalStyles.sectionTitleLeft, { fontSize: 16, marginBottom: theme.spacing.sm }]}>Inviter venner</Text>
            {membersLoading ? (
              <Text style={groupStyles.modalLoadingText}>Laster...</Text>
            ) : availableFriends.length === 0 ? (
              <Text style={[globalStyles.secondaryText, { textAlign: 'center', paddingVertical: theme.spacing.md }]}>
                Ingen flere å invitere
              </Text>
            ) : (
              <View style={globalStyles.listContainer}>
                <ScrollView
                  style={shouldScrollAvailableFriends ? groupStyles.scrollableListWrap : undefined}
                  nestedScrollEnabled={shouldScrollAvailableFriends}
                  showsVerticalScrollIndicator={shouldScrollAvailableFriends}
                >
                  {availableFriends.map((friend) => (
                    <View key={friend.id}>{renderFriendItem({ item: friend })}</View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[globalStyles.editButtonsContainer, globalStyles.modalFooter]}>
          <TouchableOpacity onPress={() => setMembersModalVisible(false)}>
            <Text style={[globalStyles.cancelButtonText, { fontSize: 16, color: theme.colors.primary }]}>Lukk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default MembersModal;

