import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, FlatList, Image, Platform, SafeAreaView, ScrollView, Share, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { collection, query, where, getDocs, orderBy, getFirestore, doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { globalStyles } from '../styles/globalStyles';
import { friendsStyles } from '../styles/components/friendsStyles';
import { showAlert } from '../utils/platformAlert';
import { useAuth } from '../context/AuthContext';

const DefaultProfilePicture = require('../../assets/images/default_profilepicture.png');
const AddFriendIcon = require('../../assets/icons/noun-add-user-7539314.png');
const RemoveFriendIcon = require('../../assets/icons/noun-user-removed-7856287.png');
const PeopleIcon = require('../../assets/icons/noun-people-2196504.png');
const AcceptIcon = require('../../assets/icons/noun-add-2037478.png');
const RejectIcon = require('../../assets/icons/noun-delete-7938028.png');

type Friend = { id: string; name: string; username: string; profilePicture: any };

const FriendsScreen = () => {
  const { user, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, withdrawFriendRequest } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [sentFriendRequests, setSentFriendRequests] = useState<Friend[]>([]);
  const [friendsOfFriends, setFriendsOfFriends] = useState<Friend[]>([]);
  const [showSentRequests, setShowSentRequests] = useState(false);

  const inviteLink = 'https://bet-a-beer.netlify.app/';

  // Fetch friends, received friend requests, and sent friend requests
  useEffect(() => {
    const fetchFriendsData = async () => {
      if (user?.friends?.length) {
        const friendData = await Promise.all(
          user.friends.map(async (friendId: string) => {
            const userDoc = await getDoc(doc(getFirestore(), 'users', friendId));
            if (userDoc.exists()) {
              const data = userDoc.data();
              return {
                id: userDoc.id,
                name: data.name || 'Ukjent navn',
                username: data.username || 'ukjent',
                profilePicture: DefaultProfilePicture,
              };
            }
            return null;
          })
        );
        setFriends(friendData.filter((friend): friend is Friend => friend !== null));
      } else {
        setFriends([]);
      }

      if (user?.friendRequests?.length) {
        const requestData = await Promise.all(
          user.friendRequests.map(async (request: { from: string; status: string; createdAt?: string }) => {
            if (request.status === 'pending') {
              const userDoc = await getDoc(doc(getFirestore(), 'users', request.from));
              if (userDoc.exists()) {
                const data = userDoc.data();
                return {
                  id: userDoc.id,
                  name: data.name || 'Ukjent navn',
                  username: data.username || 'ukjent',
                  profilePicture: DefaultProfilePicture,
                };
              }
            }
            return null;
          })
        );
        setFriendRequests(requestData.filter((request): request is Friend => request !== null));
      } else {
        setFriendRequests([]);
      }

      // Fetch sent friend requests
      const usersRef = collection(getFirestore(), 'users');
      const sentRequests = await Promise.all(
        (await getDocs(usersRef)).docs
          .filter((doc) => doc.id !== user?.id && doc.data().friendRequests?.some((req: any) => req.from === user?.id && req.status === 'pending'))
          .map(async (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Ukjent navn',
              username: data.username || 'ukjent',
              profilePicture: DefaultProfilePicture,
            };
          })
      );
      setSentFriendRequests(sentRequests.filter((request): request is Friend => request !== null));
    };

    fetchFriendsData();
  }, [user]);

  // Fetch friends of friends
  useEffect(() => {
    const fetchFriendsOfFriends = async () => {
      if (user?.friends?.length) {
        const allFriendsOfFriends: Friend[] = [];
        for (const friendId of user.friends) {
          const friendDoc = await getDoc(doc(getFirestore(), 'users', friendId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            if (friendData.friends) {
              const fofData = await Promise.all(
                friendData.friends.map(async (fofId: string) => {
                  if (fofId !== user.id && !user.friends.includes(fofId)) {
                    const fofDoc = await getDoc(doc(getFirestore(), 'users', fofId));
                    if (fofDoc.exists()) {
                      const data = fofDoc.data();
                      return {
                        id: fofDoc.id,
                        name: data.name || 'Ukjent navn',
                        username: data.username || 'ukjent',
                        profilePicture: DefaultProfilePicture,
                      };
                    }
                  }
                  return null;
                })
              );
              allFriendsOfFriends.push(...fofData.filter((fof): fof is Friend => fof !== null));
            }
          }
        }
        // Remove duplicates
        const uniqueFriendsOfFriends = Array.from(
          new Map(allFriendsOfFriends.map((item) => [item.id, item])).values()
        );
        setFriendsOfFriends(uniqueFriendsOfFriends);
      } else {
        setFriendsOfFriends([]);
      }
    };

    fetchFriendsOfFriends();
  }, [user]);

  // Live search for users
  useEffect(() => {
    searchUsers();
  }, [searchTerm, user]);

  // Search users function
  const searchUsers = async () => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    const firestore = getFirestore();
    const usersRef = collection(firestore, 'users');
    const q = query(
      usersRef,
      orderBy('username'),
      where('username', '>=', searchTerm),
      where('username', '<=', searchTerm + '\uf8ff')
    );

    try {
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'Ukjent navn',
          username: doc.data().username || 'ukjent',
          profilePicture: DefaultProfilePicture,
        }))
        .filter((result) => result.id !== user?.id);
      setSearchResults(results);
    } catch (error) {
      showAlert('Feil', 'Kunne ikke søke etter brukere');
    }
  };

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: `Bli med meg på BetABeer! Bruk denne linken: ${inviteLink}`,
        url: inviteLink,
        title: 'Inviter venner til BetABeer',
      });
    } catch (error) {
      showAlert('Feil', 'Kunne ikke dele invitasjon');
    }
  };

  const handleAddFriend = async (friend: Friend) => {
    if (!user) {
      showAlert('Feil', 'Du må være logget inn for å sende en venneforespørsel');
      return;
    }
    try {
      await sendFriendRequest(user.id, friend.id);
      const userDoc = await getDoc(doc(getFirestore(), 'users', friend.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSentFriendRequests((prev) => [
          ...prev,
          {
            id: friend.id,
            name: userData.name || 'Ukjent navn',
            username: userData.username || 'ukjent',
            profilePicture: DefaultProfilePicture,
          },
        ]);
        showAlert('Venneforespørsel sendt', `Venneforespørsel sendt til ${friend.name}`);
      } else {
        showAlert('Feil', 'Kunne ikke hente mottakerens data');
      }
    } catch (error) {
      showAlert('Feil', 'Kunne ikke sende venneforespørsel');
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    showAlert(
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
              await updateDoc(doc(getFirestore(), 'users', user.id), {
                friends: arrayRemove(friend.id),
              });
              await updateDoc(doc(getFirestore(), 'users', friend.id), {
                friends: arrayRemove(user.id),
              });
              setFriends((prev) => prev.filter((f) => f.id !== friend.id));
              showAlert('Venn fjernet', `${friend.name} er fjernet fra vennelisten din`);
            } catch (error) {
              showAlert('Feil', 'Kunne ikke fjerne venn');
            }
          },
        },
      ]
    );
  };

  const handleAcceptFriendRequest = async (friend: Friend) => {
    if (!user) {
      showAlert('Feil', 'Du må være logget inn for å godta en venneforespørsel');
      return;
    }
    try {
      await acceptFriendRequest(user.id, friend.id);
      setFriendRequests((prev) => prev.filter((req) => req.id !== friend.id));
      setFriends((prev) => [...prev, friend]);
      showAlert('Venneforespørsel godkjent', `${friend.name} er nå din venn`);
    } catch (error) {
      showAlert('Feil', 'Kunne ikke godta venneforespørsel');
    }
  };

  const handleRejectFriendRequest = async (friend: Friend) => {
    if (!user) {
      showAlert('Feil', 'Du må være logget inn for å avslå en venneforespørsel');
      return;
    }
    try {
      await rejectFriendRequest(user.id, friend.id);
      setFriendRequests((prev) => prev.filter((req) => req.id !== friend.id));
      showAlert('Venneforespørsel avslått', `Venneforespørsel fra ${friend.name} er avslått`);
    } catch (error) {
      showAlert('Feil', 'Kunne ikke avslå venneforespørsel');
    }
  };

  const handleWithdrawFriendRequest = async (friend: Friend) => {
    if (!user) {
      showAlert('Feil', 'Du må være logget inn for å trekke tilbake en venneforespørsel');
      return;
    }
    try {
      await withdrawFriendRequest(user.id, friend.id);
      setSentFriendRequests((prev) => prev.filter((req) => req.id !== friend.id));
      showAlert('Venneforespørsel trukket tilbake', `Venneforespørsel til ${friend.name} er trukket tilbake`);
    } catch (error) {
      showAlert('Feil', 'Kunne ikke trekke tilbake venneforespørsel');
    }
  };

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

  const renderFriendRequest = ({ item }: { item: Friend }) => (
    <View style={[globalStyles.listItemRow, friendsStyles.friendSpacing]}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, { width: 60, height: 60, borderRadius: 30, marginRight: 10 }]} />
      <View style={globalStyles.itemInfo}>
        <Text style={friendsStyles.friendName}>{item.name}</Text>
        <Text style={globalStyles.secondaryText}>@{item.username}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity style={friendsStyles.button} onPress={() => handleAcceptFriendRequest(item)}>
          <Image source={AcceptIcon} style={globalStyles.settingsIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={friendsStyles.button} onPress={() => handleRejectFriendRequest(item)}>
          <Image source={RejectIcon} style={globalStyles.deleteIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSentFriendRequest = ({ item }: { item: Friend }) => (
    <View style={[globalStyles.listItemRow, friendsStyles.friendSpacing]}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, { width: 60, height: 60, borderRadius: 30, marginRight: 10 }]} />
      <View style={globalStyles.itemInfo}>
        <Text style={friendsStyles.friendName}>{item.name}</Text>
        <Text style={globalStyles.secondaryText}>@{item.username}</Text>
      </View>
      <TouchableOpacity style={friendsStyles.button} onPress={() => handleWithdrawFriendRequest(item)}>
        <Image source={RejectIcon} style={globalStyles.deleteIcon} />
      </TouchableOpacity>
    </View>
  );

  const renderFriendOfFriend = ({ item }: { item: Friend }) => (
    <View style={[globalStyles.listItemRow, friendsStyles.friendSpacing]}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, { width: 60, height: 60, borderRadius: 30, marginRight: 10 }]} />
      <View style={globalStyles.itemInfo}>
        <Text style={friendsStyles.friendName}>{item.name}</Text>
        <Text style={globalStyles.secondaryText}>@{item.username}</Text>
      </View>
      <TouchableOpacity style={friendsStyles.button} onPress={() => handleAddFriend(item)}>
        <Image source={AddFriendIcon} style={globalStyles.settingsIcon} />
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

        {/* Friend Requests section */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.sectionTitle}>
            {showSentRequests ? `Sendte venneforespørsler (${sentFriendRequests.length})` : `Mottatte venneforespørsler (${friendRequests.length})`}
          </Text>
          <View style={{ marginTop: 8, marginBottom: 10 }}>
            <TouchableOpacity onPress={() => setShowSentRequests(!showSentRequests)}>
              <Text style={{ color: '#FFD700', fontWeight: '600' }}>
                {showSentRequests ? 'Vis mottatte' : 'Vis sendte'}
              </Text>
            </TouchableOpacity>
          </View>
          {showSentRequests ? (
            sentFriendRequests.length > 0 ? (
              <FlatList
                data={sentFriendRequests}
                renderItem={renderSentFriendRequest}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={globalStyles.emptyState}>
                <Image source={AddFriendIcon} style={globalStyles.settingsIcon} />
                <Text style={globalStyles.emptyStateText}>Ingen sendte venneforespørsler</Text>
              </View>
            )
          ) : friendRequests.length > 0 ? (
            <FlatList
              data={friendRequests}
              renderItem={renderFriendRequest}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={globalStyles.emptyState}>
              <Image source={AddFriendIcon} style={globalStyles.settingsIcon} />
              <Text style={globalStyles.emptyStateText}>Ingen mottatte venneforespørsler</Text>
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
              onChangeText={setSearchTerm}
              autoCapitalize="none"
              style={{
                flex: 1,
                backgroundColor: '#23242A',
                borderRadius: 8,
                padding: 12,
                color: '#fff',
                marginRight: 8,
              }}
            />
            <TouchableOpacity
              onPress={searchUsers}
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
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderFriendOfFriend}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            searchTerm.length > 0 && (
              <Text style={{ color: '#B0B0B0', marginTop: 10 }}>Ingen brukere funnet.</Text>
            )
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
              <Image source={AddFriendIcon} style={globalStyles.settingsIcon} />
              <Text style={globalStyles.emptyStateText}>Du har ingen venner ennå</Text>
              <Text style={globalStyles.secondaryText}>Inviter venner for å komme i gang!</Text>
            </View>
          )}
        </View>

        {/* Friends of friends section */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.sectionTitle}>Venner av venner</Text>
          <Text style={globalStyles.sectionDescription}>Personer du kanskje kjenner gjennom dine venner</Text>
          {friendsOfFriends.length > 0 ? (
            <FlatList
              data={friendsOfFriends}
              renderItem={renderFriendOfFriend}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={globalStyles.emptyState}>
              <Image source={PeopleIcon} style={globalStyles.settingsIcon} />
              <Text style={globalStyles.emptyStateText}>Ingen forslag tilgjengelig</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default FriendsScreen;