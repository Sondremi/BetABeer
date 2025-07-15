import React, { useState } from 'react';
import { Alert, FlatList, Image, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { collection, query, where, getDocs, orderBy, getFirestore } from 'firebase/firestore';
import { globalStyles } from '../styles/globalStyles';
import { friendsStyles } from '../styles/components/friendsStyles';

const DefaultProfilePicture = require('../../assets/images/default_profilepicture.png');
const AddFriendIcon = require('../../assets/icons/noun-add-user-7539314.png');
const RemoveFriendIcon = require('../../assets/icons/noun-user-removed-7856287.png');
const PeopleIcon = require('../../assets/icons/noun-people-2196504.png');

type Friend = { id: string; name: string; username: string; profilePicture: any };

const FriendsScreen = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);

  // Dummy data - will be replaced with database data later
  const [friends] = useState<Friend[]>([
    {
      id: '1',
      name: 'Jonas',
      username: 'jonasboy',
      profilePicture: DefaultProfilePicture,
    },
    {
      id: '2',
      name: 'Niklas',
      username: 'niklasg',
      profilePicture: DefaultProfilePicture,
    },
    {
      id: '3',
      name: 'Magnus',
      username: 'magnusen',
      profilePicture: DefaultProfilePicture,
    },
    {
      id: '4',
      name: 'Sindre',
      username: 'sindreee',
      profilePicture: DefaultProfilePicture,
    },
  ]);
  const [friendsOfFriends] = useState<Friend[]>([
    {
      id: '5',
      name: 'Ole',
      username: 'oleboy',
      profilePicture: DefaultProfilePicture,
    },
    {
      id: '6',
      name: 'Erik',
      username: 'eriksen',
      profilePicture: DefaultProfilePicture,
    },
    {
      id: '7',
      name: 'Lars',
      username: 'larsmars',
      profilePicture: DefaultProfilePicture,
    },
    {
      id: '8',
      name: 'Petter',
      username: 'petterp',
      profilePicture: DefaultProfilePicture,
    },
    {
      id: '9',
      name: 'Andreas',
      username: 'andreasand',
      profilePicture: DefaultProfilePicture,
    },
  ]);

  const inviteLink = 'https://bet-a-beer.netlify.app/';

  const handleInviteFriends = async () => {
    try {
      const result = await Share.share({
        message: `Bli med meg på BetABeer! Bruk denne linken: ${inviteLink}`,
        url: inviteLink,
        title: 'Inviter venner til BetABeer',
      });
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke dele invitasjonslenken');
    }
  };

  const friendSearch = async (searchTerm: string) => {
    if (!searchTerm) return [];

    const firestore = getFirestore();
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
        return [];
    }
  };

  const handleSearch = async () => {
    const results = await friendSearch(searchTerm);
    setSearchResults(results as Friend[]);
  };

  const handleAddFriend = (friend: Friend) => {
    // Here you would add friend to database
    Alert.alert('Venneforespørsel sendt', `Venneforespørsel sendt til ${friend.name}`);
  };

  const handleRemoveFriend = (friend: Friend) => {
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
          onPress: () => {
            // Here you would remove friend from database
            Alert.alert('Venn fjernet', `${friend.name} er fjernet fra vennelisten din`);
          },
        }
      ]        
    );
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={[globalStyles.listItemRow, friendsStyles.friendSpacing]}>
      <Image source={item.profilePicture} style={[globalStyles.circularImage, { width: 60, height: 60, borderRadius: 30, marginRight: 10 }]} />
      <View style={globalStyles.itemInfo}>
        <Text style={friendsStyles.friendName}>{item.name}</Text>
        <Text style={globalStyles.secondaryText}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={friendsStyles.button}
        onPress={() => handleRemoveFriend(item)}
      >
        <Image source={RemoveFriendIcon} style={globalStyles.deleteIcon} />
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
      <TouchableOpacity
        style={friendsStyles.button}
        onPress={() => handleAddFriend(item)}
      >
        <Image source={AddFriendIcon} style={globalStyles.settingsIcon} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[globalStyles.container, { padding: 0 }]}>
      <ScrollView contentContainerStyle={friendsStyles.fullWidthScrollContent}>
        {/* Header */}
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>Venner</Text>
        </View>

        {/* Invite friends section */}
        <View style={friendsStyles.inviteSection}>
          <TouchableOpacity style={globalStyles.outlineButtonGold} onPress={handleInviteFriends}>
            <Text style={globalStyles.outlineButtonGoldText}>Inviter venner</Text>
          </TouchableOpacity>
          <Text style={globalStyles.sectionDescription}>
            Del lenken med venner for å invitere dem til appen
          </Text>
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
              <Text style={{ color: '#B0B0B0', marginTop: 10 }}>
                Ingen brukere funnet.
              </Text>
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
              <Text style={globalStyles.secondaryText}>
                Inviter venner for å komme i gang!
              </Text>
            </View>
          )}
        </View>

        {/* Friends of friends section */}
        <View style={globalStyles.section}>
          <Text style={globalStyles.sectionTitle}>Venner av venner</Text>
          <Text style={globalStyles.sectionDescription}>
            Personer du kanskje kjenner gjennom dine venner
          </Text>
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
    </SafeAreaView>
  );
};

export default FriendsScreen;