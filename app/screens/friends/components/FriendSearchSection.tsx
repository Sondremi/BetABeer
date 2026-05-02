import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { friendsScreenTokens, friendsStyles } from '../../../styles/components/friendsStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { Friend } from '../../../types/userTypes';
import { INPUT_LIMITS } from '../../../utils/inputValidation';
import SearchResultRow from './SearchResultRow';

type FriendSearchSectionProps = {
  onAddFriend: (friend: Friend) => void;
  onPerformSearch: (searchTerm: string) => void;
  searchFocused: boolean;
  searchResults: Friend[];
  searchTerm: string;
  setSearchFocused: (focused: boolean) => void;
  setSearchTerm: (value: string) => void;
};

const FriendSearchSection = ({
  onAddFriend,
  onPerformSearch,
  searchFocused,
  searchResults,
  searchTerm,
  setSearchFocused,
  setSearchTerm,
}: FriendSearchSectionProps) => {
  return (
    <View style={[globalStyles.section, friendsStyles.compactSection]}>
      <View style={[globalStyles.premiumCard, globalStyles.sectionCard]}>
        <Text style={globalStyles.sectionTitle}>Søk etter venner</Text>
        <View style={friendsStyles.searchRow}>
          <View style={[globalStyles.inputShellDark, globalStyles.searchInputShell, searchFocused && globalStyles.inputShellFocusedGold]}>
            <TextInput
              placeholder="Skriv inn brukernavn"
              placeholderTextColor={friendsScreenTokens.searchPlaceholderTextColor}
              value={searchTerm}
              onChangeText={(text) => setSearchTerm(text.slice(0, INPUT_LIMITS.friendSearchMax))}
              autoCapitalize="none"
              style={friendsStyles.searchInput}
              maxLength={INPUT_LIMITS.friendSearchMax}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </View>
        </View>

        {searchResults.length > 0 && (
          <View style={globalStyles.warmListPanel}>
            {searchResults.map((item) => (
              <View key={item.id}>
                <SearchResultRow item={item} onAddFriend={onAddFriend} />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default FriendSearchSection;
