import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, updateDoc, updateDoc as updateUserDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

const ImageMissing = require('../../assets/images/image_missing.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');
const DeleteIcon = require('../../assets/icons/noun-delete-7938028.png');

type DrinkType = 'øl' | 'cider' | 'hard_selzer' | 'vin' | 'sprit';
type MeasureType = 'slurker' | 'shot' | 'chug';

interface BetWager {
  userId: string;
  username: string;
  optionId: string;
  drinkType: DrinkType;
  measureType: MeasureType;
  amount: number;
  timestamp: number;
}

interface BettingOption {
  id: string;
  name: string;
  odds: number;
}

interface Bet {
  id: string;
  title: string;
  options: BettingOption[];
  wagers?: BetWager[];
  correctOptionId?: string;
  isFinished?: boolean;
}

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
  const [betts, setBetts] = useState<Bet[]>([]);
  
  // New betting states
  const [placeBetModalVisible, setPlaceBetModalVisible] = useState(false);
  const [selectedBetOption, setSelectedBetOption] = useState<{bet: Bet, option: BettingOption} | null>(null);
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType>('øl');
  const [selectedMeasureType, setSelectedMeasureType] = useState<MeasureType>('slurker');
  const [betAmount, setBetAmount] = useState('1');
  const [placingBet, setPlacingBet] = useState(false);
  const [selectCorrectModalVisible, setSelectCorrectModalVisible] = useState(false);
  const [selectCorrectBetIdx, setSelectCorrectBetIdx] = useState<number | null>(null);

  const currentGroup = selectedGroup ? { ...selectedGroup, name: groupName } : { id: 'default', name: 'Gruppenavn', memberCount: 0, image: ImageMissing };

  const drinkTypes: DrinkType[] = ['øl', 'cider', 'hard_selzer', 'vin', 'sprit'];
  const measureTypes: MeasureType[] = ['slurker', 'shot', 'chug'];

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

  // Get betts for selected group
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

  const openBetModal = () => {
    setBetTitle('');
    setBetOptions([{ name: '', odds: '' }]);
    setBetModalVisible(true);
  };

  const addBetOption = () => {
    setBetOptions([...betOptions, { name: '', odds: '' }]);
  };

  const updateBetOption = (idx: number, field: 'name' | 'odds', value: string) => {
    setBetOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, [field]: value } : opt));
  };

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
      const newBet: Bet = {
        id: Date.now().toString(),
        title: betTitle,
        options: betOptions.map((opt, idx) => ({ id: `${Date.now()}_${idx}`, name: opt.name, odds: parseFloat(opt.odds) })),
        wagers: [],
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

  // New function to open place bet modal
  const openPlaceBetModal = (bet: Bet, option: BettingOption) => {
    setSelectedBetOption({ bet, option });
    setBetAmount('1');
    setSelectedDrinkType('øl');
    setSelectedMeasureType('slurker');
    setPlaceBetModalVisible(true);
  };

  // New function to place a bet
  const handlePlaceBet = async () => {
    if (!selectedBetOption || !user || !selectedGroup) return;
    
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Feil', 'Ugyldig antall');
      return;
    }

    setPlacingBet(true);
    try {
      const firestore = getFirestore();
      const groupRef = doc(firestore, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      
      if (groupSnap.exists()) {
        const groupBetts: Bet[] = groupSnap.data().betts || [];
        const betIndex = groupBetts.findIndex(b => b.id === selectedBetOption.bet.id);
        
        if (betIndex !== -1) {
          const updatedBetts = [...groupBetts];
          const wagers = updatedBetts[betIndex].wagers || [];
          
          // Check if user already has a wager on this bet
          const existingWagerIndex = wagers.findIndex(w => w.userId === user.id);
          
          const newWager: BetWager = {
            userId: user.id,
            username: user.username,
            optionId: selectedBetOption.option.id,
            drinkType: selectedDrinkType,
            measureType: selectedMeasureType,
            amount: amount,
            timestamp: Date.now(),
          };

          if (existingWagerIndex !== -1) {
            // Update existing wager
            wagers[existingWagerIndex] = newWager;
          } else {
            // Add new wager
            wagers.push(newWager);
          }

          updatedBetts[betIndex].wagers = wagers;
          await updateDoc(groupRef, { betts: updatedBetts });
          setBetts(updatedBetts);
          setPlaceBetModalVisible(false);
          Alert.alert('Suksess', 'Bet plassert!');
        }
      }
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke plassere bet');
      console.error('Place bet error:', error);
    } finally {
      setPlacingBet(false);
    }
  };

  // Get user's current wager for a bet
  const getUserWagerForBet = (bet: Bet): BetWager | null => {
    if (!bet.wagers || !user) return null;
    return bet.wagers.find(w => w.userId === user.id) || null;
  };

  // Get option name by id
  const getOptionName = (bet: Bet, optionId: string): string => {
    const option = bet.options.find(o => o.id === optionId);
    return option ? option.name : 'Ukjent alternativ';
  };

  const renderBettingOption = ({ item: option, bet }: { item: BettingOption, bet: Bet }) => {
    const userWager = getUserWagerForBet(bet);
    const isUserChoice = userWager?.optionId === option.id;
    const isCorrect = bet.correctOptionId === option.id;
    const isBetFinished = bet.isFinished;
    
    return (
      <TouchableOpacity 
        style={[
          styles.bettingOption, 
          isUserChoice && styles.bettingOptionSelected,
          isCorrect && styles.bettingOptionCorrect,
          isBetFinished && !isCorrect && styles.bettingOptionIncorrect
        ]} 
        onPress={() => !isBetFinished && openPlaceBetModal(bet, option)}
        disabled={isBetFinished}
      >
        <View style={{ flex: 1 }}>
          <Text style={[
            styles.optionName, 
            isUserChoice && styles.optionNameSelected,
            isCorrect && styles.optionNameCorrect,
            isBetFinished && !isCorrect && styles.optionNameIncorrect
          ]}>
            {option.name} {isCorrect && '✓'}
          </Text>
          {isUserChoice && userWager && (
            <Text style={[
              styles.userWagerText,
              isCorrect && styles.userWagerTextCorrect
            ]}>
              Ditt bet: {userWager.amount} {userWager.measureType} {userWager.drinkType}
            </Text>
          )}
        </View>
        <Text style={[
          styles.optionOdds, 
          isUserChoice && styles.optionOddsSelected,
          isCorrect && styles.optionOddsCorrect,
          isBetFinished && !isCorrect && styles.optionOddsIncorrect
        ]}>
          {option.odds.toFixed(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  // Edit bett
  const [editBetModalVisible, setEditBetModalVisible] = useState(false);
  const [editBetIdx, setEditBetIdx] = useState<number | null>(null);
  const [editBetTitle, setEditBetTitle] = useState('');
  const [editBetOptions, setEditBetOptions] = useState([{ name: '', odds: '' }]);
  const [editBetSaving, setEditBetSaving] = useState(false);

  const openEditBetModal = (bet: any, idx: number) => {
    setEditBetIdx(idx);
    setEditBetTitle(bet.title);
    setEditBetOptions(bet.options.map((opt: any) => ({ name: opt.name, odds: opt.odds.toString() })));
    
    // Hvis bettet allerede er ferdig/har korrekt svar, åpne modal for å administrere det
    if (bet.correctOptionId || bet.isFinished) {
      setSelectCorrectBetIdx(idx);
      setSelectCorrectModalVisible(true);
    } else {
      // Hvis bettet ikke er ferdig, gi brukeren valg mellom å redigere eller ferdigstille
      Alert.alert(
        'Administrer bet',
        'Hva vil du gjøre med dette bettet?',
        [
          {
            text: 'Rediger bet',
            onPress: () => setEditBetModalVisible(true)
          },
          {
            text: 'Marker som ferdig',
            onPress: () => {
              setSelectCorrectBetIdx(idx);
              setSelectCorrectModalVisible(true);
            }
          },
          {
            text: 'Avbryt',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const handleSelectCorrectOption = async (optionId: string | null) => {
    if (selectCorrectBetIdx === null || !selectedGroup) return;
    
    try {
      const firestore = getFirestore();
      const groupRef = doc(firestore, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      
      if (groupSnap.exists()) {
        const groupBetts = groupSnap.data().betts || [];
        const newBetts = [...groupBetts];
        
        if (optionId === null) {
          // Fjern korrekt svar og gjør bettet aktivt igjen
          delete newBetts[selectCorrectBetIdx].correctOptionId;
          newBetts[selectCorrectBetIdx].isFinished = false;
        } else {
          // Sett korrekt svar og ferdigstill bettet
          newBetts[selectCorrectBetIdx].correctOptionId = optionId;
          newBetts[selectCorrectBetIdx].isFinished = true;
        }
        
        await updateDoc(groupRef, { betts: newBetts });
        setBetts(newBetts);
        setSelectCorrectModalVisible(false);
        
        Alert.alert('Suksess', optionId ? 'Riktig alternativ er markert!' : 'Bettet er aktivt igjen!');
      }
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke oppdatere bett');
      console.error('Select correct option error:', error);
    }
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

  const renderBet = ({ item, index }: { item: Bet, index: number }) => {
    const userWager = getUserWagerForBet(item);
    
    return (
      <View style={styles.betContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.betTitle}>{item.title}</Text>
            {item.isFinished && (
              <Text style={styles.betStatusText}>
                Ferdig - Riktig svar: {getOptionName(item, item.correctOptionId || '')}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => openEditBetModal(item, index)}>
            <Image source={PencilIcon} style={{ width: 18, height: 18, tintColor: '#FFD700' }} />
          </TouchableOpacity>
        </View>
        
        {userWager && (
          <View style={[
            styles.userBetSummary,
            item.isFinished && item.correctOptionId === userWager.optionId && styles.userBetSummaryWin,
            item.isFinished && item.correctOptionId !== userWager.optionId && styles.userBetSummaryLose
          ]}>
            <Text style={[
              styles.userBetSummaryText,
              item.isFinished && item.correctOptionId === userWager.optionId && styles.userBetSummaryTextWin,
              item.isFinished && item.correctOptionId !== userWager.optionId && styles.userBetSummaryTextLose
            ]}>
              Du har satset: {userWager.amount} {userWager.measureType} {userWager.drinkType} på "{getOptionName(item, userWager.optionId)}"
              {item.isFinished && (item.correctOptionId === userWager.optionId ? ' - DU VANT! 🎉' : ' - Du tapte 😢')}
            </Text>
          </View>
        )}
        
        <FlatList
          data={item.options}
          renderItem={({item: option}) => renderBettingOption({item: option, bet: item})}
          keyExtractor={(option) => option.id}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.optionsContainer}
          scrollEnabled={false}
        />
        
        {/* Show wagers summary */}
        {item.wagers && item.wagers.length > 0 && (
          <View style={styles.wagersSection}>
            <Text style={styles.wagersSectionTitle}>Plasserte bets ({item.wagers.length}):</Text>
            {item.wagers.map((wager, idx) => (
              <View key={idx} style={styles.wagerItem}>
                <Text style={styles.wagerUser}>{wager.username}</Text>
                <Text style={styles.wagerDetails}>
                  {wager.amount} {wager.measureType} {wager.drinkType} på "{getOptionName(item, wager.optionId)}"
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

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
      {/* Group-header */}
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
                  <>
                    <TouchableOpacity onPress={() => setEditingName(true)} style={{ marginLeft: 8 }}>
                      <Image source={PencilIcon} style={{ width: 20, height: 20, tintColor: '#FFD700' }} />
                    </TouchableOpacity>
                    {selectedGroup.createdBy === user?.id && (
                      <TouchableOpacity 
                        onPress={handleDeleteGroup} 
                        disabled={deleting}
                        style={{ marginLeft: 8, opacity: deleting ? 0.5 : 1 }}
                      >
                        <Image source={DeleteIcon} style={{ width: 20, height: 20, tintColor: '#FF6B6B' }} />
                      </TouchableOpacity>
                    )}
                  </>
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

      {/* Bets List */}
      <FlatList
        data={betts}
        renderItem={renderBet}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Modal for creating bet */}
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

      {/* Modal for placing bet */}
      <Modal
        visible={placeBetModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPlaceBetModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#23242A', borderRadius: 16, padding: 24, width: '90%' }}>
            <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Plasser bet</Text>
            
            {selectedBetOption && (
              <>
                <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>
                  Bet: {selectedBetOption.bet.title}
                </Text>
                <Text style={{ color: '#FFD700', fontSize: 16, marginBottom: 16 }}>
                  Alternativ: {selectedBetOption.option.name} (odds: {selectedBetOption.option.odds})
                </Text>
              </>
            )}

            {/* Drink Type Selection */}
            <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>Type drikke:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {drinkTypes.map((drinkType) => (
                <TouchableOpacity
                  key={drinkType}
                  style={[
                    styles.selectionButton,
                    selectedDrinkType === drinkType && styles.selectionButtonSelected
                  ]}
                  onPress={() => setSelectedDrinkType(drinkType)}
                >
                  <Text style={[
                    styles.selectionButtonText,
                    selectedDrinkType === drinkType && styles.selectionButtonTextSelected
                  ]}>
                    {drinkType}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Measure Type Selection */}
            <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>Måleenhet:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {measureTypes.map((measureType) => (
                <TouchableOpacity
                  key={measureType}
                  style={[
                    styles.selectionButton,
                    selectedMeasureType === measureType && styles.selectionButtonSelected
                  ]}
                  onPress={() => setSelectedMeasureType(measureType)}
                >
                  <Text style={[
                    styles.selectionButtonText,
                    selectedMeasureType === measureType && styles.selectionButtonTextSelected
                  ]}>
                    {measureType}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Amount Input */}
            <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>Antall:</Text>
            <TextInput
              placeholder="Antall"
              placeholderTextColor="#B0B0B0"
              value={betAmount}
              onChangeText={setBetAmount}
              keyboardType="numeric"
              style={{ backgroundColor: '#181A20', color: '#FFD700', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 16 }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setPlaceBetModalVisible(false)} disabled={placingBet}>
                <Text style={{ color: '#B0B0B0', fontSize: 16 }}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePlaceBet} disabled={placingBet}>
                <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>
                  {placingBet ? 'Plasserer...' : 'Plasser bet'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for editing bet */}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity onPress={handleDeleteBet} disabled={editBetSaving}>
                <Text style={{ color: '#FF6B6B', fontWeight: 'bold', fontSize: 16 }}>Slett bet</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setEditBetModalVisible(false)} disabled={editBetSaving}>
                  <Text style={{ color: '#B0B0B0', fontSize: 16 }}>Avbryt</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEditBet} disabled={editBetSaving}>
                  <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>
                    {editBetSaving ? 'Lagrer...' : 'Lagre endringer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for selecting correct option */}
      <Modal
        visible={selectCorrectModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectCorrectModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#23242A', borderRadius: 16, padding: 24, width: '90%' }}>
            <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
              {selectCorrectBetIdx !== null && betts[selectCorrectBetIdx]?.isFinished 
                ? 'Administrer ferdig bet' 
                : 'Velg riktig alternativ'}
            </Text>
            
            {selectCorrectBetIdx !== null && (
              <>
                <Text style={{ color: '#fff', fontSize: 16, marginBottom: 16 }}>
                  {betts[selectCorrectBetIdx]?.title}
                </Text>
                
                {betts[selectCorrectBetIdx]?.isFinished && (
                  <TouchableOpacity
                    style={[styles.selectionButton, { marginBottom: 16, backgroundColor: '#FF6B6B' }]}
                    onPress={() => handleSelectCorrectOption(null)}
                  >
                    <Text style={[styles.selectionButtonText, { color: '#fff' }]}>
                      Gjør bettet aktivt igjen
                    </Text>
                  </TouchableOpacity>
                )}
                
                <Text style={{ color: '#fff', fontSize: 14, marginBottom: 12 }}>
                  {betts[selectCorrectBetIdx]?.isFinished ? 'Eller velg nytt riktig alternativ:' : 'Velg riktig alternativ:'}
                </Text>
                
                {betts[selectCorrectBetIdx]?.options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.selectionButton,
                      { marginBottom: 8, width: '100%' },
                      betts[selectCorrectBetIdx]?.correctOptionId === option.id && styles.selectionButtonSelected
                    ]}
                    onPress={() => handleSelectCorrectOption(option.id)}
                  >
                    <Text style={[
                      styles.selectionButtonText,
                      betts[selectCorrectBetIdx]?.correctOptionId === option.id && styles.selectionButtonTextSelected
                    ]}>
                      {option.name} (odds: {option.odds})
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
              <TouchableOpacity onPress={() => setSelectCorrectModalVisible(false)}>
                <Text style={{ color: '#B0B0B0', fontSize: 16 }}>Avbryt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  groupHeaderInfo: {
    alignItems: 'flex-start',
  },
  groupHeaderName: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  groupHeaderMembers: {
    color: '#B0B0B0',
    fontSize: 14,
    marginTop: 4,
  },
  createBetSection: {
    padding: 20,
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
    marginBottom: 12,
  },
  createBetText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
  betContainer: {
    backgroundColor: '#23242A',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  betTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  userBetSummary: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  userBetSummaryText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  optionsContainer: {
    paddingVertical: 8,
  },
  bettingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  bettingOptionSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  optionName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  optionNameSelected: {
    color: '#000',
  },
  optionOdds: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionOddsSelected: {
    color: '#000',
  },
  userWagerText: {
    color: '#000',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  wagersSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  wagersSectionTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wagerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  wagerUser: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  wagerDetails: {
    color: '#B0B0B0',
    fontSize: 12,
    flex: 2,
    textAlign: 'right',
  },
  selectionButton: {
    backgroundColor: '#181A20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectionButtonSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  selectionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectionButtonTextSelected: {
    color: '#000',
  },
  betStatusText: {
    color: '#B0B0B0',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  bettingOptionCorrect: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  bettingOptionIncorrect: {
    backgroundColor: '#333',
    borderColor: '#333',
    opacity: 0.7,
  },
  optionNameCorrect: {
    color: '#fff',
    fontWeight: 'bold',
  },
  optionNameIncorrect: {
    color: '#999',
  },
  optionOddsCorrect: {
    color: '#fff',
  },
  optionOddsIncorrect: {
    color: '#999',
  },
  userBetSummaryWin: {
    backgroundColor: '#4CAF50',
  },
  userBetSummaryLose: {
    backgroundColor: '#F44336',
  },
  userBetSummaryTextWin: {
    color: '#fff',
  },
  userBetSummaryTextLose: {
    color: '#fff',
  },
  userWagerTextCorrect: {
    color: '#fff',
  },
});

export default GroupScreen;