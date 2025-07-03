import React, { useState } from 'react';
import { Alert, FlatList, Image, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { friendsStyles } from '../styles/components/friendsStyles';

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
        title: 'Inv Magen til BetABeer',
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
        style={styles.removeFriendButton}
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
        style={styles.addFriendButton}
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

const styles = StyleSheet.create({
  addFriendButton: {
    padding: 8,
  },
  removeFriendButton: {
    padding: 8,
  },
});

export default FriendsScreen;