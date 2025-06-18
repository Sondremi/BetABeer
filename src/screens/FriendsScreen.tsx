import React, { useState } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert, Share, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DefaultProfilePicture = require('../../assets/images/default_profilepicture.png');

type Friend = {
  id: string;
  name: string;
  username: string;
  profilePicture: any;
};

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
        message: `Bli med meg på BetBuddies! Bruk denne linken: ${inviteLink}`,
        url: inviteLink,
        title: 'Inviter venner til BetBuddies',
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
        <Icon name="close-circle-outline" size={24} color="#FF3B30" />
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
        <Icon name="person-add-outline" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Venner</Text>
      </View>

      {/* Invite friends section */}
      <View style={styles.inviteSection}>
        <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFriends}>
          <Icon name="share-outline" size={24} color="#007AFF" />
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
            <Icon name="people-outline" size={48} color="#ccc" />
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
            <Icon name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>Ingen forslag tilgjengelig</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginBottom: 10,
  },
  inviteButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  inviteDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    color: '#666',
  },
  addFriendButton: {
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
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
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default FriendsScreen;