import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { friendsStyles } from '../../../styles/components/friendsStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { Friend } from '../../../types/userTypes';
import type { FriendSuggestion } from '../hooks/useFriendSuggestions';
import FriendSuggestionRow from './FriendSuggestionRow';
import SectionHeader from './SectionHeader';

type FriendSuggestionsSectionProps = {
  friendSuggestions: FriendSuggestion[];
  isExpanded: boolean;
  suggestionsLoading: boolean;
  onAddFriend: (friend: Friend) => void;
  onToggleExpanded: () => void;
  peopleIcon: any;
};

const FriendSuggestionsSection = ({
  friendSuggestions,
  isExpanded,
  suggestionsLoading,
  onAddFriend,
  onToggleExpanded,
  peopleIcon,
}: FriendSuggestionsSectionProps) => {
  return (
    <View style={[globalStyles.section, friendsStyles.compactSection]}>
      <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
        <SectionHeader
          collapsedHeader={!isExpanded}
          expanded={isExpanded}
          title={`Venner av venner (${friendSuggestions.length})`}
          onToggle={onToggleExpanded}
          collapseA11yLabel="Minimer venner av venner"
          expandA11yLabel="Utvid venner av venner"
        />

        {isExpanded && suggestionsLoading ? (
          <Text style={globalStyles.secondaryText}>Laster forslag...</Text>
        ) : isExpanded && friendSuggestions.length > 0 ? (
          <View>
            <View style={[globalStyles.warmListPanel, friendsStyles.listScrollBox]}>
              <ScrollView nestedScrollEnabled contentContainerStyle={globalStyles.listScrollContent}>
                {friendSuggestions.map((item) => (
                  <View key={item.id}>
                    <FriendSuggestionRow item={item} onAddFriend={onAddFriend} />
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : isExpanded ? (
          <View style={globalStyles.emptyState}>
            <Image source={peopleIcon} style={globalStyles.primaryIcon} />
            <Text style={globalStyles.emptyStateText}>Ingen forslag akkurat nå</Text>
            <Text style={globalStyles.emptyStateSubtext}>
              Forslag vises når venner du har til sammen peker på samme person.
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default FriendSuggestionsSection;
