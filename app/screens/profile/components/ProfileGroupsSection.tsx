import React, { useState } from 'react';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { profileScreenTokens, profileStyles } from '../../../styles/components/profileStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import type { Group } from '../../../types/drinkTypes';
import type { Friend } from '../../../types/userTypes';
import { INPUT_LIMITS, normalizeSingleLineText } from '../../../utils/inputValidation';

type ProfileGroupsSectionProps = {
  groups: Group[];
  creatingGroup: boolean;
  createGroupModalVisible: boolean;
  onOpenCreateGroupModal: () => void;
  onCloseCreateGroupModal: () => void;
  onCreateGroup: () => void;
  onNavigateToGroup: (group: Group) => void;
  createGroupName: string;
  setCreateGroupName: (value: string) => void;
  groupInviteCandidates: Friend[];
  loadingGroupInviteCandidates: boolean;
  selectedInviteeIds: string[];
  onToggleInvitee: (friendId: string) => void;
  onSelectAllInvitees: () => void;
  onClearInvitees: () => void;
};

const ProfileGroupsSection = ({
  groups,
  creatingGroup,
  createGroupModalVisible,
  onOpenCreateGroupModal,
  onCloseCreateGroupModal,
  onCreateGroup,
  onNavigateToGroup,
  createGroupName,
  setCreateGroupName,
  groupInviteCandidates,
  loadingGroupInviteCandidates,
  selectedInviteeIds,
  onToggleInvitee,
  onSelectAllInvitees,
  onClearInvitees,
}: ProfileGroupsSectionProps) => {
  const [nameFocused, setNameFocused] = useState(false);
  const canSubmitCreateGroup = !creatingGroup && normalizeSingleLineText(createGroupName).length > 0;

  return (
    <View style={profileStyles.groupsSection}>
      <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
        <View style={profileStyles.groupsHeaderAction}>
          <Text style={globalStyles.sectionTitleLeft}>Mine grupper</Text>
          <TouchableOpacity
            style={[globalStyles.outlineButton, profileStyles.groupsHeaderActionButton]}
            onPress={onOpenCreateGroupModal}
            disabled={creatingGroup}
          >
            <Text
              style={[globalStyles.outlineButtonGoldText, profileStyles.groupsHeaderActionButtonText]}
              numberOfLines={1}
            >
              {creatingGroup ? 'Oppretter...' : 'Opprett ny gruppe'}
            </Text>
          </TouchableOpacity>
        </View>
        <View>
          {Array.from({ length: Math.ceil(groups.length / 2) }, (_, rowIndex) => {
            const rowItems = groups.slice(rowIndex * 2, rowIndex * 2 + 2);
            return (
              <View key={`group-row-${rowIndex}`} style={profileStyles.groupRow}>
                {rowItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={profileStyles.groupItem}
                    onPress={() => onNavigateToGroup(item)}
                  >
                    <Image source={item.image} style={globalStyles.groupHeaderImage} />
                    <View style={globalStyles.overlay}>
                      <Text style={profileStyles.groupName}>{item.name}</Text>
                      <Text style={profileStyles.groupMembers}>{item.memberCount} medlemmer</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {rowItems.length === 1 && <View style={profileStyles.groupRowSpacer} />}
              </View>
            );
          })}
        </View>
      </View>
      <Modal
        visible={createGroupModalVisible}
        animationType="slide"
        transparent
        onRequestClose={onCloseCreateGroupModal}
      >
        <View style={globalStyles.modalContainer}>
          <View style={[globalStyles.modalContent, profileStyles.createGroupModalContent]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: theme.spacing.sm }}
            >
              <Text style={globalStyles.modalTitle}>Opprett gruppe</Text>
              <Text style={[globalStyles.mutedText, { marginBottom: theme.spacing.sm }]}>Kun personen som oppretter gruppen kan laste opp gruppebilde, fjerne medlemmer og slette gruppen</Text>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Gruppenavn</Text>
                <View style={[globalStyles.inputShellDark, globalStyles.itemInfo, nameFocused && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    placeholder="Velg et gruppenavn"
                    placeholderTextColor={profileScreenTokens.createGroupPlaceholderTextColor}
                    value={createGroupName}
                    onChangeText={(text) => setCreateGroupName(text.slice(0, INPUT_LIMITS.groupNameMax))}
                    style={[globalStyles.input, globalStyles.createGroupInput]}
                    maxLength={INPUT_LIMITS.groupNameMax}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                </View>
              </View>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Inviter venner</Text>
                {loadingGroupInviteCandidates ? (
                  <Text style={globalStyles.secondaryText}>Laster venner...</Text>
                ) : groupInviteCandidates.length === 0 ? (
                  <Text style={globalStyles.secondaryText}>Du har ingen venner å invitere enda.</Text>
                ) : (
                  <View>
                    <View style={profileStyles.inviteBulkActionsRow}>
                      <TouchableOpacity onPress={onSelectAllInvitees}>
                        <Text style={profileStyles.inviteBulkActionText}>Velg alle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={onClearInvitees}>
                        <Text style={profileStyles.inviteBulkActionText}>Fjern alle</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={profileStyles.inviteListBox}>
                      <ScrollView nestedScrollEnabled style={profileStyles.inviteListScroll} contentContainerStyle={globalStyles.listScrollContent}>
                        {groupInviteCandidates.map((friend) => {
                          const selected = selectedInviteeIds.includes(friend.id);
                          return (
                            <TouchableOpacity
                              key={friend.id}
                              style={[profileStyles.inviteListRow, selected && profileStyles.inviteListRowSelected]}
                              onPress={() => onToggleInvitee(friend.id)}
                            >
                              <Image source={friend.profilePicture} style={profileStyles.inviteListAvatar} />
                              <View style={globalStyles.itemInfo}>
                                <Text style={profileStyles.inviteListName}>{friend.name}</Text>
                                <Text style={globalStyles.secondaryText}>@{friend.username}</Text>
                              </View>
                              <Text style={[profileStyles.inviteStatusText, selected && globalStyles.primaryColorText]}>
                                {selected ? 'Inviteres' : 'Trykk for å invitere'}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
            <View style={[globalStyles.editButtonsContainer, globalStyles.modalFooter]}>
              <TouchableOpacity onPress={onCloseCreateGroupModal}>
                <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onCreateGroup}
                disabled={!canSubmitCreateGroup}
                style={!canSubmitCreateGroup ? globalStyles.disabledButton : undefined}
              >
                <Text style={[globalStyles.saveButtonText, !canSubmitCreateGroup && globalStyles.disabledGoldActionText]}>
                  {creatingGroup ? 'Oppretter...' : 'Opprett'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileGroupsSection;
