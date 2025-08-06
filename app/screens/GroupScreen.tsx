import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../services/firebase/FirebaseConfig';
import { groupStyles } from '../styles/components/groupStyles';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import type { Bet, BettingOption, BetWager, DrinkType, MeasureType, MemberDrinkStats } from '../types/bettingTypes';
import { GroupInvitation, Group, Friend, sendGroupInvitation, getGroupInvitation, removeFriendFromGroup, exitGroup, deleteGroup } from '../services/firebase/groupService';
import { showAlert } from '../utils/platformAlert';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot, query, updateDoc, where } from 'firebase/firestore';

const ImageMissing = require('../../assets/images/image_missing.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');
const DeleteIcon = require('../../assets/icons/noun-delete-7938028.png');
const PeopleIcon = require('../../assets/icons/noun-people-2196504.png');

const GroupScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [betModalVisible, setBetModalVisible] = useState(false);
  const [editingName, setEditingName] = useState(false);
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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [inviting, setInviting] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<MemberDrinkStats[]>([]);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [memberData, setMemberData] = useState<Friend[]>([]);
  

  const currentGroup: Group & { image: any } = selectedGroup
    ? { ...selectedGroup, name: groupName, image: selectedGroup.image ?? ImageMissing }
    : { id: 'default', name: 'Gruppenavn', memberCount: 0, image: ImageMissing, createdBy: '', members: [] };
  const drinkTypes: DrinkType[] = ['Øl', 'Cider', 'Hard selzer', 'Vin', 'Sprit'];
  const measureTypes: MeasureType[] = ['Slurker', 'Shot', 'Chug'];

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchGroupsAndInvitations = async () => {
      const groupQuery = query(collection(firestore, 'groups'), where('members', 'array-contains', user.id));
      const groupSnapshot = await getDocs(groupQuery);
      if (!isMounted) return;
      const groupList = groupSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        name: docSnap.data().name,
        memberCount: docSnap.data().members.length,
        image: ImageMissing,
        createdBy: docSnap.data().createdBy,
        members: docSnap.data().members,
      }));
      setGroups(groupList);

      const invitationList = await getGroupInvitation(user.id);
      if (!isMounted) return;
      setInvitations(invitationList);

      let groupFromParams = null;
      if (params.selectedGroup) {
        try {
          groupFromParams = Array.isArray(params.selectedGroup)
            ? JSON.parse(params.selectedGroup[0])
            : JSON.parse(params.selectedGroup);
        } catch (e) {
          console.error('Error parsing selectedGroup:', e);
          groupFromParams = null;
        }
      }
      const foundGroup = groupFromParams
        ? groupList.find(g => g.id === groupFromParams.id)
        : groupList.length > 0
        ? groupList[0]
        : null;
      setSelectedGroup(foundGroup ?? null);
    };
    fetchGroupsAndInvitations();
    return () => {
      isMounted = false;
    };
  }, [user, params.selectedGroup]);

  useEffect(() => {
    if (selectedGroup && selectedGroup.name !== groupName) {
      setGroupName(selectedGroup.name);
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const userRef = doc(firestore, 'users', user.id);
    const unsubscribe = onSnapshot(userRef, (userDoc) => {
      if (userDoc.exists() && isMounted) {
        const data = userDoc.data();
        const friends = data.friends || [];
        const fetchFriends = async () => {
          const friendData = await Promise.all(
            friends.map(async (friendId: string) => {
              try {
                const friendDoc = await getDoc(doc(firestore, 'users', friendId));
                if (friendDoc.exists()) {
                  const friendData = friendDoc.data();
                  return {
                    id: friendDoc.id,
                    name: friendData.name || 'Ukjent navn',
                    username: friendData.username || 'ukjent',
                    profilePicture: ImageMissing,
                  };
                }
                return null;
              } catch (error) {
                console.error(`Error fetching friend ${friendId}:`, error);
                return null;
              }
            })
          );
          if (isMounted) {
            setFriends(friendData.filter((friend): friend is Friend => friend !== null));
          }
        };
        fetchFriends();
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!selectedGroup) {
      setBets([]);
      return;
    }
    let isMounted = true;
    const fetchBets = async () => {
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

  useEffect(() => {
    if (leaderboardModalVisible) {
      getLeaderboardData().then(setLeaderboardData);
    }
  }, [leaderboardModalVisible, bets, selectedGroup]);

  useEffect(() => {
    if (!selectedGroup || !selectedGroup.members) {
      setMemberData([]);
      return;
    }
    let isMounted = true;

    const fetchAndSortMembers = async () => {
      const usernames = await fetchMemberUsernames(selectedGroup.members);
      const members = await Promise.all(
        selectedGroup.members.map(async (memberId) => {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', memberId));
            return {
              id: memberId,
              name: userDoc.exists() ? userDoc.data().name || 'Ukjent navn' : 'Ukjent navn',
              username: usernames[memberId] || 'ukjent',
              profilePicture: ImageMissing,
            };
          } catch (error) {
            console.error(`Error fetching member ${memberId}:`, error);
            return {
              id: memberId,
              name: 'Ukjent navn',
              username: usernames[memberId] || 'ukjent',
              profilePicture: ImageMissing,
            };
          }
        })
      );
      if (!isMounted) return;
      // Sort members alphabetically by username
      const sortedMembers = members.sort((a, b) => a.username.localeCompare(b.username));
      setMemberData(sortedMembers);
    };

    fetchAndSortMembers();
    return () => {
      isMounted = false;
    };
  }, [selectedGroup?.members]);

  const fetchMemberUsernames = async (memberIds: string[]): Promise<{ [key: string]: string }> => {
    const usernames: { [key: string]: string } = {};
    await Promise.all(
      memberIds.map(async (memberId) => {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', memberId));
          usernames[memberId] = userDoc.exists() ? userDoc.data().username || userDoc.data().displayName || userDoc.data().email || (user && memberId === user.id ? 'Meg' : 'Ukjent') : (user && memberId === user.id ? 'Meg' : 'Ukjent');
        } catch (error) {
          console.error(`Error fetching username for member ${memberId}:`, error);
          usernames[memberId] = user && memberId === user.id ? 'Meg' : 'Ukjent';
        }
      })
    );
    return usernames;
  };

  const handleInviteFriend = async (friend: Friend) => {
    if (!user || !selectedGroup) {
      console.error('=== DEBUG: Missing user or selectedGroup ===', { user, selectedGroup });
      showAlert('Feil', 'Bruker eller gruppe ikke tilgjengelig');
      return;
    }
    setInviting(true);
    try {
      await sendGroupInvitation(friend.id, selectedGroup);
      showAlert('Invitasjon sendt', `Invitasjon sendt til ${friend.name}`);
    } catch(error) {
      console.error(error);
      showAlert('Feil', `Kunne ikke sende invitasjon til ${friend.name}: ${(error as Error).message}`)
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveFriendFromGroup = async (friend: Friend) => {
    if (!selectedGroup) return;
    try {
      await removeFriendFromGroup(friend.id, selectedGroup.id);
      setSelectedGroup((prev) => prev ? { 
        ...prev, members: prev.members.filter(id => id !== friend.id), 
        memberCount: prev.memberCount - 1
      } : prev);
      setMemberData((prev) => prev.filter(member => member.id !== friend.id));
      showAlert('Suksess', `${friend.name} ble fjernet fra gruppen`);
    } catch (error) {
      console.error('Error removing friend:', error);
      showAlert('Feil', 'Kunne ikke fjerne medlem fra gruppe');
    }
  };

  const handleExitGroup = async () => {
    if (!selectedGroup) return;
    showAlert(
      'Bekreft utmeldelse',
      `Er du sikker på at du vil forlate gruppen "${selectedGroup.name}"?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Forlat',
          style: 'destructive',
          onPress: async () => {
            try {
              await exitGroup(selectedGroup.id);
              router.replace('/profile');
            } catch (error) {
              showAlert('Feil', `Kunne ikke forlate gruppe: ${(error as Error).message}`);
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    showAlert(
      'Bekreft sletting',
      `Er du sikker på at du vil slette gruppen "${selectedGroup.name}"? Dette kan ikke angres.`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteGroup(selectedGroup.id);
              router.replace('/profile');
            } catch (error) {
              console.error('Error deleting group:', error);
              showAlert('Feil', 'Kunne ikke slette gruppe');
            } finally {
              setDeleting(false);
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
      await updateDoc(doc(firestore, 'groups', selectedGroup.id), { name: groupName });
      setEditingName(false);
    } catch (error) {
      console.error('Error saving group name:', error);
      showAlert('Feil', 'Kunne ikke oppdatere gruppenavn');
    } finally {
      setSaving(false);
    }
  };

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
      console.error('Error saving bet:', error);
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
      console.error('Error placing bet:', error);
      showAlert('Feil', 'Kunne ikke plassere bet');
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

  const openEditBetModal = (bet: Bet, idx: number) => {
    setSelectedEditBet({ bet, index: idx });
    setEditBetIdx(idx);
    setEditMenuModalVisible(true);
  }

  const handleSelectCorrectOption = async (optionId: string | null) => {
    if (selectCorrectBetIdx === null || !selectedGroup) return;

    try {
      const db = getFirestore();
      const groupRef = doc(db, 'groups', selectedGroup.id);
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
      console.error('Error selecting correct option:', error);
      showAlert('Feil', 'Kunne ikke oppdatere bet');
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
      const db = getFirestore();
      const groupRef = doc(db, 'groups', selectedGroup.id);
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
      console.error('Error saving edited bet:', error);
      showAlert('Feil', 'Kunne ikke lagre endringer');
    } finally {
      setEditBetSaving(false);
    }
  };

  const handleDeleteBet = async () => {
    const idxToDelete = selectedEditBet?.index ?? editBetIdx;
    if (idxToDelete === null || idxToDelete === undefined || !selectedGroup) return;

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
              const db = getFirestore();
              const groupRef = doc(db, 'groups', selectedGroup.id);
              const groupSnap = await getDoc(groupRef);
              let groupBets: Bet[] = [];
              if (groupSnap.exists() && groupSnap.data().bets) {
                groupBets = groupSnap.data().bets;
              }
              const newBets = groupBets.filter((_, idx: number) => idx !== idxToDelete);
              await updateDoc(groupRef, { bets: newBets });
              setBets(newBets);
              setEditBetModalVisible(false);
              setEditBetIdx(null);
              setSelectedEditBet(null);
            } catch (error) {
              console.error('Error deleting bet:', error);
              showAlert('Feil', 'Kunne ikke slette bet');
            } finally {
              setEditBetSaving(false);
            }
          },
        },
      ]
    );
  };

  const getLeaderboardData = async (): Promise<MemberDrinkStats[]> => {
    if (!selectedGroup || !selectedGroup.members) return [];

    const usernames = await fetchMemberUsernames(selectedGroup.members);
    const finishedBets = bets.filter(bet => bet.isFinished && bet.correctOptionId);
    const memberStats: { [userId: string]: MemberDrinkStats } = {};

    selectedGroup.members.forEach((userId: string) => {
      memberStats[userId] = {
        userId,
        username: usernames[userId] || 'Ukjent',
        wins: 0,
        drinksToConsume: {},
        drinksToDistribute: {},
      };
    });

    finishedBets.forEach(bet => {
      const wagers = bet.wagers || [];
      wagers.forEach(wager => {
        const stats = memberStats[wager.userId];
        if (!stats) return;

        stats.username = usernames[wager.userId] || wager.username || 'Ukjent';
        const drinkType = wager.drinkType;
        const measureType = wager.measureType;
        const amount = wager.amount;
        const odds = bet.options.find(o => o.id === wager.optionId)?.odds || 1;
        const calculatedAmount = Math.round(amount * odds);

        if (!stats.drinksToConsume[drinkType]) stats.drinksToConsume[drinkType] = {};
        if (!stats.drinksToDistribute[drinkType]) stats.drinksToDistribute[drinkType] = {};
        if (!stats.drinksToConsume[drinkType][measureType]) stats.drinksToConsume[drinkType][measureType] = 0;
        if (!stats.drinksToDistribute[drinkType][measureType]) stats.drinksToDistribute[drinkType][measureType] = 0;

        if (wager.optionId === bet.correctOptionId) {
          stats.wins += 1;
          stats.drinksToDistribute[drinkType][measureType]! += calculatedAmount;
        } else {
          stats.drinksToConsume[drinkType][measureType]! += calculatedAmount;
        }
      });
    });

    return Object.values(memberStats).sort((a, b) => b.wins - a.wins);
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
    return drinkStrings.length > 0 ? drinkStrings.join(', ') : 'Ingen';
  };

  const renderMemberItem = ({ item }: { item: Friend }) => {
    const isCreator = selectedGroup?.createdBy === item.id;
    const isCurrentUserCreator = user?.id === selectedGroup?.createdBy;

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
        <Image source={item.profilePicture} style={[globalStyles.circularImage, { width: 50, height: 50, marginRight: 10 }]} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={[groupStyles.wagerUser, { marginBottom: 0, textAlign: 'left', lineHeight: 20 }]}>{item.name}</Text>
          <Text style={[globalStyles.secondaryText, { marginTop: 0, textAlign: 'left', lineHeight: 18 }]}>@{item.username}</Text>
        </View>
        {!isCreator && isCurrentUserCreator && (
          <TouchableOpacity
            style={[globalStyles.outlineButtonGold, { paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'center', justifyContent: 'center', borderColor: 'red' }]}
            onPress={() => handleRemoveFriendFromGroup(item)}
            disabled={inviting}
          >
            <Text style={[globalStyles.outlineButtonGoldText, { color: 'red' }]}>Fjern</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
        <Image source={item.profilePicture} style={[globalStyles.circularImage, { width: 50, height: 50, marginRight: 10 }]} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={[groupStyles.wagerUser, { marginBottom: 0, textAlign: 'left', lineHeight: 20 }]}>{item.name}</Text>
          <Text style={[globalStyles.secondaryText, { marginTop: 0, textAlign: 'left', lineHeight: 18 }]}>@{item.username}</Text>
        </View>
          <TouchableOpacity
            style={[globalStyles.outlineButtonGold, { paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'center', justifyContent: 'center' }]}
            onPress={() => handleInviteFriend(item)}
            disabled={inviting}
          >
            <Text style={globalStyles.outlineButtonGoldText}>Inviter</Text>
          </TouchableOpacity>
      </View>
    );
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
                Du har satset: {userWager.amount} {userWager.measureType} {userWager.drinkType} på {getOptionName(item, userWager.optionId)}
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
                    {wager.amount} {wager.measureType} {wager.drinkType} på {getOptionName(item, wager.optionId)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = ({ item }: { item: MemberDrinkStats }) => {
    return (
      <View style={groupStyles.betContainer}>
        <View style={globalStyles.listItemRow}>
          <Text style={[groupStyles.wagerUser, { fontWeight: 'bold' }]}>{item.username} ({item.wins} vunnet)</Text>
          <View style={{ flex: 1 }}>
            <Text style={[groupStyles.wagerDetails, { color: theme.colors.error }]}>Drikke selv: {formatDrinks(item.drinksToConsume)}</Text>
            <Text style={[groupStyles.wagerDetails, { color: theme.colors.success, fontWeight: 'bold' }]}>Dele ut: {formatDrinks(item.drinksToDistribute)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container, { padding: 0 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={globalStyles.fullWidthScrollContent} keyboardShouldPersistTaps="handled">
        <View style={[globalStyles.headerContainer, { height: 220 }]}> 
          <Image source={currentGroup.image} style={globalStyles.groupHeaderImage} />
          <View style={globalStyles.overlay}>
            <View style={globalStyles.headerInfo}>
              {editingName ? (
                <View style={globalStyles.inputGroup}>
                  <Text style={globalStyles.label}>Gruppenavn</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TextInput
                      value={groupName}
                      onChangeText={setGroupName}
                      style={[groupStyles.groupNameInput, { flexBasis: 140, flexGrow: 0, flexShrink: 1, minWidth: 80, maxWidth: 160, fontSize: 16, paddingVertical: 4, paddingHorizontal: 8 }]}
                      editable={!saving}
                      autoFocus
                      placeholder="Gruppenavn"
                      placeholderTextColor={theme.colors.textSecondary}
                      onSubmitEditing={handleSaveGroupName}
                      returnKeyType="done"
                    />
                    <TouchableOpacity onPress={handleSaveGroupName} disabled={saving} style={{ marginLeft: 4 }}>
                      <Image source={PencilIcon} style={[globalStyles.pencilIcon, { width: 22, height: 22 }]} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingName(false)} disabled={saving} style={{ marginLeft: 4 }}>
                      <Text style={[globalStyles.cancelButtonText, { fontSize: 15 }]}>Avbryt</Text>
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
                      {selectedGroup && user && selectedGroup.createdBy !== user.id && (
                        <TouchableOpacity onPress={handleExitGroup} disabled={deleting}>
                          <Image source={DeleteIcon} style={globalStyles.pencilIcon} />
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, { flex: 1, paddingVertical: 6, justifyContent: 'center', alignItems: 'center' }]} onPress={() => setMembersModalVisible(true)}>
              <Image source={PeopleIcon} style={[globalStyles.pencilIcon, { width: 20, height: 20 }]} />
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, { flex: 1 }]} onPress={() => setInviteModalVisible(true)} disabled={inviting}>
              <Text style={globalStyles.outlineButtonGoldText}>Inviter venner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, { flex: 1 }]} onPress={() => setLeaderboardModalVisible(true)}>
              <Text style={globalStyles.outlineButtonGoldText}>Vis ledertavle</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[globalStyles.outlineButtonGold, { marginTop: theme.spacing.md }]} onPress={openBetModal}>
            <Text style={globalStyles.outlineButtonGoldText}>Opprett bett</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingBottom: theme.spacing.xl }}>
          {bets.map((item, idx) => (
            <View key={item.id}>{renderBet({ item, index: idx })}</View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={membersModalVisible} animationType="slide" transparent onRequestClose={() => setMembersModalVisible(false)}>
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Medlemmer i {currentGroup.name}</Text>
            {memberData.length > 0 ? (
              <FlatList
                data={memberData}
                renderItem={renderMemberItem}
                keyExtractor={item => item.id}
                contentContainerStyle={globalStyles.listContainer}
                scrollEnabled
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Text style={globalStyles.emptyStateText}>Ingen medlemmer i gruppen</Text>
            )}
            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => setMembersModalVisible(false)} disabled={inviting}>
                <Text style={globalStyles.cancelButtonText}>Lukk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={inviteModalVisible} animationType="slide" transparent onRequestClose={() => setInviteModalVisible(false)}>
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Inviter venner til {currentGroup.name}</Text>
            {friends.length > 0 ? (
              <FlatList
                data={friends.filter(friend => !selectedGroup?.members.includes(friend.id))}
                renderItem={renderFriendItem}
                keyExtractor={item => item.id}
                contentContainerStyle={globalStyles.listContainer}
                scrollEnabled
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Text style={globalStyles.emptyStateText}>Ingen venner å invitere</Text>
            )}
            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)} disabled={inviting}>
                <Text style={globalStyles.cancelButtonText}>Lukk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={betModalVisible} animationType="slide" transparent onRequestClose={() => setBetModalVisible(false)}>
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Opprett nytt bet</Text>
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Tittel på bet</Text>
              <TextInput
                placeholder="Tittel på bet"
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
                  <View style={{ width: 75 }}>
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

      <Modal visible={placeBetModalVisible} animationType="slide" transparent onRequestClose={() => setPlaceBetModalVisible(false)}>
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
                    style={[globalStyles.selectionButton, selectedDrinkType === drinkType && globalStyles.selectionButtonSelected]}
                    onPress={() => setSelectedDrinkType(drinkType)}
                  >
                    <Text
                      style={[globalStyles.selectionButtonText, selectedDrinkType === drinkType && globalStyles.selectionButtonTextSelected]}
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
                    style={[globalStyles.selectionButton, selectedMeasureType === measureType && globalStyles.selectionButtonSelected]}
                    onPress={() => setSelectedMeasureType(measureType)}
                  >
                    <Text
                      style={[globalStyles.selectionButtonText, selectedMeasureType === measureType && globalStyles.selectionButtonTextSelected]}
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
                <Text style={globalStyles.saveButtonText}>{placingBet ? 'Plasserer...' : 'Plasser bet'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editBetModalVisible} animationType="slide" transparent onRequestClose={() => setEditBetModalVisible(false)}>
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
            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => setEditBetModalVisible(false)} disabled={editBetSaving}>
                <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEditBet} disabled={editBetSaving}>
                <Text style={globalStyles.saveButtonText}>{editBetSaving ? 'Lagrer...' : 'Lagre endringer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={selectCorrectModalVisible} animationType="slide" transparent onRequestClose={() => setSelectCorrectModalVisible(false)}>
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>
              {selectCorrectBetIdx !== null && bets[selectCorrectBetIdx]?.isFinished ? 'Administrer ferdig bet' : 'Velg riktig alternativ'}
            </Text>
            {selectCorrectBetIdx !== null && (
              <View>
                <Text style={globalStyles.modalText}>{bets[selectCorrectBetIdx]?.title}</Text>
                {bets[selectCorrectBetIdx]?.isFinished && (
                  <TouchableOpacity
                    style={[globalStyles.selectionButton, { marginBottom: theme.spacing.md, backgroundColor: theme.colors.error }]}
                    onPress={() => handleSelectCorrectOption(null)}
                  >
                    <Text style={[globalStyles.selectionButtonText, { color: theme.colors.background }]}>Gjør bettet aktivt igjen</Text>
                  </TouchableOpacity>
                )}
                <Text style={[globalStyles.label, { marginBottom: theme.spacing.sm }]}>
                  {bets[selectCorrectBetIdx]?.isFinished ? 'Eller velg nytt riktig alternativ:' : 'Velg riktig alternativ:'}
                </Text>
                {bets[selectCorrectBetIdx]?.options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[globalStyles.selectionButton, { marginBottom: theme.spacing.sm }, bets[selectCorrectBetIdx]?.correctOptionId === option.id && globalStyles.selectionButtonSelected]}
                    onPress={() => handleSelectCorrectOption(option.id)}
                  >
                    <Text
                      style={[globalStyles.selectionButtonText, bets[selectCorrectBetIdx]?.correctOptionId === option.id && globalStyles.selectionButtonTextSelected]}
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

      <Modal visible={leaderboardModalVisible} animationType="slide" transparent onRequestClose={() => setLeaderboardModalVisible(false)}>
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Ledertavle - Ferdige bets</Text>
            {selectedGroup && selectedGroup.members && (
              <View style={{ marginBottom: 12 }}>
                <Text style={[globalStyles.label, { marginBottom: 4 }]}>Medlemmer:</Text>
                <FlatList
                  data={selectedGroup.members}
                  keyExtractor={id => id}
                  horizontal
                  renderItem={({ item: memberId }) => {
                    const friend = friends.find(f => f.id === memberId);
                    const isMe = user && memberId === user.id;
                    const displayName = isMe
                      ? user.name || user.displayName || user.email || 'Meg'
                      : friend?.name || 'Ukjent';
                    return (
                      <View key={memberId} style={{ alignItems: 'center', marginRight: 14 }}>
                        <Image source={friend?.profilePicture || ImageMissing} style={[globalStyles.circularImage, { width: 36, height: 36, marginBottom: 2 }]} />
                        <Text style={{ fontSize: 12, color: theme.colors.text, maxWidth: 70, textAlign: 'center' }} numberOfLines={1}>
                          {displayName}
                        </Text>
                      </View>
                    );
                  }}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 4 }}
                />
              </View>
            )}
            <FlatList
              data={leaderboardData}
              renderItem={renderLeaderboardItem}
              keyExtractor={item => item.userId}
              ListEmptyComponent={<Text style={globalStyles.emptyStateText}>Ingen ferdige bets ennå</Text>}
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

      <Modal visible={editMenuModalVisible} animationType="slide" transparent onRequestClose={() => setEditMenuModalVisible(false)}>
        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>Administrer bet</Text>
            <Text style={globalStyles.modalText}>{selectedEditBet?.bet.title || 'Velg en handling for bettet'}</Text>
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
              <Text style={globalStyles.selectionButtonText}>{selectedEditBet?.bet.isFinished ? 'Gjør aktivt igjen' : 'Marker som ferdig'}</Text>
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
                            const db = getFirestore();
                            const groupRef = doc(db, 'groups', selectedGroup!.id);
                            const groupSnap = await getDoc(groupRef);
                            let groupBets: Bet[] = [];
                            if (groupSnap.exists() && groupSnap.data().bets) {
                              groupBets = groupSnap.data().bets;
                            }
                            const newBets = groupBets.filter((_, betIdx: number) => betIdx !== editBetIdx);
                            await updateDoc(groupRef, { bets: newBets });
                            setBets(newBets);
                          } catch (error) {
                            console.error('Error deleting bet:', error);
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