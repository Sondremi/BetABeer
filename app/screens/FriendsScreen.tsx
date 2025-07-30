import React, { useState, useEffect } from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  FlatList, 
  Image, 
  ScrollView, 
  Share, 
  Text, 
  TouchableOpacity, 
  View, 
  TextInput 
} from 'react-native';
import { auth, firestore } from '../services/firebase/FirebaseConfig'; // juster path
import {
  friendSearch,
  sendFriendRequest,
  acceptFriendRequest, 
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getIncomingRequest,
  getOutgoingRequest,
  Friend,
  FriendRequest
} from '../services/firebase/friendService'
import { doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { globalStyles } from '../styles/globalStyles';
import { friendsStyles } from '../styles/components/friendsStyles';
//import { showAlert } from '../utils/platformAlert';

const DefaultProfilePicture = require('../../assets/images/default_profilepicture.png');
const AddFriendIcon = require('../../assets/icons/noun-add-user-7539314.png');
const RemoveFriendIcon = require('../../assets/icons/noun-user-removed-7856287.png');
const PeopleIcon = require('../../assets/icons/noun-people-2196504.png');
const AcceptIcon = require('../../assets/icons/noun-add-2037478.png');
const RejectIcon = require('../../assets/icons/noun-delete-7938028.png');

const FriendsScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
  const fetchRequests = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('No user authentication');
      return;
    }

    try {
      const [incoming, outgoing] = await Promise.all([
        getIncomingRequest(currentUser.uid),
        getOutgoingRequest(currentUser.uid),
      ]);
      // fetch sender info for each request
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
      setOutgoingRequests(outgoing);
    } catch (error) {
      console.error(error);
      Alert.alert('Feil', `Kunne ikke hente forespørsel: ${(error as Error).message}`);
    }
  };
  fetchRequests();
}, []);

// New useEffect for fetching friends
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
        const friendsData = friendDocs
          .filter((doc) => doc.exists())
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name || 'Ukjent',
            username: doc.data().username || 'ukjent',
            profilePicture: doc.data().profilePicture || DefaultProfilePicture,
          }));
        setFriends(friendsData);
      } catch (error) {
        console.error('Failed to fetch friends:', error);
        Alert.alert('Feil', `Kunne ikke hente venner: ${(error as Error).message}`);
      }
    };
    fetchFriends();
  }, []);

  const handleSearch = async () => {
    try {
      const results = await friendSearch(searchTerm);
      setSearchResults(results as Friend[]);
    } catch(error) {
      console.error('Error handling search: ', error);
      Alert.alert('Feil', `Kunne ikke søke ${(error as Error).message}`);
    }
  };

  // Dummy invite link - will be replaced with actual link generation later
  const inviteLink = 'https://app.example.com/invite/abc123xyz';

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: `Bli med meg på BetABeer! Bruk denne linken: ${inviteLink}`,
        url: inviteLink,
        title: 'Inviter venner til BetABeer',
      });
    } catch (error) {
      console.log(error)
      Alert.alert('Feil', 'Kunne ikke dele invitasjonslenken');
    }
  };

  const handleAddFriend = async (friend: Friend) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Ikke logget inn!');
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
      setSearchTerm('');
      console.log("Venneforespørsel opprettet i Firestore!");
      Alert.alert('Venneforespørsel sendt', `Forespørsel sendt til ${friend.username}`);
    } catch (error) {
      console.error(error)
      Alert.alert('Feil', 'Kunne ikke sende venneforespørselen');
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Ikke logget inn!");
      return;
    }

    Alert.alert(
      'Fjern venn',
      `Er du sikker på at du vil fjerne ${friend.name} som venn?`,
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Fjern',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(currentUser.uid, friend.id);
              setFriends((prev) => prev.filter((f) => f.id !== friend.id));
              Alert.alert('Venn fjernet', `${friend.name} er fjernet fra vennelisten din`);
            } catch(error) {
              console.error(error);
              Alert.alert('Feil', `Kunne ikke fjerne venn: ${(error as Error).message}`)
            }
          },
        },
      ]
    );
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Ikke logget inn!');
      return;
    }

    try {
      await acceptFriendRequest(request.id, request.fromUserId, request.toUserId);
      // oppdaterer listen
      setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));
      Alert.alert('Suksess', 'Venneforespørsel godtatt!')
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
      Alert.alert('Feil', `Kunne ikke godta forespørselen: ${(error as Error).message}`);
    }
  };

  const handleDeclineRequest = async (request: FriendRequest) => {
    try {
      await declineFriendRequest(request.id);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));
      Alert.alert('Suksess', 'Venneforespørsel avvist')
    } catch(error) {
      console.error(error)
      Alert.alert('Feil', `Feil med å avslå forespørsel: ${(error as Error).message}`)
    }
  }

  const handleCancelRequest = async (request: FriendRequest) => {
    try {
      await cancelFriendRequest(request.id);
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== request.id));
      Alert.alert('Suksess', 'Venneforespørsel kansellert');
    } catch(error) {
      console.error(error);
      Alert.alert('Feil', `Kunne ikke kansellere forespørselen: ${(error as Error).message}`);
    }
  }

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={[globalStyles.listItemRow, friendsStyles.friendSpacing]}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, { width: 60, height: 60, borderRadius: 30, marginRight: 10 }]} />
      <View style={globalStyles.itemInfo}>
        <Text style={friendsStyles.friendName}>{item.name}</Text>
        <Text style={globalStyles.secondaryText}>@{item.username}</Text>
      </View>
      <TouchableOpacity style={friendsStyles.button} onPress={() => handleRemoveFriend(item)}>
        <Image source={RemoveFriendIcon} style={globalStyles.deleteIcon} />
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

        {/* Outgoing Requests section */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.sectionTitle}>Utgående forespørsler</Text>
          {outgoingRequests.length > 0 ? (
            <FlatList
              data={outgoingRequests}
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
                  <View style={{flexDirection: 'row', gap: 8}}>
                    <TouchableOpacity
                      style={friendsStyles.button}
                      onPress={() => handleCancelRequest(item)}
                    >
                      <Text style={{ color: '#FF3B30', fontWeight: '600' }}>Kanseller</Text> 
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={globalStyles.emptyState}>
              <Text style={globalStyles.emptyStateText}>
                Ingen utgående forespørsler akkurat nå.
              </Text>
            </View>
          )}
        </View>

        {/* Incmoing Request section */}
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
                  <View style={{flexDirection: 'row', gap: 8}}>
                    <TouchableOpacity
                      style={friendsStyles.button}
                      onPress={() => handleAcceptRequest(item)}
                    >
                      <Text style={{ color: '#007AFF', fontWeight: '600' }}>Godta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={friendsStyles.button}
                      onPress={() => handleDeclineRequest(item)}
                      >
                      <Text style={{ color: '#FF3B30', fontWeight: '600' }}>Avslå</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={globalStyles.emptyState}>
              <Image source={AddFriendIcon} style={globalStyles.settingsIcon}/>
              <Text style={globalStyles.emptyStateText}>Ingen forespørsler akkurat nå.</Text>
            </View>
          )}
        </View>


        {/* Friends section */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.sectionTitle}>Mine venner ({friends.length})</Text>
          {friends.length > 0 ? (
            <FlatList
              data={friends}
              renderItem={renderFriend}
              keyExtractor={(item) => item.id}
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

        {/* Search Section */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.sectionTitle}>Søk etter brukere</Text>
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            <TextInput
              placeholder="Skriv inn brukernavn"
              placeholderTextColor="#aaa"
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                if (!text.trim()) {
                  setSearchResults([]);
                }
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
              onPress={handleSearch}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FriendsScreen;