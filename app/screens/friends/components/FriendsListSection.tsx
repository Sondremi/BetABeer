import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { friendsStyles } from '../../../styles/components/friendsStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { FriendWithPending } from '../../../types/userTypes';
import FriendListRow from './FriendListRow';
import SectionHeader from './SectionHeader';

type FriendsListSectionProps = {
  friends: FriendWithPending[];
  isExpanded: boolean;
  onRemoveFriend: (friend: FriendWithPending) => void;
  onToggleExpanded: () => void;
  peopleIcon: any;
};

const FriendsListSection = ({
  friends,
  isExpanded,
  onRemoveFriend,
  onToggleExpanded,
  peopleIcon,
}: FriendsListSectionProps) => {
  return (
    <View style={[globalStyles.section, friendsStyles.compactSection]}>
      <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
        <SectionHeader
          collapsedHeader={!isExpanded}
          expanded={isExpanded}
          title={`Mine venner (${friends.length})`}
          onToggle={onToggleExpanded}
          collapseA11yLabel="Minimer venner"
          expandA11yLabel="Utvid venner"
        />

        {isExpanded && friends.length > 0 ? (
          <View>
            <View style={[globalStyles.warmListPanel, friendsStyles.listScrollBox]}>
              <ScrollView nestedScrollEnabled contentContainerStyle={globalStyles.listScrollContent}>
                {friends.map((item) => (
                  <View key={item.id + (item.type === 'pending' ? '-pending' : '')}>
                    <FriendListRow item={item} onRemove={onRemoveFriend} />
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : isExpanded ? (
          <View style={globalStyles.emptyState}>
            <Image source={peopleIcon} style={globalStyles.primaryIcon} />
            <Text style={globalStyles.emptyStateText}>Du har ingen venner enda</Text>
            <Text style={globalStyles.emptyStateSubtext}>Bruk søkefeltet over for å finne venner</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default FriendsListSection;
