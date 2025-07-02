import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, updateDoc, updateDoc as updateUserDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

const ImageMissing = require('../../assets/images/image_missing.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');

const GroupScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(selectedGroup ? selectedGroup.name : '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const currentGroup = selectedGroup ? { ...selectedGroup, name: groupName } : { id: 'default', name: 'Sist valgte gruppe', memberCount: 0, image: ImageMissing };

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchGroups = async () => {
      const firestore = getFirestore();
      const q = query(collection(firestore, 'groups'), where('members', 'array-contains', user.id));
      const snapshot = await getDocs(q);
      if (!isMounted) return;
      const groupList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        name: docSnap.data().name,
        memberCount: docSnap.data().members.length,
        image: ImageMissing,
        createdBy: docSnap.data().createdBy,
      }));
      setGroups(groupList);
      let groupFromParams = null;
      if (params.selectedGroup) {
        try {
          if (Array.isArray(params.selectedGroup)) {
            groupFromParams = JSON.parse(params.selectedGroup[0]);
          } else {
            groupFromParams = JSON.parse(params.selectedGroup);
          }
        } catch (e) {
          groupFromParams = null;
        }
      }
      let foundGroup = null;
      if (groupFromParams) {
        foundGroup = groupList.find(g => g.id === groupFromParams.id);
      }
      if (foundGroup) {
        setSelectedGroup(foundGroup);
      } else if (groupList.length > 0) {
        setSelectedGroup(groupList[0]);
      } else {
        setSelectedGroup(null);
      }
    };
    fetchGroups();
    return () => { isMounted = false; };
  }, [user, params.selectedGroup]);

  React.useEffect(() => {
    if (selectedGroup && selectedGroup.name !== groupName) {
      setGroupName(selectedGroup.name);
    }
  }, [selectedGroup]);

  const handleDeleteGroup = async () => {
    const groupToDelete = currentGroup;
    if (!groupToDelete || groupToDelete.id === 'default') return;
    setDeleting(true);
    try {
      const firestore = getFirestore();
      await deleteDoc(doc(firestore, 'groups', groupToDelete.id));
      const userId = groupToDelete.createdBy;
      if (userId) {
        const userRef = doc(firestore, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userGroups: string[] = userSnap.data().groups || [];
          const updatedGroups = userGroups.filter((gid: string) => gid !== groupToDelete.id);
          await updateUserDoc(userRef, { groups: updatedGroups });
        }
      }
      Alert.alert('Slettet', 'Gruppen er slettet.');
      router.replace('/profile');
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke slette gruppe.');
    } finally {
      setDeleting(false);
    }
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

  const handleSaveGroupName = async () => {
    if (!selectedGroup) return;
    if (!groupName.trim()) {
      Alert.alert('Feil', 'Gruppenavn kan ikke være tomt');
      return;
    }
    setSaving(true);
    try {
      const firestore = getFirestore();
      await updateDoc(doc(firestore, 'groups', selectedGroup.id), { name: groupName });
      setEditingName(false);
      Alert.alert('Gruppenavn oppdatert!');
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke oppdatere gruppenavn');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Gruppe-header */}
      <View style={styles.groupHeader}>
        <Image source={currentGroup.image} style={styles.groupHeaderImage} />
        <View style={styles.groupHeaderOverlay}>
          <View style={styles.groupHeaderInfo}>
            {editingName ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  value={groupName}
                  onChangeText={setGroupName}
                  style={{
                    color: '#FFD700',
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: '#23242A',
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    marginRight: 8,
                    minWidth: 120,
                  }}
                  editable={!saving}
                  autoFocus
                  placeholder="Gruppenavn"
                  placeholderTextColor="#B0B0B0"
                  onSubmitEditing={handleSaveGroupName}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={handleSaveGroupName} disabled={saving} style={{ marginRight: 8 }}>
                  <Image source={PencilIcon} style={{ width: 20, height: 20, tintColor: '#FFD700' }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingName(false)} disabled={saving}>
                  <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>Avbryt</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.groupHeaderName}>{currentGroup.name}</Text>
                {selectedGroup && (
                  <TouchableOpacity onPress={() => setEditingName(true)} style={{ marginLeft: 8 }}>
                    <Image source={PencilIcon} style={{ width: 20, height: 20, tintColor: '#FFD700' }} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text style={styles.groupHeaderMembers}>{currentGroup.memberCount} medlemmer</Text>
          </View>
        </View>
      </View>

      {/* Create bet button */}
      <View style={styles.createBetSection}>
        <TouchableOpacity style={styles.createBetButton}>
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
      {/* Slett gruppe knapp */}
      {selectedGroup && selectedGroup.id !== 'default' && (
        <View style={{ padding: 20 }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#B00020',
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 20,
              borderWidth: 1,
              borderColor: '#FFD700',
            }}
            onPress={handleDeleteGroup}
            disabled={deleting}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              {deleting ? 'Sletter...' : 'Slett gruppe'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
  },
  groupHeader: {
    height: 260,
    position: 'relative',
  },
  groupHeaderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.7,
  },
  groupHeaderOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(24, 26, 32, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  groupHeaderInfo: {
    alignItems: 'flex-start',
  },
  groupHeaderName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  groupHeaderMembers: {
    fontSize: 16,
    color: '#FFD700',
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
    backgroundColor: '#23242A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  createBetText: {
    fontSize: 16,
    color: '#FFD700',
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
    color: '#FFD700',
    marginBottom: 20,
  },
  betContainer: {
    backgroundColor: '#23242A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  betTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bettingOption: {
    backgroundColor: '#181A20',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  optionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionOdds: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
});

export default GroupScreen;