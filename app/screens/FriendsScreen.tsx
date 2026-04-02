import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../services/firebase/FirebaseConfig';
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest, friendSearch, getIncomingRequest, getOutgoingRequest, listenToIncomingRequests, listenToOutgoingRequests, removeFriend, sendFriendRequest } from '../services/friendService';
import { friendsScreenTokens, friendsStyles } from '../styles/components/friendsStyles';
import { globalStyles } from '../styles/globalStyles';
import { Friend, FriendRequest, FriendWithPending } from '../types/userTypes';
import { INPUT_LIMITS, normalizeSingleLineText } from '../utils/inputValidation';
import { showAlert } from '../utils/platformAlert';
import { getDefaultProfilePicture, resolveProfileImageSource } from '../utils/profileImage';

const DefaultProfilePicture = getDefaultProfilePicture();
const AddFriendIcon = require('../../assets/icons/noun-add-user-7539314.png');
const PeopleIcon = require('../../assets/icons/noun-people-2196504.png');

const FriendsScreen = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendWithPending[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isFriendsExpanded, setIsFriendsExpanded] = useState(true);
  const [isRequestsExpanded, setIsRequestsExpanded] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user?.id) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }

    const loadInitialRequests = async () => {
      try {
        const [incoming, outgoing] = await Promise.all([
          getIncomingRequest(user.id),
          getOutgoingRequest(user.id),
        ]);
        setIncomingRequests(incoming);
        setOutgoingRequests(outgoing);
      } catch (error) {
        console.error('Failed to load initial friend requests:', error);
      }
    };

    loadInitialRequests();

    const unsubIncoming = listenToIncomingRequests(user.id, setIncomingRequests);
    const unsubOutgoing = listenToOutgoingRequests(user.id, setOutgoingRequests);
    return () => {
      if (typeof unsubIncoming === 'function') unsubIncoming();
      if (typeof unsubOutgoing === 'function') unsubOutgoing();
    };
  }, [loading, user?.id]);

  const fetchFriends = useCallback(async () => {
    if (!user?.id) {
      setFriends([]);
      return;
    }

    try {
      const userDocRef = doc(firestore, 'users', user.id);
      const userDoc = await getDoc(userDocRef);
      const friendIds = userDoc.exists() ? userDoc.data().friends || [] : [];

      const friendDocs = await Promise.all(
        friendIds.map((id: string) => getDoc(doc(firestore, 'users', id)))
      );
      const friendsData: FriendWithPending[] = friendDocs
        .filter((doc) => doc.exists())
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'Ukjent',
          username: doc.data().username || 'ukjent',
          profilePicture: doc.data().profileImage ? 
            resolveProfileImageSource(doc.data().profileImage, DefaultProfilePicture)
            : DefaultProfilePicture,
          type: 'friend' as const,
        }));

      const pendingFriends: FriendWithPending[] = outgoingRequests.map((req) => ({
        id: req.toUserId,
        name: req.name || 'Ukjent',
        username: req.username || 'ukjent',
        profilePicture: req.profilePicture || DefaultProfilePicture,
        type: 'pending' as const,
        requestId: req.id,
      })).filter((pending) => !friendsData.some((f) => f.id === pending.id));

      const allFriends = [...pendingFriends, ...friendsData].sort((a, b) => a.name.localeCompare(b.name));
      setFriends(allFriends);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      showAlert('Feil', `Kunne ikke hente venner: ${(error as Error).message}`);
    }
  }, [outgoingRequests, user?.id]);

  useEffect(() => {
    if (loading) return;
    fetchFriends();
  }, [fetchFriends, loading]);

  const performSearch = useCallback(async (term: string) => {
    const normalizedTerm = normalizeSingleLineText(term);
    if (!normalizedTerm) {
      setSearchResults([]);
      return;
    }
    if (normalizedTerm.length > INPUT_LIMITS.friendSearchMax) {
      showAlert('Feil', `Søket er for langt (maks ${INPUT_LIMITS.friendSearchMax} tegn).`);
      return;
    }
    try {
      const results = await friendSearch(normalizedTerm);
      const filteredResults = (results as Friend[]).filter(
        (result) => !friends.some((friend) => friend.id === result.id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error handling search: ', error);
      showAlert('Feil', `Kunne ikke søke ${(error as Error).message}`);
    }
  }, [friends]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      void performSearch(searchTerm);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm, performSearch]);

  const inviteLink = user?.id
    ? `http://bet-a-beer.netlify.app/login?inviter=${encodeURIComponent(user.id)}`
    : 'http://bet-a-beer.netlify.app/login';

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: `Bli med meg på BetABeer! Bruk denne linken: ${inviteLink}`,
        url: inviteLink,
        title: 'Inviter venner til BetABeer',
      });
    } catch (error) {
      console.warn('Share dialog closed or unavailable', error);
    }
  };

  const handleAddFriend = async (friend: Friend) => {
    if (!user?.id) {
      showAlert('Ikke logget inn!');
      return;
    }

    try {
      const result = await sendFriendRequest(friend.id);

      if (result.status === 'accepted') {
        setIncomingRequests((prev) => prev.filter((req) => req.fromUserId !== friend.id));
        showAlert('Suksess', `Du er nå venn med ${friend.name || friend.username || 'brukeren'}`);
        await fetchFriends();
      } else {
        setOutgoingRequests((prev) => [
          ...prev,
          {
            id: result.requestId,
            fromUserId: user.id,
            toUserId: friend.id,
            status: 'pending',
            createdAt: serverTimestamp(),
            name: friend.name || 'Ukjent',
            username: friend.username || 'ukjent',
            profilePicture: friend.profilePicture || DefaultProfilePicture,
          },
        ]);
      }
      setSearchResults([]);
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke sende venneforespørselen');
    }
  };

  const handleRemoveFriend = (friend: FriendWithPending) => {
    if (!user?.id) {
      showAlert("Ikke logget inn!");
      return;
    }

    if (friend.type === 'pending') {
      showAlert(
        'Avbryt forespørsel',
        `Vil du avbryte venneforespørselen til ${friend.name}?`,
        [
          { text: 'Avbryt', style: 'cancel' },
          {
            text: 'Avbryt forespørsel',
            style: 'destructive',
            onPress: async () => {
              if (!friend.requestId) return;
              try {
                await cancelFriendRequest(friend.requestId);
                setOutgoingRequests((prev) => prev.filter((req) => req.id !== friend.requestId));
              } catch (error) {
                console.error(error);
                showAlert('Feil', 'Kunne ikke avbryte forespørselen');
              }
            },
          },
        ]
      );
    } else {
      showAlert(
        'Fjern venn',
        `Er du sikker på at du vil fjerne ${friend.name} som venn?`,
        [
          { text: 'Avbryt', style: 'cancel' },
          {
            text: 'Fjern',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeFriend(user.id, friend.id);
                setFriends((prev) => prev.filter((f) => f.id !== friend.id));
              } catch (error) {
                console.error(error);
                showAlert('Feil', 'Kunne ikke fjerne venn');
              }
            },
          },
        ]
      );
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!user?.id) {
      showAlert('Ikke logget inn!');
      return;
    }

    try {
      await acceptFriendRequest(request.id, request.fromUserId, request.toUserId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));
      
      const userDocRef = doc(firestore, 'users', request.fromUserId);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      
      if (userDoc.exists() && userData) {
        setFriends((prev) => [
          ...prev,
          {
            id: request.fromUserId,
            name: userData.name || request.fromUserName || 'Ukjent',
            username: userData.username || request.fromUsername || 'ukjent',
            profilePicture: userData.profileImage ? 
              resolveProfileImageSource(userData.profileImage, DefaultProfilePicture)
              : request.fromUserProfileImage ?
                resolveProfileImageSource(request.fromUserProfileImage, DefaultProfilePicture)
                : DefaultProfilePicture,
            type: 'friend' as const,
          },
        ].sort((a, b) => a.name.localeCompare(b.name)));
      }
      fetchFriends();
    } catch(error) {
      console.error(error);
      showAlert('Feil', `Kunne ikke godta forespørselen: ${(error as Error).message}`);
    }
  };

  const handleDeclineRequest = async (request: FriendRequest) => {
    try {
      await declineFriendRequest(request.id);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch(error) {
      console.error(error);
      showAlert('Feil', `Feil med å avslå forespørsel: ${(error as Error).message}`);
    }
  };

  const handleBack = () => {
    router.replace('/profile');
  };

  const renderFriend = ({ item }: { item: FriendWithPending }) => (
    <View style={[globalStyles.listItemRow, friendsStyles.friendSpacing, friendsStyles.friendRow]}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, friendsStyles.friendImage]} />
      <View style={globalStyles.itemInfo}>
        <Text style={friendsStyles.friendName}>{item.name}</Text>
        <Text style={globalStyles.secondaryText}>@{item.username}</Text>
        {item.type === 'pending' && <Text style={friendsStyles.pendingText}>Forespørsel sendt</Text>}
      </View>
      <TouchableOpacity
        style={[globalStyles.outlineButtonGold, friendsStyles.actionButton, friendsStyles.actionButtonDanger]}
        onPress={() => handleRemoveFriend(item)}
      >
        <Text style={[globalStyles.outlineButtonGoldText, friendsStyles.actionButtonText, friendsStyles.actionButtonDangerText]}>
          Fjern
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={globalStyles.fullWidthScrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={[globalStyles.header, friendsStyles.headerRow]}>
          <TouchableOpacity style={globalStyles.iconBackButton} onPress={handleBack}>
            <Text style={globalStyles.iconBackButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={[globalStyles.headerTitle, friendsStyles.headerTitle]}>Venner</Text>
        </View>

        {/* Invite friends section */}
        <View style={[globalStyles.section, friendsStyles.compactSection]}>
          <View style={[globalStyles.premiumCard, globalStyles.premiumSectionCard]}>
            <TouchableOpacity style={globalStyles.outlineButtonGold} onPress={handleInviteFriends}>
              <Text style={globalStyles.outlineButtonGoldText}>Inviter venner</Text>
            </TouchableOpacity>
            <Text style={[globalStyles.sectionDescription, friendsStyles.inviteDescription]}>Del lenken med venner for å invitere dem til appen</Text>
          </View>
        </View>

        {/* Search Section */}
        <View style={[globalStyles.section, friendsStyles.compactSection]}>
          <View style={[globalStyles.premiumCard, globalStyles.premiumSectionCard]}>
            <Text style={globalStyles.sectionTitle}>Søk etter venner</Text>
            <View style={friendsStyles.searchRow}>
              <View style={[globalStyles.inputShellDark, friendsStyles.searchInputShell, searchFocused && globalStyles.inputShellFocusedGold]}>
                <TextInput
                  placeholder="Skriv inn brukernavn"
                  placeholderTextColor={friendsScreenTokens.searchPlaceholderTextColor}
                  value={searchTerm}
                  onChangeText={(text) => {
                    setSearchTerm(text.slice(0, INPUT_LIMITS.friendSearchMax));
                  }}
                  autoCapitalize="none"
                  style={friendsStyles.searchInput}
                  maxLength={INPUT_LIMITS.friendSearchMax}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  void performSearch(searchTerm);
                }}
                style={friendsStyles.searchButton}
              >
                <Text style={friendsStyles.searchButtonText}>Søk</Text>
              </TouchableOpacity>
            </View>
            {searchResults.length > 0 && (
              <View style={globalStyles.warmListPanel}>
                {searchResults.map((item) => (
                  <View style={[globalStyles.listItemRow, friendsStyles.friendSpacing, friendsStyles.friendRow]} key={item.id}>
                    <Image
                      source={item.profilePicture}
                      style={[globalStyles.circularImage, friendsStyles.friendImage]}
                    />
                    <View style={globalStyles.itemInfo}>
                      <Text style={friendsStyles.friendName}>{item.name}</Text>
                      <Text style={globalStyles.secondaryText}>@{item.username}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        globalStyles.outlineButtonGold,
                        friendsStyles.actionButton,
                      ]}
                      onPress={() => handleAddFriend(item)}
                    >
                      <Text style={[globalStyles.outlineButtonGoldText, friendsStyles.actionButtonText]}>
                        Legg til
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Friends section */}
        <View style={[globalStyles.section, friendsStyles.compactSection]}>
          <View style={[globalStyles.premiumCard, globalStyles.premiumSectionCard]}>
            <View style={[friendsStyles.sectionHeaderRow, !isFriendsExpanded && friendsStyles.collapsedHeaderRow]}>
              <Text style={globalStyles.sectionTitle}>Mine venner ({friends.length})</Text>
              <TouchableOpacity
                style={[globalStyles.outlineButtonGold, globalStyles.sectionToggleIconButton]}
                onPress={() => setIsFriendsExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={isFriendsExpanded ? 'Minimer venner' : 'Utvid venner'}
              >
                <Text style={[globalStyles.outlineButtonGoldText, globalStyles.sectionToggleIconButtonText]}>
                  {isFriendsExpanded ? '▾' : '▸'}
                </Text>
              </TouchableOpacity>
            </View>
            {isFriendsExpanded && friends.length > 0 ? (
              <View>
                <View style={[globalStyles.warmListPanel, friendsStyles.listScrollBox]}>
                  <ScrollView nestedScrollEnabled contentContainerStyle={friendsStyles.listScrollContent}>
                    {friends.map((item) => (
                      <View key={item.id + (item.type === 'pending' ? '-pending' : '')}>{renderFriend({ item })}</View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : isFriendsExpanded ? (
              <View style={globalStyles.emptyState}>
                <Image source={PeopleIcon} style={globalStyles.primaryIcon} />
                <Text style={globalStyles.emptyStateText}>Du har ingen venner enda</Text>
                <Text style={globalStyles.emptyStateSubtext}>Bruk søkefeltet over for å finne venner</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Friend Requests section */}
        <View style={[globalStyles.section, friendsStyles.compactSection]}>
          <View style={[globalStyles.premiumCard, globalStyles.premiumSectionCard]}>
            <View style={[friendsStyles.sectionHeaderRow, !isRequestsExpanded && friendsStyles.collapsedHeaderRow]}>
              <Text style={globalStyles.sectionTitle}>Venneforespørsler ({incomingRequests.length})</Text>
              <TouchableOpacity
                style={[globalStyles.outlineButtonGold, globalStyles.sectionToggleIconButton]}
                onPress={() => setIsRequestsExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={isRequestsExpanded ? 'Minimer venneforespørsler' : 'Utvid venneforespørsler'}
              >
                <Text style={[globalStyles.outlineButtonGoldText, globalStyles.sectionToggleIconButtonText]}>
                  {isRequestsExpanded ? '▾' : '▸'}
                </Text>
              </TouchableOpacity>
            </View>
            {isRequestsExpanded && incomingRequests.length > 0 ? (
              <View>
                <View style={[globalStyles.warmListPanel, friendsStyles.listScrollBox]}>
                  <ScrollView nestedScrollEnabled contentContainerStyle={friendsStyles.listScrollContent}>
                    {incomingRequests.map((item) => (
                      <View style={[globalStyles.listItemRow, friendsStyles.friendSpacing, friendsStyles.friendRow]} key={item.id}>
                        <Image
                          source={item.profilePicture}
                          style={[globalStyles.circularImage, friendsStyles.friendImage]}
                        />
                        <View style={globalStyles.itemInfo}>
                          <Text style={friendsStyles.friendName}>{item.name}</Text>
                          <Text style={globalStyles.secondaryText}>@{item.username}</Text>
                        </View>
                        <View style={friendsStyles.requestActionRow}>
                          <TouchableOpacity
                            style={[
                              globalStyles.outlineButtonGold,
                              friendsStyles.actionButton,
                              friendsStyles.actionButtonDanger,
                            ]}
                            onPress={() => handleDeclineRequest(item)}
                          >
                            <Text style={[globalStyles.outlineButtonGoldText, friendsStyles.actionButtonText, friendsStyles.actionButtonDangerText]}>
                              Fjern
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              globalStyles.outlineButtonGold,
                              friendsStyles.actionButton,
                            ]}
                            onPress={() => handleAcceptRequest(item)}
                          >
                            <Text style={[globalStyles.outlineButtonGoldText, friendsStyles.actionButtonText]}>
                              Godta
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : isRequestsExpanded ? (
              <View style={globalStyles.emptyState}>
                <Image source={AddFriendIcon} style={globalStyles.primaryIcon} />
                <Text style={globalStyles.emptyStateText}>Ingen forespørsler</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FriendsScreen;