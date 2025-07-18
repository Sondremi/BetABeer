import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, updateDoc, updateDoc as updateUserDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { groupStyles } from '../styles/components/groupStyles';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import { showAlert } from '../utils/platformAlert';

const ImageMissing = require('../../assets/images/image_missing.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');
const DeleteIcon = require('../../assets/icons/noun-delete-7938028.png');

type DrinkType = 'Øl' | 'Cider' | 'Hard selzer' | 'Vin' | 'Sprit';
type MeasureType = 'Slurker' | 'Shot' | 'Chug';

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

interface MemberDrinkStats {
  userId: string;
  username: string;
  wins: number;
  drinksToConsume: { [key in DrinkType]?: { [key in MeasureType]?: number } };
  drinksToDistribute: { [key in DrinkType]?: { [key in MeasureType]?: number } };
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
  const [betOptions, setBetOptions] = useState<{ name: string; odds: string }[]>([{ name: '', odds: '' }]);
  const [betSaving, setBetSaving] = useState(false);
  const [bets, setBets] = useState<Bet[]>([]);
  const [placeBetModalVisible, setPlaceBetModalVisible] = useState(false);
  const [selectedBetOption, setSelectedBetOption] = useState<{ bet: Bet; option: BettingOption } | null>(null);
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType>('Øl');
  const [selectedMeasureType, setSelectedMeasureType] = useState<MeasureType>('Slurker');
  const [betAmount, setBetAmount] = useState('1');
  const [placingBet, setPlacingBet] = useState(false);
  const [selectCorrectModalVisible, setSelectCorrectModalVisible] = useState(false);
  const [selectCorrectBetIdx, setSelectCorrectBetIdx] = useState<number | null>(null);
  const [editBetModalVisible, setEditBetModalVisible] = useState(false);
  const [editBetIdx, setEditBetIdx] = useState<number | null>(null);
  const [editBetTitle, setEditBetTitle] = useState('');
  const [editBetOptions, setEditBetOptions] = useState<{ name: string; odds: string }[]>([]);
  const [editBetSaving, setEditBetSaving] = useState(false);
  const [leaderboardModalVisible, setLeaderboardModalVisible] = useState(false);
  const [editMenuModalVisible, setEditMenuModalVisible] = useState(false);
  const [selectedEditBet, setSelectedEditBet] = useState<{ bet: Bet; index: number } | null>(null);

  const currentGroup = selectedGroup ? { ...selectedGroup, name: groupName } : { id: 'default', name: 'Gruppenavn', memberCount: 0, image: ImageMissing };

  const drinkTypes: DrinkType[] = ['Øl', 'Cider', 'Hard selzer', 'Vin', 'Sprit'];
  const measureTypes: MeasureType[] = ['Slurker', 'Shot', 'Chug'];

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
        members: docSnap.data().members,
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
    return () => {
      isMounted = false;
    };
  }, [user, params.selectedGroup]);

  useEffect(() => {
    if (selectedGroup && selectedGroup.name !== groupName) {
      setGroupName(selectedGroup.name);
    }
  }, [selectedGroup]);

  const handleDeleteGroup = async () => {
    const groupToDelete = currentGroup;
    if (!groupToDelete || groupToDelete.id === 'default') return;

    showAlert(
      'Bekreft sletting',
      `Er du sikker på at du vil slette gruppen "${groupToDelete.name}"? Dette kan ikke angres.`,
      [
        { text: 'Avbryt', style: 'cancel' },
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
              router.replace('/profile');
            } catch (error) {
              showAlert('Feil', 'Kunne ikke slette gruppe.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (!selectedGroup) {
      setBets([]);
      return;
    }
    let isMounted = true;
    const fetchBets = async () => {
      const firestore = getFirestore();
      const groupRef = doc(firestore, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      if (!isMounted) return;
      if (groupSnap.exists() && groupSnap.data().bets) {
        setBets(groupSnap.data().bets);
      } else {
        setBets([]);
      }
    };
    fetchBets();
    return () => {
      isMounted = false;
    };
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
    setBetOptions(prev => prev.map((opt, i) => (i === idx ? { ...opt, [field]: value } : opt)));
  };

  const handleSaveBet = async () => {
    if (!selectedGroup) return;
    if (!betTitle.trim()) {
      showAlert('Feil', 'Bet-tittel kan ikke være tom');
      return;
    }
    if (betOptions.some(opt => !opt.name.trim() || !opt.odds.trim())) {
      showAlert('Feil', 'Alle alternativer må ha navn og odds');
      return;
    }
    setBetSaving(true);
    try {
      const firestore = getFirestore();
      const groupRef = doc(firestore, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      let groupBets: Bet[] = [];
      if (groupSnap.exists() && groupSnap.data().bets) {
        groupBets = groupSnap.data().bets;
      }
      const newBet: Bet = {
        id: Date.now().toString(),
        title: betTitle,
        options: betOptions.map((opt, idx) => ({
          id: `${Date.now()}_${idx}`,
          name: opt.name,
          odds: parseFloat(opt.odds),
        })),
        wagers: [],
      };
      await updateDoc(groupRef, { bets: [...groupBets, newBet] });
      setBets(prev => [...prev, newBet]);
      setBetModalVisible(false);
    } catch (error) {
      showAlert('Feil', 'Kunne ikke lagre bet');
    } finally {
      setBetSaving(false);
    }
  };

  const openPlaceBetModal = (bet: Bet, option: BettingOption) => {
    setSelectedBetOption({ bet, option });
    setBetAmount('1');
    setSelectedDrinkType('Øl');
    setSelectedMeasureType('Slurker');
    setPlaceBetModalVisible(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBetOption || !user || !selectedGroup) return;

    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0) {
      showAlert('Feil', 'Ugyldig antall');
      return;
    }

    setPlacingBet(true);
    try {
      const firestore = getFirestore();
      const groupRef = doc(firestore, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);

      if (groupSnap.exists()) {
        const groupBets: Bet[] = groupSnap.data().bets || [];
        const betIndex = groupBets.findIndex(b => b.id === selectedBetOption.bet.id);

        if (betIndex !== -1) {
          const updatedBets = [...groupBets];
          const wagers = updatedBets[betIndex].wagers || [];

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
            wagers[existingWagerIndex] = newWager;
          } else {
            wagers.push(newWager);
          }

          updatedBets[betIndex].wagers = wagers;
          await updateDoc(groupRef, { bets: updatedBets });
          setBets(updatedBets);
          setPlaceBetModalVisible(false);
        }
      }
    } catch (error) {
      showAlert('Feil', 'Kunne ikke plassere bet');
      console.error('Place bet error:', error);
    } finally {
      setPlacingBet(false);
    }
  };

  const getUserWagerForBet = (bet: Bet): BetWager | null => {
    if (!bet.wagers || !user) return null;
    return bet.wagers.find(w => w.userId === user.id) || null;
  };

  const getOptionName = (bet: Bet, optionId: string): string => {
    const option = bet.options.find(o => o.id === optionId);
    return option ? option.name : 'Ukjent alternativ';
  };

  const renderBettingOption = ({ item: option, bet }: { item: BettingOption; bet: Bet }) => {
    const userWager = getUserWagerForBet(bet);
    const isUserChoice = userWager?.optionId === option.id;
    const isCorrect = bet.correctOptionId === option.id;
    const isBetFinished = bet.isFinished;

    return (
      <TouchableOpacity
        style={[
          groupStyles.bettingOption,
          isUserChoice && groupStyles.bettingOptionSelected,
          isCorrect && groupStyles.bettingOptionCorrect,
          isBetFinished && !isCorrect && groupStyles.bettingOptionIncorrect,
        ]}
        onPress={() => !isBetFinished && openPlaceBetModal(bet, option)}
        disabled={isBetFinished}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              groupStyles.optionName,
              isUserChoice && groupStyles.optionNameSelected,
              isCorrect && groupStyles.optionNameCorrect,
              isBetFinished && !isCorrect && groupStyles.optionNameIncorrect,
            ]}
          >
            {option.name} {isCorrect && '✓'}
          </Text>
          {isUserChoice && userWager && (
            <Text
              style={[
                groupStyles.userWagerText,
                isCorrect && groupStyles.userWagerTextCorrect,
              ]}
            >
              Ditt bet: {userWager.amount} {userWager.measureType} {userWager.drinkType}
            </Text>
          )}
        </View>
        <Text
          style={[
            groupStyles.optionOdds,
            isUserChoice && groupStyles.optionOddsSelected,
            isCorrect && groupStyles.optionOddsCorrect,
            isBetFinished && !isCorrect && groupStyles.optionOddsIncorrect,
          ]}
        >
          {option.odds.toFixed(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  const openEditBetModal = (bet: Bet, idx: number) => {
    setSelectedEditBet({ bet, index: idx });
    setEditMenuModalVisible(true);
  };

  const handleSelectCorrectOption = async (optionId: string | null) => {
    if (selectCorrectBetIdx === null || !selectedGroup) return;

    try {
      const firestore = getFirestore();
      const groupRef = doc(firestore, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);

      if (groupSnap.exists()) {
        const groupBets = groupSnap.data().bets || [];
        const newBets = [...groupBets];

        if (optionId === null) {
          delete newBets[selectCorrectBetIdx].correctOptionId;
          newBets[selectCorrectBetIdx].isFinished = false;
        } else {
          newBets[selectCorrectBetIdx].correctOptionId = optionId;
          newBets[selectCorrectBetIdx].isFinished = true;
        }

        await updateDoc(groupRef, { bets: newBets });
        setBets(newBets);
        setSelectCorrectModalVisible(false);
      }
    } catch (error) {
      showAlert('Feil', 'Kunne ikke oppdatere bet');
      console.error('Select correct option error:', error);
    }
  };

  const updateEditBetOption = (idx: number, field: 'name' | 'odds', value: string) => {
    setEditBetOptions(prev => prev.map((opt, i) => (i === idx ? { ...opt, [field]: value } : opt)));
  };

  const addEditBetOption = () => {
    setEditBetOptions([...editBetOptions, { name: '', odds: '' }]);
  };

  const handleSaveEditBet = async () => {
    if (editBetIdx === null || !selectedGroup) return;
    if (!editBetTitle.trim()) {
      showAlert('Feil', 'Bet-tittel kan ikke være tom');
      return;
    }
    if (editBetOptions.some(opt => !opt.name.trim() || !opt.odds.trim())) {
      showAlert('Feil', 'Alle alternativer må ha navn og odds');
      return;
    }
    setEditBetSaving(true);
    try {
      const firestore = getFirestore();
      const groupRef = doc(firestore, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      let groupBets: Bet[] = [];
      if (groupSnap.exists() && groupSnap.data().bets) {
        groupBets = groupSnap.data().bets;
      }
      const updatedBet = {
        ...groupBets[editBetIdx],
        title: editBetTitle,
        options: editBetOptions.map((opt, idx) => ({
          id: `${groupBets[editBetIdx].id}_${idx}`,
          name: opt.name,
          odds: parseFloat(opt.odds),
        })),
      };
      const newBets = [...groupBets];
      newBets[editBetIdx] = updatedBet;
      await updateDoc(groupRef, { bets: newBets });
      setBets(newBets);
      setEditBetModalVisible(false);
    } catch (error) {
      showAlert('Feil', 'Kunne ikke lagre endringer');
    } finally {
      setEditBetSaving(false);
    }
  };

  const handleDeleteBet = async () => {
    if (editBetIdx === null || !selectedGroup) return;

    showAlert(
      'Bekreft sletting',
      'Er du sikker på at du vil slette dette bettet? Dette kan ikke angres.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            setEditBetSaving(true);
            try {
              const firestore = getFirestore();
              const groupRef = doc(firestore, 'groups', selectedGroup.id);
              const groupSnap = await getDoc(groupRef);
              let groupBets: Bet[] = [];
              if (groupSnap.exists() && groupSnap.data().bets) {
                groupBets = groupSnap.data().bets;
              }
              const newBets = groupBets.filter((_, idx: number) => idx !== editBetIdx);
              await updateDoc(groupRef, { bets: newBets });
              setBets(newBets);
              setEditBetModalVisible(false);
            } catch (error) {
              showAlert('Feil', 'Kunne ikke slette bet');
            } finally {
              setEditBetSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveGroupName = async () => {
    if (!selectedGroup) return;
    if (!groupName.trim()) {
      showAlert('Feil', 'Gruppenavn kan ikke være tomt');
      return;
    }
    setSaving(true);
    try {
      const firestore = getFirestore();
      await updateDoc(doc(firestore, 'groups', selectedGroup.id), { name: groupName });
      setEditingName(false);
    } catch (error) {
      showAlert('Feil', 'Kunne ikke oppdatere gruppenavn');
    } finally {
      setSaving(false);
    }
  };

  const getLeaderboardData = (): MemberDrinkStats[] => {
    if (!selectedGroup || !selectedGroup.members) return [];

    const finishedBets = bets.filter(bet => bet.isFinished && bet.correctOptionId);
    const memberStats: { [userId: string]: MemberDrinkStats } = {};

    selectedGroup.members.forEach((userId: string) => {
      memberStats[userId] = {
        userId,
        username: '',
        wins: 0,
        drinksToConsume: {},
        drinksToDistribute: {},
      };
    });

    finishedBets.forEach(bet => {
      const wagers = bet.wagers || [];
      const totalWagers = wagers.length;
      const winners = wagers.filter(wager => wager.optionId === bet.correctOptionId);
      const losers = wagers.filter(wager => wager.optionId !== bet.correctOptionId);

      wagers.forEach(wager => {
        const stats = memberStats[wager.userId];
        if (!stats) return;

        stats.username = wager.username;
        const drinkType = wager.drinkType;
        const measureType = wager.measureType;
        const amount = wager.amount;

        if (!stats.drinksToConsume[drinkType]) {
          stats.drinksToConsume[drinkType] = {};
        }
        if (!stats.drinksToDistribute[drinkType]) {
          stats.drinksToDistribute[drinkType] = {};
        }
        if (!stats.drinksToConsume[drinkType][measureType]) {
          stats.drinksToConsume[drinkType][measureType] = 0;
        }
        if (!stats.drinksToDistribute[drinkType][measureType]) {
          stats.drinksToDistribute[drinkType][measureType] = 0;
        }

        if (wager.optionId === bet.correctOptionId) {
          stats.wins += 1;
          if (losers.length > 0) {
            const distributeAmount = amount * losers.length;
            stats.drinksToDistribute[drinkType][measureType]! += distributeAmount;
            console.log(`User ${wager.username} won, distributing ${distributeAmount} ${measureType} of ${drinkType} to ${losers.length} losers`);
          } else {
            console.log(`User ${wager.username} won, but no losers to distribute to`);
          }
        } else {
          stats.drinksToConsume[drinkType][measureType]! += amount;
          console.log(`User ${wager.username} lost, consuming ${amount} ${measureType} of ${drinkType}`);
        }
      });
    });

    const result = Object.values(memberStats).sort((a, b) => b.wins - a.wins);
    return result;
  };

  const formatDrinks = (drinks: { [key in DrinkType]?: { [key in MeasureType]?: number } }): string => {
    const drinkStrings: string[] = [];
    drinkTypes.forEach(drinkType => {
      measureTypes.forEach(measureType => {
        const amount = drinks[drinkType]?.[measureType] || 0;
        if (amount > 0) {
          drinkStrings.push(`${amount} ${measureType} ${drinkType}`);
        }
      });
    });
    const result = drinkStrings.length > 0 ? drinkStrings.join(', ') : 'Ingen';
    return result;
  };

  const renderLeaderboardItem = ({ item }: { item: MemberDrinkStats }) => {
    return (
      <View style={groupStyles.betContainer}>
        <View style={globalStyles.listItemRow}>
          <Text style={[groupStyles.wagerUser, { fontWeight: 'bold' }]}>{item.username} ({item.wins} vinner)</Text>
          <View style={{ flex: 1 }}>
            <Text style={[groupStyles.wagerDetails, { color: theme.colors.error }]}>Drikke selv: {formatDrinks(item.drinksToConsume)}</Text>
            <Text style={[groupStyles.wagerDetails, { color: theme.colors.success, fontWeight: 'bold' }]}>Dele ut: {formatDrinks(item.drinksToDistribute)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBet = ({ item, index }: { item: Bet; index: number }) => {
    const userWager = getUserWagerForBet(item);

    return (
      <View style={groupStyles.betContainer}>
        <View style={[globalStyles.contentCard, groupStyles.betSpacing]}>
          <View style={globalStyles.rowSpread}>
            <View style={{ flex: 1 }}>
              <Text style={groupStyles.betTitle}>{item.title}</Text>
              {item.isFinished && (
                <Text style={groupStyles.betStatusText}>
                  Ferdig - Riktig svar: {getOptionName(item, item.correctOptionId || '')}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => openEditBetModal(item, index)}>
              <Image source={PencilIcon} style={globalStyles.pencilIcon} />
            </TouchableOpacity>
          </View>

          {userWager && (
            <View
              style={[
                groupStyles.userBetSummary,
                item.isFinished && item.correctOptionId === userWager.optionId && groupStyles.userBetSummaryWin,
                item.isFinished && item.correctOptionId !== userWager.optionId && groupStyles.userBetSummaryLose,
              ]}
            >
              <Text
                style={[
                  groupStyles.userBetSummaryText,
                  item.isFinished && item.correctOptionId === userWager.optionId && groupStyles.userBetSummaryTextWin,
                  item.isFinished && item.correctOptionId !== userWager.optionId && groupStyles.userBetSummaryTextLose,
                ]}
              >
                Du har satset: {userWager.amount} {userWager.measureType} {userWager.drinkType} på "{getOptionName(item, userWager.optionId)}"
                {item.isFinished && (item.correctOptionId === userWager.optionId ? ' - DU VANT! 🎉' : ' - Du tapte 😢')}
              </Text>
            </View>
          )}

          <FlatList
            data={item.options}
            renderItem={({ item: option }) => renderBettingOption({ item: option, bet: item })}
            keyExtractor={option => option.id}
            horizontal={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={globalStyles.listContainer}
            scrollEnabled={false}
          />

          {item.wagers && item.wagers.length > 0 && (
            <View style={globalStyles.sectionDivider}>
              <Text style={groupStyles.wagersSectionTitle}>Plasserte bets ({item.wagers.length}):</Text>
              {item.wagers.map((wager, idx) => (
                <View key={idx} style={globalStyles.listItemRow}>
                  <Text style={groupStyles.wagerUser}>{wager.username}</Text>
                  <Text style={groupStyles.wagerDetails}>
                    {wager.amount} {wager.measureType} {wager.drinkType} på "{getOptionName(item, wager.optionId)}"
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[
        Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container,
        { padding: 0 }
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={globalStyles.fullWidthScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[globalStyles.headerContainer, { height: 220 }]}>
          <Image source={currentGroup.image} style={globalStyles.groupHeaderImage} />
          <View style={globalStyles.overlay}>
            <View style={globalStyles.headerInfo}>
              {editingName ? (
                <View style={globalStyles.inputGroup}>
                  <Text style={globalStyles.label}>Gruppenavn</Text>
                  <View style={globalStyles.rowSpread}>
                    <TextInput
                      value={groupName}
                      onChangeText={setGroupName}
                      style={groupStyles.groupNameInput}
                      editable={!saving}
                      autoFocus
                      placeholder="Gruppenavn"
                      placeholderTextColor={theme.colors.textSecondary}
                      onSubmitEditing={handleSaveGroupName}
                      returnKeyType="done"
                    />
                    <TouchableOpacity onPress={handleSaveGroupName} disabled={saving}>
                      <Image source={PencilIcon} style={globalStyles.pencilIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingName(false)} disabled={saving}>
                      <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={globalStyles.rowSpread}>
                  <Text style={groupStyles.groupHeaderName}>{currentGroup.name}</Text>
                  {selectedGroup && (
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity onPress={() => setEditingName(true)} style={{ marginLeft: theme.spacing.sm }}>
                        <Image source={PencilIcon} style={globalStyles.pencilIcon} />
                      </TouchableOpacity>
                      {selectedGroup.createdBy === user?.id && (
                        <TouchableOpacity
                          onPress={handleDeleteGroup}
                          disabled={deleting}
                          style={{ marginLeft: theme.spacing.sm, opacity: deleting ? 0.5 : 1 }}
                        >
                          <Image source={DeleteIcon} style={globalStyles.deleteIcon} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
              <Text style={groupStyles.groupHeaderMembers}>{currentGroup.memberCount} medlemmer</Text>
            </View>
          </View>
        </View>

        <View style={groupStyles.createBetSection}>
          <TouchableOpacity
            style={globalStyles.outlineButtonGold}
            onPress={() => showAlert('Inviter venner', 'Her kan du invitere venner til gruppen (backend TODO)')}
          >
            <Text style={globalStyles.outlineButtonGoldText}>Inviter venner</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={globalStyles.outlineButtonGold}
            onPress={openBetModal}
          >
            <Text style={globalStyles.outlineButtonGoldText}>Opprett nytt bet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={globalStyles.outlineButtonGold}
            onPress={() => setLeaderboardModalVisible(true)}
          >
            <Text style={globalStyles.outlineButtonGoldText}>Vis ledertavle</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={bets}
          renderItem={renderBet}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        />
      </ScrollView>

      <Modal
        visible={betModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBetModalVisible(false)}
      >
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Opprett nytt bet</Text>
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Tittel på bet</Text>
              <TextInput
                placeholder="Tittel på bett"
                placeholderTextColor={theme.colors.textSecondary}
                value={betTitle}
                onChangeText={setBetTitle}
                style={globalStyles.input}
              />
            </View>
            {betOptions.map((opt, idx) => (
              <View key={idx} style={globalStyles.inputGroup}>
                <View style={globalStyles.rowSpread}>
                  <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                    <Text style={globalStyles.label}>Alternativ {idx + 1}</Text>
                    <TextInput
                      placeholder={`Alternativ ${idx + 1}`}
                      placeholderTextColor={theme.colors.textSecondary}
                      value={opt.name}
                      onChangeText={text => updateBetOption(idx, 'name', text)}
                      style={globalStyles.input}
                    />
                  </View>
                  <View style={{ width: 70 }}>
                    <Text style={globalStyles.label}>Odds</Text>
                    <TextInput
                      placeholder="Odds"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={opt.odds}
                      onChangeText={text => updateBetOption(idx, 'odds', text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                      keyboardType="decimal-pad"
                      style={globalStyles.input}
                    />
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={addBetOption} style={{ marginBottom: theme.spacing.md, alignSelf: 'flex-start' }}>
              <Text style={globalStyles.addOptionText}>+ Legg til alternativ</Text>
            </TouchableOpacity>
            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => setBetModalVisible(false)} disabled={betSaving}>
                <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveBet} disabled={betSaving}>
                <Text style={globalStyles.saveButtonText}>{betSaving ? 'Lagrer...' : 'Lagre bet'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={placeBetModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPlaceBetModalVisible(false)}
      >
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Plasser bet</Text>
            {selectedBetOption && (
              <View>
                <Text style={globalStyles.modalText}>Bet: {selectedBetOption.bet.title}</Text>
                <Text style={globalStyles.secondaryText}>
                  Alternativ: {selectedBetOption.option.name} (odds: {selectedBetOption.option.odds})
                </Text>
              </View>
            )}
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Type drikke</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.md }}>
                {drinkTypes.map((drinkType) => (
                  <TouchableOpacity
                    key={drinkType}
                    style={[
                      globalStyles.selectionButton,
                      selectedDrinkType === drinkType && globalStyles.selectionButtonSelected,
                    ]}
                    onPress={() => setSelectedDrinkType(drinkType)}
                  >
                    <Text
                      style={[
                        globalStyles.selectionButtonText,
                        selectedDrinkType === drinkType && globalStyles.selectionButtonTextSelected,
                      ]}
                    >
                      {drinkType}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Måleenhet</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.md }}>
                {measureTypes.map((measureType) => (
                  <TouchableOpacity
                    key={measureType}
                    style={[
                      globalStyles.selectionButton,
                      selectedMeasureType === measureType && globalStyles.selectionButtonSelected,
                    ]}
                    onPress={() => setSelectedMeasureType(measureType)}
                  >
                    <Text
                      style={[
                        globalStyles.selectionButtonText,
                        selectedMeasureType === measureType && globalStyles.selectionButtonTextSelected,
                      ]}
                    >
                      {measureType}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Antall</Text>
              <TextInput
                placeholder="Antall"
                placeholderTextColor={theme.colors.textSecondary}
                value={betAmount}
                onChangeText={setBetAmount}
                keyboardType="numeric"
                style={globalStyles.input}
              />
            </View>
            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => setPlaceBetModalVisible(false)} disabled={placingBet}>
                <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePlaceBet} disabled={placingBet}>
                <Text style={globalStyles.saveButtonText}>
                  {placingBet ? 'Plasserer...' : 'Plasser bet'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editBetModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditBetModalVisible(false)}
      >
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Rediger bet</Text>
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Tittel på bet</Text>
              <TextInput
                placeholder="Tittel på bett"
                placeholderTextColor={theme.colors.textSecondary}
                value={editBetTitle}
                onChangeText={setEditBetTitle}
                style={globalStyles.input}
              />
            </View>
            {editBetOptions.map((opt, idx) => (
              <View key={idx} style={globalStyles.inputGroup}>
                <View style={globalStyles.rowSpread}>
                  <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                    <Text style={globalStyles.label}>Alternativ {idx + 1}</Text>
                    <TextInput
                      placeholder={`Alternativ ${idx + 1}`}
                      placeholderTextColor={theme.colors.textSecondary}
                      value={opt.name}
                      onChangeText={text => updateEditBetOption(idx, 'name', text)}
                      style={globalStyles.input}
                    />
                  </View>
                  <View style={{ width: 70 }}>
                    <Text style={globalStyles.label}>Odds</Text>
                    <TextInput
                      placeholder="Odds"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={opt.odds}
                      onChangeText={text => updateEditBetOption(idx, 'odds', text.replace(/[^0-9.,]/g, '').replace(',', '.'))}
                      keyboardType="decimal-pad"
                      style={globalStyles.input}
                    />
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={addEditBetOption} style={{ marginBottom: theme.spacing.md, alignSelf: 'flex-start' }}>
              <Text style={globalStyles.addOptionText}>+ Legg til alternativ</Text>
            </TouchableOpacity>
            <View style={globalStyles.modalButtonsContainer}>
              <View style={globalStyles.editButtonsContainer}>
                <TouchableOpacity onPress={() => setEditBetModalVisible(false)} disabled={editBetSaving}>
                  <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEditBet} disabled={editBetSaving}>
                  <Text style={globalStyles.saveButtonText}>
                    {editBetSaving ? 'Lagrer...' : 'Lagre endringer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={selectCorrectModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectCorrectModalVisible(false)}
      >
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>
              {selectCorrectBetIdx !== null && bets[selectCorrectBetIdx]?.isFinished
                ? 'Administrer ferdig bet'
                : 'Velg riktig alternativ'}
            </Text>
            {selectCorrectBetIdx !== null && (
              <View>
                <Text style={globalStyles.modalText}>{bets[selectCorrectBetIdx]?.title}</Text>
                {bets[selectCorrectBetIdx]?.isFinished && (
                  <TouchableOpacity
                    style={[globalStyles.selectionButton, { marginBottom: theme.spacing.md, backgroundColor: theme.colors.error }]}
                    onPress={() => handleSelectCorrectOption(null)}
                  >
                    <Text style={[globalStyles.selectionButtonText, { color: theme.colors.background }]}>
                      Gjør bettet aktivt igjen
                    </Text>
                  </TouchableOpacity>
                )}
                <Text style={[globalStyles.label, { marginBottom: theme.spacing.sm }]}>
                  {bets[selectCorrectBetIdx]?.isFinished ? 'Eller velg nytt riktig alternativ:' : 'Velg riktig alternativ:'}
                </Text>
                {bets[selectCorrectBetIdx]?.options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      globalStyles.selectionButton,
                      { marginBottom: theme.spacing.sm },
                      bets[selectCorrectBetIdx]?.correctOptionId === option.id && globalStyles.selectionButtonSelected,
                    ]}
                    onPress={() => handleSelectCorrectOption(option.id)}
                  >
                    <Text
                      style={[
                        globalStyles.selectionButtonText,
                        bets[selectCorrectBetIdx]?.correctOptionId === option.id && globalStyles.selectionButtonTextSelected,
                      ]}
                    >
                      {option.name} (odds: {option.odds})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => setSelectCorrectModalVisible(false)}>
                <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={leaderboardModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLeaderboardModalVisible(false)}
      >
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Ledertavle - Ferdige bets</Text>
            <FlatList
              data={getLeaderboardData()}
              renderItem={renderLeaderboardItem}
              keyExtractor={item => item.userId}
              ListEmptyComponent={
                <Text style={globalStyles.emptyStateText}>Ingen ferdige bets ennå</Text>
              }
              contentContainerStyle={globalStyles.listContainer}
            />
            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => setLeaderboardModalVisible(false)}>
                <Text style={globalStyles.cancelButtonText}>Lukk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editMenuModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditMenuModalVisible(false)}
      >
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Administrer bet</Text>
            <Text style={globalStyles.modalText}>
              {selectedEditBet?.bet.title || 'Velg en handling for bettet'}
            </Text>
            <TouchableOpacity
              style={[globalStyles.selectionButton, { marginBottom: theme.spacing.sm }]}
              onPress={() => {
                if (selectedEditBet) {
                  setEditBetIdx(selectedEditBet.index);
                  setEditBetTitle(selectedEditBet.bet.title);
                  setEditBetOptions(
                    selectedEditBet.bet.options.map((opt: BettingOption) => ({
                      name: opt.name,
                      odds: opt.odds.toString(),
                    }))
                  );
                  setEditBetModalVisible(true);
                  setEditMenuModalVisible(false);
                }
              }}
            >
              <Text style={globalStyles.selectionButtonText}>Rediger bet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[globalStyles.selectionButton, { marginBottom: theme.spacing.sm }]}
              onPress={() => {
                if (selectedEditBet) {
                  setSelectCorrectBetIdx(selectedEditBet.index);
                  setSelectCorrectModalVisible(true);
                  setEditMenuModalVisible(false);
                }
              }}
            >
              <Text style={globalStyles.selectionButtonText}>
                {selectedEditBet?.bet.isFinished ? 'Gjør aktivt igjen' : 'Marker som ferdig'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[globalStyles.selectionButton, { marginBottom: theme.spacing.sm, backgroundColor: theme.colors.error }]}
              onPress={() => {
                if (selectedEditBet) {
                  setEditBetIdx(selectedEditBet.index);
                  setEditMenuModalVisible(false);
                  showAlert(
                    'Bekreft sletting',
                    'Er du sikker på at du vil slette dette bettet? Dette kan ikke angres.',
                    [
                      { text: 'Avbryt', style: 'cancel' },
                      {
                        text: 'Slett',
                        style: 'destructive',
                        onPress: async () => {
                          setEditBetSaving(true);
                          try {
                            const firestore = getFirestore();
                            const groupRef = doc(firestore, 'groups', selectedGroup!.id);
                            const groupSnap = await getDoc(groupRef);
                            let groupBets: Bet[] = [];
                            if (groupSnap.exists() && groupSnap.data().bets) {
                              groupBets = groupSnap.data().bets;
                            }
                            const newBets = groupBets.filter((_, betIdx: number) => betIdx !== editBetIdx);
                            await updateDoc(groupRef, { bets: newBets });
                            setBets(newBets);
                          } catch (error) {
                            showAlert('Feil', 'Kunne ikke slette bet');
                          } finally {
                            setEditBetSaving(false);
                          }
                        },
                      },
                    ]
                  );
                }
              }}
            >
              <Text style={[globalStyles.selectionButtonText, { color: theme.colors.background }]}>Slett bet</Text>
            </TouchableOpacity>
            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => setEditMenuModalVisible(false)}>
                <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default GroupScreen;