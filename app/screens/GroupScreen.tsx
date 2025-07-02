import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, updateDoc, updateDoc as updateUserDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [betModalVisible, setBetModalVisible] = useState(false);
  const [betTitle, setBetTitle] = useState('');
  const [betOptions, setBetOptions] = useState([{ name: '', odds: '' }]);
  const [betSaving, setBetSaving] = useState(false);
  const [betts, setBetts] = useState<any[]>([]);
  const currentGroup = selectedGroup ? { ...selectedGroup, name: groupName } : { id: 'default', name: 'Gruppenavn', memberCount: 0, image: ImageMissing };

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
    
    Alert.alert(
      'Bekreft sletting',
      `Er du sikker på at du vil slette gruppen "${groupToDelete.name}"? Dette kan ikke angres.`,
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
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
          }
        }
      ]
    );
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

  // Hent betts for valgt gruppe
  useEffect(() => {
    if (!selectedGroup) {
      setBetts([]);
      return;
    }
    let isMounted = true;
    const fetchBetts = async () => {
      const firestore = getFirestore();
      const groupRef = doc(firestore, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      if (!isMounted) return;
      if (groupSnap.exists() && groupSnap.data().betts) {
        setBetts(groupSnap.data().betts);
      } else {
        setBetts([]);
      }
    };
    fetchBetts();
    return () => { isMounted = false; };
  }, [selectedGroup]);

  // Funksjon for å åpne bett-modal
  const openBetModal = () => {
    setBetTitle('');
    setBetOptions([{ name: '', odds: '' }]);
    setBetModalVisible(true);
  };

  // Funksjon for å legge til flere alternativer
  const addBetOption = () => {
    setBetOptions([...betOptions, { name: '', odds: '' }]);
  };

  // Funksjon for å oppdatere alternativer
  const updateBetOption = (idx: number, field: 'name' | 'odds', value: string) => {
    setBetOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, [field]: value } : opt));
  };

  // Funksjon for å lagre nytt bett
  const handleSaveBet = async () => {
    if (!selectedGroup) return;
    if (!betTitle.trim()) {
      Alert.alert('Feil', 'Bet-tittel kan ikke være tom');
      return;
    }
    if (betOptions.some(opt => !opt.name.trim() || !opt.odds.trim())) {
      Alert.alert('Feil', 'Alle alternativer må ha navn og odds');
      return;
    }
    setBetSaving(true);
    try {
      const firestore = getFirestore();
      const groupRef = doc(firestore, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      let groupBetts = [];
      if (groupSnap.exists() && groupSnap.data().betts) {
        groupBetts = groupSnap.data().betts;
      }
      const newBet = {
        id: Date.now().toString(),
        title: betTitle,
        options: betOptions.map((opt, idx) => ({ id: `${Date.now()}_${idx}`, name: opt.name, odds: parseFloat(opt.odds) })),
      };
      await updateDoc(groupRef, { betts: [...groupBetts, newBet] });
      setBetts(prev => [...prev, newBet]);
      setBetModalVisible(false);
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke lagre bett');
    } finally {
      setBetSaving(false);
    }
  };

  const renderBettingOption = ({ item }: { item: BettingOption }) => (
    <TouchableOpacity style={styles.bettingOption}>
      <Text style={styles.optionName}>{item.name}</Text>
      <Text style={styles.optionOdds}>{item.odds.toFixed(1)}</Text>
    </TouchableOpacity>
  );

  // --- Rediger bett ---
  const [editBetModalVisible, setEditBetModalVisible] = useState(false);
  const [editBetIdx, setEditBetIdx] = useState<number | null>(null);
  const [editBetTitle, setEditBetTitle] = useState('');
  const [editBetOptions, setEditBetOptions] = useState([{ name: '', odds: '' }]);
  const [editBetSaving, setEditBetSaving] = useState(false);

  const openEditBetModal = (bet: any, idx: number) => {
    setEditBetIdx(idx);
    setEditBetTitle(bet.title);
    setEditBetOptions(bet.options.map((opt: any) => ({ name: opt.name, odds: opt.odds.toString() })));
    setEditBetModalVisible(true);
  };

  const updateEditBetOption = (idx: number, field: 'name' | 'odds', value: string) => {
    setEditBetOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, [field]: value } : opt));
  };

  const addEditBetOption = () => {
    setEditBetOptions([...editBetOptions, { name: '', odds: '' }]);
  };

  const handleSaveEditBet = async () => {
    if (editBetIdx === null || !selectedGroup) return;
    if (!editBetTitle.trim()) {
      Alert.alert('Feil', 'Bet-tittel kan ikke være tom');
      return;
    }
    if (editBetOptions.some(opt => !opt.name.trim() || !opt.odds.trim())) {
      Alert.alert('Feil', 'Alle alternativer må ha navn og odds');
      return;
    }
    setEditBetSaving(true);
    try {
      const firestore = getFirestore();
      const groupRef = doc(firestore, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      let groupBetts = [];
      if (groupSnap.exists() && groupSnap.data().betts) {
        groupBetts = groupSnap.data().betts;
      }
      const updatedBet = {
        ...groupBetts[editBetIdx],
        title: editBetTitle,
        options: editBetOptions.map((opt, idx) => ({ id: `${groupBetts[editBetIdx].id}_${idx}`, name: opt.name, odds: parseFloat(opt.odds) })),
      };
      const newBetts = [...groupBetts];
      newBetts[editBetIdx] = updatedBet;
      await updateDoc(groupRef, { betts: newBetts });
      setBetts(newBetts);
      setEditBetModalVisible(false);
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke lagre endringer');
    } finally {
      setEditBetSaving(false);
    }
  };

  // Slett bett
  const handleDeleteBet = async () => {
    if (editBetIdx === null || !selectedGroup) return;
    
    Alert.alert(
      'Bekreft sletting',
      'Er du sikker på at du vil slette dette bettet? Dette kan ikke angres.',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            setEditBetSaving(true);
            try {
              const firestore = getFirestore();
              const groupRef = doc(firestore, 'groups', selectedGroup.id);
              const groupSnap = await getDoc(groupRef);
              let groupBetts = [];
              if (groupSnap.exists() && groupSnap.data().betts) {
                groupBetts = groupSnap.data().betts;
              }
              const newBetts = groupBetts.filter((_: any, idx: number) => idx !== editBetIdx);
              await updateDoc(groupRef, { betts: newBetts });
              setBetts(newBetts);
              setEditBetModalVisible(false);
            } catch (error) {
              Alert.alert('Feil', 'Kunne ikke slette bett');
            } finally {
              setEditBetSaving(false);
            }
          }
        }
      ]
    );
  };

  const renderBet = ({ item, index }: { item: any, index: number }) => (
    <View style={styles.betContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.betTitle}>{item.title}</Text>
        <TouchableOpacity onPress={() => openEditBetModal(item, index)}>
          <Image source={PencilIcon} style={{ width: 18, height: 18, tintColor: '#FFD700' }} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={item.options}
        renderItem={renderBettingOption}
        keyExtractor={(option) => option.id}
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
        scrollEnabled={false}
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

      {/* Invite friends and create bet buttons */}
      <View style={styles.createBetSection}>
        <TouchableOpacity style={[styles.createBetButton, { marginBottom: 12 }]} onPress={() => Alert.alert('Inviter venner', 'Her kan du invitere venner til gruppen (backend TODO)')}>
          <Text style={styles.createBetText}>Inviter venner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createBetButton} onPress={openBetModal}>
          <Text style={styles.createBetText}>Opprett nytt bet</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for å opprette nytt bett */}
      <Modal
        visible={betModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBetModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#23242A', borderRadius: 16, padding: 24, width: '90%' }}>
            <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Opprett nytt bet</Text>
            <TextInput
              placeholder="Tittel på bett"
              placeholderTextColor="#B0B0B0"
              value={betTitle}
              onChangeText={setBetTitle}
              style={{ backgroundColor: '#181A20', color: '#FFD700', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 16 }}
            />
            {betOptions.map((opt, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <TextInput
                  placeholder={`Alternativ ${idx + 1}`}
                  placeholderTextColor="#B0B0B0"
                  value={opt.name}
                  onChangeText={text => updateBetOption(idx, 'name', text)}
                  style={{ flex: 1, backgroundColor: '#181A20', color: '#FFD700', borderRadius: 8, padding: 10, marginRight: 8, fontSize: 15 }}
                />
                <TextInput
                  placeholder="Odds"
                  placeholderTextColor="#B0B0B0"
                  value={opt.odds}
                  onChangeText={text => updateBetOption(idx, 'odds', text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                  keyboardType="decimal-pad"
                  style={{ width: 70, backgroundColor: '#181A20', color: '#FFD700', borderRadius: 8, padding: 10, fontSize: 15 }}
                />
              </View>
            ))}
            <TouchableOpacity onPress={addBetOption} style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
              <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 15 }}>+ Legg til alternativ</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setBetModalVisible(false)} disabled={betSaving}>
                <Text style={{ color: '#B0B0B0', fontSize: 16 }}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveBet} disabled={betSaving}>
                <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>{betSaving ? 'Lagrer...' : 'Lagre bet'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bets section */}
      <View style={styles.betsSection}>
        <Text style={styles.sectionTitle}>Aktive bets</Text>
        <FlatList
          data={betts}
          renderItem={renderBet}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={{ color: '#B0B0B0', textAlign: 'center', marginTop: 20 }}>Ingen bets i denne gruppen ennå.</Text>}
        />

        {/* Modal for å redigere bett */}
        <Modal
          visible={editBetModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setEditBetModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#23242A', borderRadius: 16, padding: 24, width: '90%' }}>
              <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Rediger bet</Text>
              <TextInput
                placeholder="Tittel på bett"
                placeholderTextColor="#B0B0B0"
                value={editBetTitle}
                onChangeText={setEditBetTitle}
                style={{ backgroundColor: '#181A20', color: '#FFD700', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 16 }}
              />
              {editBetOptions.map((opt, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <TextInput
                    placeholder={`Alternativ ${idx + 1}`}
                    placeholderTextColor="#B0B0B0"
                    value={opt.name}
                    onChangeText={text => updateEditBetOption(idx, 'name', text)}
                    style={{ flex: 1, backgroundColor: '#181A20', color: '#FFD700', borderRadius: 8, padding: 10, marginRight: 8, fontSize: 15 }}
                  />
                  <TextInput
                    placeholder="Odds"
                    placeholderTextColor="#B0B0B0"
                    value={opt.odds}
                    onChangeText={text => updateEditBetOption(idx, 'odds', text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                    keyboardType="decimal-pad"
                    style={{ width: 70, backgroundColor: '#181A20', color: '#FFD700', borderRadius: 8, padding: 10, fontSize: 15 }}
                  />
                </View>
              ))}
              <TouchableOpacity onPress={addEditBetOption} style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
                <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 15 }}>+ Legg til alternativ</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
                <TouchableOpacity onPress={handleDeleteBet} disabled={editBetSaving} style={{ backgroundColor: '#B00020', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Slett bet</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => setEditBetModalVisible(false)} disabled={editBetSaving}>
                    <Text style={{ color: '#B0B0B0', fontSize: 16 }}>Avbryt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveEditBet} disabled={editBetSaving}>
                    <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>{editBetSaving ? 'Lagrer...' : 'Lagre endringer'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
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
  },
  bettingOption: {
    backgroundColor: '#181A20',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  optionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  optionOdds: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 12,
  },
});

export default GroupScreen;