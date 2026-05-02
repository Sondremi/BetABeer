import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Share } from 'react-native';
import { GuestUpgradePrompt } from '../../components/GuestUpgradePrompt';
import { useAuth } from '../../context/AuthContext';
import { buildFriendInviteLink } from '../../services/friendInviteLinkService';
import { firestore } from '../../services/firebase/FirebaseConfig';
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest, removeFriend, sendFriendRequest } from '../../services/friendService';
import { globalStyles } from '../../styles/globalStyles';
import type { Friend, FriendRequest, FriendWithPending } from '../../types/userTypes';
import { showAlert } from '../../utils/platformAlert';
import { getDefaultProfilePicture, resolveProfileImageSource } from '../../utils/profileImage';
import FriendRequestsSection from './components/FriendRequestsSection';
import FriendsHeader from './components/FriendsHeader';
import FriendsListSection from './components/FriendsListSection';
import FriendSearchSection from './components/FriendSearchSection';
import FriendSuggestionsSection from './components/FriendSuggestionsSection';
import InviteFriendsSection from './components/InviteFriendsSection';
import { useFriendRequests } from './hooks/useFriendRequests';
import { useFriendsList } from './hooks/useFriendsList';
import { useFriendSearch } from './hooks/useFriendSearch';
import { useFriendSuggestions } from './hooks/useFriendSuggestions';

const DefaultProfilePicture = getDefaultProfilePicture();
const AddFriendIcon = require('../../../assets/icons/noun-add-user-7539314.png');
const PeopleIcon = require('../../../assets/icons/noun-people-2196504.png');

const FriendsScreen = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [isFriendsExpanded, setIsFriendsExpanded] = useState(true);
  const [isRequestsExpanded, setIsRequestsExpanded] = useState(true);
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);

  const {
    incomingRequests,
    outgoingRequests,
    setIncomingRequests,
    setOutgoingRequests,
  } = useFriendRequests({
    loading,
    userId: user?.id,
  });

  const {
    friends,
    setFriends,
    fetchFriends,
  } = useFriendsList({
    loading,
    outgoingRequests,
    userId: user?.id,
  });

  const {
    friendSuggestions,
    suggestionsLoading,
  } = useFriendSuggestions({
    incomingRequests,
    friends,
    outgoingRequests,
    userId: user?.id,
  });

  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    setSearchResults,
    searchFocused,
    setSearchFocused,
    performSearch,
  } = useFriendSearch({ friends });

  const inviteLink = buildFriendInviteLink(user?.id);

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
      showAlert('Ikke logget inn!');
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
      return;
    }

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
              setFriends((prev) => prev.filter((existingFriend) => existingFriend.id !== friend.id));
            } catch (error) {
              console.error(error);
              showAlert('Feil', 'Kunne ikke fjerne venn');
            }
          },
        },
      ]
    );
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!user?.id) {
      showAlert('Ikke logget inn!');
      return;
    }

    try {
      await acceptFriendRequest(request.id, request.fromUserId, request.toUserId);
      setIncomingRequests((prev) => prev.filter((incomingRequest) => incomingRequest.id !== request.id));

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
            profilePicture: userData.profileImage
              ? resolveProfileImageSource(userData.profileImage, DefaultProfilePicture)
              : request.fromUserProfileImage
                ? resolveProfileImageSource(request.fromUserProfileImage, DefaultProfilePicture)
                : DefaultProfilePicture,
            type: 'friend' as const,
          },
        ].sort((a, b) => a.name.localeCompare(b.name)));
      }

      fetchFriends();
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke godta forespørselen');
    }
  };

  const handleDeclineRequest = async (request: FriendRequest) => {
    try {
      await declineFriendRequest(request.id);
      setIncomingRequests((prev) => prev.filter((incomingRequest) => incomingRequest.id !== request.id));
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Feil med å avslå forespørsel');
    }
  };

  const handleBack = () => {
    router.replace('/profile');
  };

  if ((user as any)?.isGuest) {
    return (
      <GuestUpgradePrompt
        title="Venner er låst for gjest"
        description="Opprett en bruker for å sende venneforespørsler og administrere vennelisten."
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={globalStyles.fullWidthScrollContent} keyboardShouldPersistTaps="handled">
        <FriendsHeader onBack={handleBack} />

        <InviteFriendsSection onInviteFriends={handleInviteFriends} />

        <FriendSearchSection
          onAddFriend={handleAddFriend}
          onPerformSearch={(term) => {
            void performSearch(term);
          }}
          searchFocused={searchFocused}
          searchResults={searchResults}
          searchTerm={searchTerm}
          setSearchFocused={setSearchFocused}
          setSearchTerm={setSearchTerm}
        />

        <FriendRequestsSection
          addFriendIcon={AddFriendIcon}
          incomingRequests={incomingRequests}
          isExpanded={isRequestsExpanded}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={handleDeclineRequest}
          onToggleExpanded={() => setIsRequestsExpanded((prev) => !prev)}
        />

        <FriendsListSection
          friends={friends}
          isExpanded={isFriendsExpanded}
          onRemoveFriend={handleRemoveFriend}
          onToggleExpanded={() => setIsFriendsExpanded((prev) => !prev)}
          peopleIcon={PeopleIcon}
        />

        <FriendSuggestionsSection
          friendSuggestions={friendSuggestions}
          isExpanded={isSuggestionsExpanded}
          suggestionsLoading={suggestionsLoading}
          onAddFriend={handleAddFriend}
          onToggleExpanded={() => setIsSuggestionsExpanded((prev) => !prev)}
          peopleIcon={PeopleIcon}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FriendsScreen;
