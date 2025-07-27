import React, { useState, useEffect } from 'react';
import { Alert, FlatList, Image, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { collection, doc, query, where, getDocs, orderBy, addDoc, serverTimestamp, updateDoc, arrayUnion, getDoc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase/FirebaseConfig'; // juster path

const DefaultProfilePicture = require('../../assets/images/default_profilepicture.png');
const AddFriendIcon = require('../../assets/icons/noun-add-user-7539314.png');
const RemoveFriendIcon = require('../../assets/icons/noun-user-removed-7856287.png');
const PeopleIcon = require('../../assets/icons/noun-people-2196504.png');

type Friend = { id: string; name: string; username: string; profilePicture: any };
type FriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: string;
  createdAt: any;
  name?: string;
  username?: string;
  profilePicture?: any; 
}

export const sendFriendRequest = async (toUserId: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User not autenticated");
  }

  const friendRequestRef = collection(firestore, "friendRequests");
  const docRef =  await addDoc(friendRequestRef, {
    fromUserId: currentUser.uid,
    toUserId,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  console.log("Venneforespørsel opprettet", docRef.id);
  return docRef.id;
}

export const getIncomingRequest = async (currentUserId: string) : Promise<FriendRequest[]> => {
  const friendRequestRef = collection(firestore, "friendRequests");
  const q = query(
    friendRequestRef,
    where("toUserId", "==", currentUserId),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FriendRequest[];
};

export const cancelFriendRequest = async (requestId: string) => {
  try {
    const requestDocRef = doc(firestore, 'friendRequests', requestId);
    await deleteDoc(requestDocRef);
    console.log('Friend request cancelled', requestId);
  } catch(error) {
    console.error(error)
    throw new Error(`Failed to cancel friend request: ${(error as Error).message}`)
  }
}

export const getOutgoingRequest = async (currentUserId: string) => {
  const friendRequestRef = collection(firestore, "friendRequests");
  const q = query(
    friendRequestRef,
    where("fromUserId", "==", currentUserId),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  const requests = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FriendRequest[];

  const enrichedRequests = await Promise.all(
    requests.map(async (request) => {
      const userDocRef = doc(firestore, "users", request.toUserId);
      const userDoc = await getDoc(userDocRef);
      return {
        ...request,
        name: userDoc.exists() ? userDoc.data().name || 'Ukjent' : 'Ukjent',
        username: userDoc.exists() ? userDoc.data().username || 'ukjent' : 'ukjent',
        profilePicture: userDoc.exists() ? userDoc.data().profilePicture || DefaultProfilePicture : DefaultProfilePicture,
      };
    })
  );
  return enrichedRequests;
}

export const acceptFriendRequest = async (requestId: string, fromUserId: string, toUserId: string) => {
  try {
    const fromUserRef = doc(firestore, "users", fromUserId);
    const toUserRef = doc(firestore, "users", toUserId);
    await Promise.all([
      updateDoc(fromUserRef, {friends: arrayUnion(toUserId)}),
      updateDoc(toUserRef, {friends: arrayUnion(fromUserId)}),
    ]);
    const requestDocRef = doc(firestore, "friendRequests", requestId);
    await deleteDoc(requestDocRef);
    console.log(`Friendship established and request deleted: ${requestId}`)
  } catch(error) {
    console.log(error)
    Alert.alert('Feil', `Kunne ikke akseptere forespørsel: ${(error as Error).message}`)
  }
}

export const declineFriendRequest = async (requestId: string) => {
  try {
    const requestDocRef = doc(firestore, "friendRequests", requestId);
    await deleteDoc(requestDocRef);
    console.log("Forespørsel avslått og slettet", requestId);
  } catch (error) {
    console.error(error)
    Alert.alert('Feil', `Kunne ikke avlså forespørsel: ${(error as Error).message}`);
  }
}

export const removeFriend = async (currentuserId: string, friendId: string) => {
  try {
    const currentUserRef = doc(firestore, 'users', currentuserId);
    const friendUserRef = doc(firestore, 'users', friendId);
    updateDoc(friendUserRef, {friends: arrayRemove(currentuserId)});
    updateDoc(currentUserRef, {friends: arrayRemove(friendId)});
    console.log("Fjernet venn");
  } catch(error) {
    console.error(error);
    Alert.alert('Feil', 'Kunne ikke slette venn')
  }
};

const FriendsScreen = () => {
  const [searchTerm, setSearchTerm] = useState("");
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

  const friendSearch = async (searchTerm: string) => {
    if (!searchTerm) return [];

    const usersRef = collection(firestore, "users");

    const q = query(
      usersRef,
      orderBy("username"),
      where("username", ">=", searchTerm),
      where("username", "<=", searchTerm + "\uf8ff")
    );

    try {
      const querySnapshot = await getDocs(q);
      const result = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      return result;
    } catch(error) {
        console.error("Feil under søk: " + error);
        Alert.alert('Feil', 'Kunne ikke hente forespørsel: ' + (error as Error).message)
        return [];
    }
  };

  const handleSearch = async () => {
    const results = await friendSearch(searchTerm);
    setSearchResults(results as Friend[]);
  };

  // Dummy invite link - will be replaced with actual link generation later
  const inviteLink = 'https://app.example.com/invite/abc123xyz';

  const handleInviteFriends = async () => {
    try {
      const result = await Share.share({
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
    <View style={styles.friendItem}>
      <Image source={item.profilePicture} style={styles.friendImage} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeFriendButton}
        onPress={() => handleRemoveFriend(item)}
      >
      <Image source={RemoveFriendIcon} style={{ width: 24, height: 24, tintColor: '#FF0000' }} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Venner</Text>
        </View>

        {/* Invite friends section */}
        <View style={styles.inviteSection}>
          <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFriends}>
            <Text style={styles.inviteButtonText}>Inviter venner</Text>
          </TouchableOpacity>
          <Text style={styles.inviteDescription}>
            Del lenken med venner for å invitere dem til appen
          </Text>
        </View>

        {/* Outgoing Requests section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utgående forespørsler</Text>
          {outgoingRequests.length > 0 ? (
            <FlatList
              data={outgoingRequests}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.friendItem} key={item.id}>
                  <Image
                    source={item.profilePicture}
                    style={styles.friendImage}
                  />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{item.name}</Text>
                    <Text style={styles.friendUsername}>@{item.username}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addFriendButton}
                    onPress={() => handleCancelRequest(item)}
                  >
                    <Text style={{ color: '#FF3B30', fontWeight: '600' }}>Kanseller</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : (
            <Text style={{ color: '#B0B0B0' }}>
              Ingen utgående forespørsler akkurat nå.
            </Text>
          )}
        </View>

        {/* FriendRequest section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Venneforespørsler</Text>
          {incomingRequests.length > 0 ? (
            <FlatList
              data={incomingRequests}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.friendItem} key={item.id}>
                  <Image
                    source={item.profilePicture}
                    style={styles.friendImage}
                  />
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{item.name}</Text>
                    <Text style={styles.friendUsername}>@{item.username}</Text>
                  </View>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <TouchableOpacity
                      style={styles.addFriendButton}
                      onPress={() => handleAcceptRequest(item)}
                    >
                      <Text style={{ color: '#007AFF', fontWeight: '600' }}>Godta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addFriendButton}
                      onPress={() => handleDeclineRequest(item)}
                      >
                      <Text style={{ color: '#FF3B30', fontWeight: '600' }}>Avslå</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          ) : (
            <Text style={{ color: '#B0B0B0' }}>
              Ingen forespørsler akkurat nå.
            </Text>
          )}
        </View>


        {/* Friends section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mine venner ({friends.length})</Text>
          {friends.length > 0 ? (
            <FlatList
              data={friends}
              renderItem={renderFriend}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Image source={AddFriendIcon} style={{ width: 20, height: 20, tintColor: '#007AFF' }} />
              <Text style={styles.emptyStateText}>Du har ingen venner ennå</Text>
              <Text style={styles.emptyStateSubtext}>
                Inviter venner for å komme i gang!
              </Text>
            </View>
          )}
        </View>

        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Søk etter brukere</Text>
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
              <View style={styles.friendItem} key={item.id}>
                <Image
                  source={item.profilePicture}
                  style={styles.friendImage}
                />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{item.name}</Text>
                  <Text style={styles.friendUsername}>@{item.username}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addFriendButton}
                  onPress={() => handleAddFriend(item)}
                >
                  <Image source={AddFriendIcon} style={{ width: 24, height: 24, tintColor: '#007AFF' }} />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  inviteSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#23242A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    marginBottom: 10,
  },
  inviteButtonText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 8,
  },
  inviteDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#23242A',
    borderRadius: 12,
    marginBottom: 8,
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#23242A',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    color: '#FFD700',
  },
  addFriendButton: {
    padding: 8,
  },
  removeFriendButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
});

export default FriendsScreen;