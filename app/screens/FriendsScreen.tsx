import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, ScrollView, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, firestore } from '../services/firebase/FirebaseConfig';
import { acceptFriendRequest, cancelFriendRequest, declineFriendRequest, Friend, FriendRequest, friendSearch, getIncomingRequest, getOutgoingRequest, removeFriend, sendFriendRequest } from '../services/firebase/friendService';
import { friendsStyles } from '../styles/components/friendsStyles';
import { globalStyles } from '../styles/globalStyles';
import { showAlert } from '../utils/platformAlert';

const DefaultProfilePicture = require('../../assets/images/default_profilepicture.png');
const AddFriendIcon = require('../../assets/icons/noun-add-user-7539314.png');
const RemoveFriendIcon = require('../../assets/icons/noun-user-removed-7856287.png');
const PeopleIcon = require('../../assets/icons/noun-people-2196504.png');
const AcceptIcon = require('../../assets/icons/noun-add-2037478.png');
const RejectIcon = require('../../assets/icons/noun-delete-7938028.png');

const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

type FriendWithPending = Friend & { type?: 'friend' | 'pending'; requestId?: string };

const FriendsScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendWithPending[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No user authentication');
        return;
      }

      try {
        const incoming = await getIncomingRequest(currentUser.uid);
        const enrichedIncoming = await Promise.all(
          incoming.map(async (request: FriendRequest) => {
            const userDocRef = doc(firestore, "users", request.fromUserId);
            const userDoc = await getDoc(userDocRef);
            return {
              ...request,
              name: userDoc.exists() ? userDoc.data().name || 'Ukjent' : 'Ukjent',
              username: userDoc.exists() ? userDoc.data().username || 'ukjent' : 'ukjent',
              profilePicture: userDoc.exists() ? userDoc.data().profilePicture || DefaultProfilePicture : DefaultProfilePicture,
            };
          })
        );
        setIncomingRequests(enrichedIncoming);

        const outgoing = await getOutgoingRequest(currentUser.uid);
        setOutgoingRequests(outgoing);
      } catch (error) {
        console.error(error);
        showAlert('Feil', `Kunne ikke hente forespørsel: ${(error as Error).message}`);
      }
    };
    fetchRequests();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No user authenticated');
        return;
      }

      try {
        const userDocRef = doc(firestore, 'users', currentUser.uid);
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
            profilePicture: doc.data().profilePicture || DefaultProfilePicture,
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

        setFriends([...friendsData, ...pendingFriends]);
      } catch (error) {
        console.error('Failed to fetch friends:', error);
        showAlert('Feil', `Kunne ikke hente venner: ${(error as Error).message}`);
      }
    };
    fetchFriends();
  }, [outgoingRequests]);

  const handleSearch = useCallback(debounce(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await friendSearch(term);
      const filteredResults = (results as Friend[]).filter(
        (result) => !friends.some((friend) => friend.id === result.id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error handling search: ', error);
      showAlert('Feil', `Kunne ikke søke ${(error as Error).message}`);
    }
  }, 300), [friends]);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);

  const inviteLink = 'http://bet-a-beer.netlify.app';

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: `Bli med meg på BetABeer! Bruk denne linken: ${inviteLink}`,
        url: inviteLink,
        title: 'Inviter venner til BetABeer',
      });
    } catch (error) {
      console.log(error);
      showAlert('Feil', 'Kunne ikke dele invitasjonslenken');
    }
  };

  const handleAddFriend = async (friend: Friend) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showAlert('Ikke logget inn!');
      return;
    }

    try {
      const requestId = await sendFriendRequest(friend.id);
      setOutgoingRequests((prev) => [
        ...prev,
        {
          id: requestId,
          fromUserId: currentUser.uid,
          toUserId: friend.id,
          status: 'pending',
          createdAt: serverTimestamp(),
          name: friend.name || 'Ukjent',
          username: friend.username || 'ukjent',
          profilePicture: friend.profilePicture || DefaultProfilePicture,
        },
      ]);
      setSearchResults([]);
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke sende venneforespørselen');
    }
  };

  const handleRemoveFriend = (friend: FriendWithPending) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
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
                await removeFriend(currentUser.uid, friend.id);
                setFriends((prev) => prev.filter((f) => f.id !== friend.id));
              } catch (error) {
                showAlert('Feil', 'Kunne ikke fjerne venn');
              }
            },
          },
        ]
      );
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showAlert('Ikke logget inn!');
      return;
    }

    try {
      await acceptFriendRequest(request.id, request.fromUserId, request.toUserId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));
      setFriends((prev) => [
        ...prev,
        {
          id: request.fromUserId,
          name: request.name || 'Ukjent',
          username: request.username || 'ukjent',
          profilePicture: request.profilePicture || DefaultProfilePicture,
        },
      ]);
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

  const handleCancelRequest = async (request: FriendRequest) => {
    try {
      await cancelFriendRequest(request.id);
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch(error) {
      console.error(error);
      showAlert('Feil', `Kunne ikke kansellere forespørselen: ${(error as Error).message}`);
    }
  };

  const renderFriend = ({ item }: { item: FriendWithPending }) => (
    <View style={[globalStyles.listItemRow, friendsStyles.friendSpacing]}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, { width: 60, height: 60, borderRadius: 30, marginRight: 10 }]} />
      <View style={globalStyles.itemInfo}>
        <Text style={friendsStyles.friendName}>{item.name}</Text>
        <Text style={globalStyles.secondaryText}>@{item.username}</Text>
        {item.type === 'pending' && <Text style={{ color: '#888' }}>Forespørsel sendt</Text>}
      </View>
      <TouchableOpacity style={friendsStyles.button} onPress={() => handleRemoveFriend(item)}>
        <Image source={item.type === 'pending' ? RejectIcon : RemoveFriendIcon} style={globalStyles.deleteIcon} />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container, { padding: 0 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={globalStyles.fullWidthScrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>Venner</Text>
        </View>

        {/* Invite friends section */}
        <View style={friendsStyles.inviteSection}>
          <TouchableOpacity style={globalStyles.outlineButtonGold} onPress={handleInviteFriends}>
            <Text style={globalStyles.outlineButtonGoldText}>Inviter venner</Text>
          </TouchableOpacity>
          <Text style={globalStyles.sectionDescription}>Del lenken med venner for å invitere dem til appen</Text>
        </View>

        {/* Search Section */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.sectionTitle}>Søk etter venner</Text>
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            <TextInput
              placeholder="Skriv inn brukernavn"
              placeholderTextColor="#aaa"
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
              }}
              autoCapitalize="none"
              style={{
                flex: 1,
                backgroundColor: '#23242A',
                borderRadius: 8,
                padding: 12,
                color: '#fff',
                marginRight: 8
              }}
            />
            <TouchableOpacity
              onPress={() => handleSearch(searchTerm)}
              style={{
                backgroundColor: '#FFD700',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#181A20', fontWeight: '600' }}>Søk</Text>
            </TouchableOpacity>
          </View>
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[globalStyles.listItemRow, friendsStyles.friendSpacing]} key={item.id}>
                  <Image
                    source={item.profilePicture}
                    style={[globalStyles.circularImage, { width: 60, height: 60, borderRadius: 30, marginRight: 10 }]}
                  />
                  <View style={globalStyles.itemInfo}>
                    <Text style={friendsStyles.friendName}>{item.name}</Text>
                    <Text style={globalStyles.secondaryText}>@{item.username}</Text>
                  </View>
                  <TouchableOpacity
                    style={friendsStyles.button}
                    onPress={() => handleAddFriend(item)}
                  >
                    <Image source={AddFriendIcon} style={globalStyles.settingsIcon} />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>

        {/* Friends section */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.sectionTitle}>Mine venner ({friends.length})</Text>
          {friends.length > 0 ? (
            <FlatList
              data={friends}
              renderItem={renderFriend}
              keyExtractor={(item) => item.id + (item.type === 'pending' ? '-pending' : '')}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={globalStyles.emptyState}>
              <Image source={PeopleIcon} style={globalStyles.settingsIcon} />
              <Text style={globalStyles.emptyStateText}>Du har ingen venner enda</Text>
            </View>
          )}
        </View>

        {/* Friend Requests section */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.sectionTitle}>Venneforespørsler</Text>
          {incomingRequests.length > 0 ? (
            <FlatList
              data={incomingRequests}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[globalStyles.listItemRow, friendsStyles.friendSpacing]} key={item.id}>
                  <Image
                    source={item.profilePicture}
                    style={[globalStyles.circularImage, { width: 60, height: 60, borderRadius: 30, marginRight: 10 }]}
                  />
                  <View style={globalStyles.itemInfo}>
                    <Text style={friendsStyles.friendName}>{item.name}</Text>
                    <Text style={globalStyles.secondaryText}>@{item.username}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={friendsStyles.button}
                      onPress={() => handleAcceptRequest(item)}
                    >
                      <Image source={AcceptIcon} style={globalStyles.settingsIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={friendsStyles.button}
                      onPress={() => handleDeclineRequest(item)}
                    >
                      <Image source={RejectIcon} style={globalStyles.deleteIcon} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={globalStyles.emptyState}>
              <Image source={AddFriendIcon} style={globalStyles.settingsIcon} />
              <Text style={globalStyles.emptyStateText}>Ingen forespørsler</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FriendsScreen;