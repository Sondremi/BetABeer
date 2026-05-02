import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { profileStyles } from '../../../styles/components/profileStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { GroupInvitation } from '../../../types/drinkTypes';

type ProfileGroupInvitationsSectionProps = {
  invitations: GroupInvitation[];
  userNames: Record<string, string>;
  handlingInvitation: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onAcceptInvitation: (invitation: GroupInvitation) => void;
  onRejectInvitation: (invitation: GroupInvitation) => void;
};

const ProfileGroupInvitationsSection = ({
  invitations,
  userNames,
  handlingInvitation,
  isExpanded,
  onToggleExpanded,
  onAcceptInvitation,
  onRejectInvitation,
}: ProfileGroupInvitationsSectionProps) => (
  <View style={[globalStyles.section, profileStyles.compactSection]}>
    <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
      <View style={[profileStyles.groupsHeader, !isExpanded && globalStyles.collapsedHeaderRow]}>
        <Text style={globalStyles.sectionTitleLeft}>Gruppeinvitasjoner</Text>
        <TouchableOpacity
          style={[globalStyles.outlineButtonGold, globalStyles.sectionToggleIconButton]}
          onPress={onToggleExpanded}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Minimer gruppeinvitasjoner' : 'Utvid gruppeinvitasjoner'}
        >
          <Text style={[globalStyles.outlineButtonGoldText, globalStyles.sectionToggleIconButtonText]}>
            {isExpanded ? '▾' : '▸'}
          </Text>
        </TouchableOpacity>
      </View>
      {isExpanded && invitations.length > 0 ? (
        <View style={[globalStyles.listContainer, profileStyles.listContainerCard]}>
          {invitations.map((item) => (
            <View key={`${item.id}_${item.groupId}`} style={globalStyles.distributionChoiceBlock}>
              <View style={[globalStyles.listItemRow, profileStyles.invitationItemRow]}>
                <View style={profileStyles.invitationInfo}>
                  <Text style={globalStyles.modalText}>{item.groupName}</Text>
                  <Text style={globalStyles.secondaryText}>Fra: {userNames[item.fromUserId] || item.fromUserId}</Text>
                </View>
                <View style={globalStyles.groupHeaderActions}>
                  <TouchableOpacity
                    style={[globalStyles.selectionButton, globalStyles.destructiveButtonModal, globalStyles.podiumCardSecondOffset]}
                    onPress={() => onRejectInvitation(item)}
                    disabled={handlingInvitation}
                  >
                    <Text style={[globalStyles.selectionButtonText, globalStyles.selectionButtonTextSelected]}>Avslå</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[globalStyles.selectionButton, globalStyles.podiumCardSecondOffset]}
                    onPress={() => onAcceptInvitation(item)}
                    disabled={handlingInvitation}
                  >
                    <Text style={globalStyles.outlineButtonGoldText}>Godta</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : isExpanded ? (
        <Text style={globalStyles.emptyStateText}>Ingen invitasjoner</Text>
      ) : null}
    </View>
  </View>
);

export default ProfileGroupInvitationsSection;
