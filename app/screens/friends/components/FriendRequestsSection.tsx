import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { friendsStyles } from '../../../styles/components/friendsStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { FriendRequest } from '../../../types/userTypes';
import IncomingRequestRow from './IncomingRequestRow';
import SectionHeader from './SectionHeader';

type FriendRequestsSectionProps = {
  addFriendIcon: any;
  incomingRequests: FriendRequest[];
  isExpanded: boolean;
  onAcceptRequest: (request: FriendRequest) => void;
  onDeclineRequest: (request: FriendRequest) => void;
  onToggleExpanded: () => void;
};

const FriendRequestsSection = ({
  addFriendIcon,
  incomingRequests,
  isExpanded,
  onAcceptRequest,
  onDeclineRequest,
  onToggleExpanded,
}: FriendRequestsSectionProps) => {
  return (
    <View style={[globalStyles.section, friendsStyles.compactSection]}>
      <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
        <SectionHeader
          collapsedHeader={!isExpanded}
          expanded={isExpanded}
          title={`Venneforespørsler (${incomingRequests.length})`}
          onToggle={onToggleExpanded}
          collapseA11yLabel="Minimer venneforespørsler"
          expandA11yLabel="Utvid venneforespørsler"
        />

        {isExpanded && incomingRequests.length > 0 ? (
          <View>
            <View style={[globalStyles.warmListPanel, friendsStyles.listScrollBox]}>
              <ScrollView nestedScrollEnabled contentContainerStyle={globalStyles.listScrollContent}>
                {incomingRequests.map((item) => (
                  <View key={item.id}>
                    <IncomingRequestRow
                      item={item}
                      onAccept={onAcceptRequest}
                      onDecline={onDeclineRequest}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : isExpanded ? (
          <View style={globalStyles.emptyState}>
            <Image source={addFriendIcon} style={globalStyles.primaryIcon} />
            <Text style={globalStyles.emptyStateText}>Ingen forespørsler</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default FriendRequestsSection;
