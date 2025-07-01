import React, { useState } from 'react';
import { Alert, FlatList, Image, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DefaultProfilePicture = require('../../assets/images/default_profilepicture.png');
const AddFriendIcon = require('../../assets/icons/noun-add-user-7539314.png');
const RemoveFriendIcon = require('../../assets/icons/noun-user-removed-7856287.png');
const PeopleIcon = require('../../assets/icons/noun-people-2196504.png');

type Friend = { id: string; name: string; username: string; profilePicture: any };

const FriendsScreen = () => {
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
      Alert.alert('Feil', 'Kunne ikke dele invitasjonslenken');
    }
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
        },
      ]
    );
  };

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

  const renderFriendOfFriend = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <Image source={item.profilePicture} style={styles.friendImage} />
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

        {/* Friends of friends section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Venner av venner</Text>
          <Text style={styles.sectionDescription}>
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
            <View style={styles.emptyState}>
              <Image source={PeopleIcon} style={{ width: 24, height: 24, tintColor: '#ccc' }} />
              <Text style={styles.emptyStateText}>Ingen forslag tilgjengelig</Text>
            </View>
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