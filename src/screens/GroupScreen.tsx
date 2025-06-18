import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

const ImageMissing = require('../../assets/images/image_missing.png')
const CreateBetIcon = require('../../assets/icons/noun-add-2037478.png');

type Group = {
  id: string;
  name: string;
  memberCount: number;
  image: any;
};

type BettingOption = {
  id: string;
  name: string;
  odds: number;
};

type Bet = {
  id: string;
  title: string;
  options: BettingOption[];
};

type RootTabParamList = {
  Groups: { selectedGroup?: Group };
  Profile: undefined;
  Friends: undefined;
};

type GroupScreenRouteProp = RouteProp<RootTabParamList, 'Groups'>;

const GroupScreen = () => {
  const route = useRoute<GroupScreenRouteProp>();
  const selectedGroup = route.params?.selectedGroup;

  // Default group if none selected (for when accessing from bottom tab)
  const defaultGroup: Group = {
    id: 'default',
    name: 'Alle grupper',
    memberCount: 0,
    image: ImageMissing,
  };

  const currentGroup = selectedGroup || defaultGroup;

  // Mock data for bets - replace with real data later
  const bets: Bet[] = [
    {
      id: '1',
      title: 'Hvem kommer ikke inn på byen?',
      options: [
        { id: '1a', name: 'Niklas', odds: 2.5 },
        { id: '1b', name: 'Jonas', odds: 3.2 },
        { id: '1c', name: 'Sondre', odds: 4.1 },
      ],
    },
    {
      id: '2',
      title: 'Hvem blir kastet ut først?',
      options: [
        { id: '2a', name: 'Jonas', odds: 1.8 },
        { id: '2b', name: 'Sindre', odds: 3.5 },
        { id: '2c', name: 'Niklas', odds: 4.0 },
      ],
    },
    {
      id: '3',
      title: 'Hvem kommer først hjem i dag?',
      options: [
        { id: '3a', name: 'Sondre', odds: 2.1 },
        { id: '3b', name: 'Magnus', odds: 2.8 },
        { id: '3c', name: 'Ola', odds: 3.2 },
      ],
    },
  ];

  const renderBettingOption = ({ item }: { item: BettingOption }) => (
    <TouchableOpacity style={styles.bettingOption}>
      <Text style={styles.optionName}>{item.name}</Text>
      <Text style={styles.optionOdds}>{item.odds.toFixed(1)}</Text>
    </TouchableOpacity>
  );

  const renderBet = ({ item }: { item: Bet }) => (
    <View style={styles.betContainer}>
      <Text style={styles.betTitle}>{item.title}</Text>
      <FlatList
        data={item.options}
        renderItem={renderBettingOption}
        keyExtractor={(option) => option.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Group header */}
      <View style={styles.groupHeader}>
        <Image source={currentGroup.image} style={styles.groupHeaderImage} />
        <View style={styles.groupHeaderOverlay}>
          <View style={styles.groupHeaderInfo}>
            <Text style={styles.groupHeaderName}>{currentGroup.name}</Text>
            {currentGroup.memberCount > 0 && (
              <Text style={styles.groupHeaderMembers}>
                {currentGroup.memberCount} medlemmer
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Create bet button */}
      <View style={styles.createBetSection}>
        <TouchableOpacity style={styles.createBetButton}>
          <Image 
            source={CreateBetIcon} 
            style={{ width: 24, height: 24, tintColor: '#007AFF' }} 
          />
          <Text style={styles.createBetText}>Opprett nytt bet</Text>
        </TouchableOpacity>
      </View>

      {/* Bets section */}
      <View style={styles.betsSection}>
        <Text style={styles.sectionTitle}>Aktive bets</Text>
        <FlatList
          data={bets}
          renderItem={renderBet}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  groupHeader: {
    height: 200,
    position: 'relative',
  },
  groupHeaderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  groupHeaderOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  groupHeaderInfo: {
    alignItems: 'flex-start',
  },
  groupHeaderName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  groupHeaderMembers: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  createBetSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  createBetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  createBetText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  betsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  betContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  betTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  bettingOption: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionOdds: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default GroupScreen;