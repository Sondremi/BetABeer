import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../services/firebase/FirebaseConfig';
import { FriendRequest, getOutgoingRequest, sendFriendRequest } from '../services/firebase/friendService';
import { deleteGroup, distributeDrinks, exitGroup, Friend, Group, GroupInvitation, removeFriendFromGroup, sendGroupInvitation } from '../services/firebase/groupService';
import { getGroupInvitation } from '../services/firebase/profileService';
import { groupStyles } from '../styles/components/groupStyles';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import type { Bet, BettingOption, BetWager, DrinkType, MeasureType, MemberDrinkStats } from '../types/bettingTypes';
import { showAlert } from '../utils/platformAlert';

const ImageMissing = require('../../assets/images/image_missing.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');

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
  const [cachedUsernames, setCachedUsernames] = useState<{ [key: string]: string }>({});
  const [leaderboardView, setLeaderboardView] = useState<'betsWon' | 'drinksWon'>('betsWon');
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<FriendRequest[]>([]);
  const [userDrinksToDistribute, setUserDrinksToDistribute] = useState<MemberDrinkStats['drinksToDistribute']>({});
  const [distributeModalVisible, setDistributeModalVisible] = useState(false);
  const [distributingDrinks, setDistributingDrinks] = useState(false);
  const [distributions, setDistributions] = useState<{ userId: string; drinkType: DrinkType; measureType: MeasureType; amount: number }[]>([]);

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
      getLeaderboardData(leaderboardView).then(setLeaderboardData);
    }
  }, [leaderboardModalVisible, bets, selectedGroup, leaderboardView]);

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

  useEffect(() => {
    if (!user?.id || !membersModalVisible) return;
    
    const fetchPendingRequests = async () => {
      try {
        const requests = await getOutgoingRequest(user.id);
        setPendingFriendRequests(requests);
      } catch (error) {
        console.error('Error fetching pending friend requests:', error);
      }
    };
    
    fetchPendingRequests();
  }, [user?.id, membersModalVisible]);

  useEffect(() => {
    if (!user?.id || !leaderboardData) return;
    const userStats = leaderboardData.find(stat => stat.userId === user.id);
    setUserDrinksToDistribute(userStats?.drinksToDistribute || {});
  }, [leaderboardData, user?.id]);

  const fetchMemberUsernames = async (memberIds: string[]): Promise<{ [key: string]: string }> => {
    const usernames: { [key: string]: string } = { ...cachedUsernames };
    const uncachedIds = memberIds.filter(id => !usernames[id]);
    if (uncachedIds.length > 0) {
      await Promise.all(
        uncachedIds.map(async (memberId) => {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', memberId));
            usernames[memberId] = userDoc.exists() 
            ? userDoc.data().username || userDoc.data().displayName || userDoc.data().email || 
            (user && memberId === user.id ? 'Meg' : 'Ukjent') 
            : (user && memberId === user.id ? 'Meg' : 'Ukjent');
          } catch (error) {
            console.error(`Error fetching username for member ${memberId}:`, error);
            usernames[memberId] = user && memberId === user.id ? 'Meg' : 'Ukjent';
          }
        }
      ));
      setCachedUsernames(usernames);
    }
    return usernames;
  };

  const handleDistributeDrinks = async () => {
    if (!user?.id || !selectedGroup?.id) {
      showAlert('Feil', 'Bruker eller gruppe ikke tilgjengelig');
      return;
    }
    setDistributingDrinks(true);
    try {
      await distributeDrinks(user.id, selectedGroup.id, distributions);
      
      // Refresh leaderboardData
      const updatedLeaderboard = await getLeaderboardData(leaderboardView);
      setLeaderboardData(updatedLeaderboard);

      // Clear state
      setUserDrinksToDistribute({});
      setDistributions([]);

      showAlert('Suksess', 'Drikker fordelt!');
      setDistributeModalVisible(false);
    } catch (error) {
      console.error('Error distributing drinks:', error);
      showAlert('Feil', (error as Error).message || 'Kunne ikke fordele drikker');
    } finally {
      setDistributingDrinks(false);
    }
  };

  const handleSendFriendRequest = async (member: Friend) => {
    if (!user?.id) {
      showAlert('Feil', 'Bruker ikke autentisert');
      return;
    }
    setSendingFriendRequest(true);
    try {
      await sendFriendRequest(member.id);
      const updatedRequests = await getOutgoingRequest(user.id);
      setPendingFriendRequests(updatedRequests);
      showAlert('Suksess', `Vennerequest sendt til ${member.name}`);
    } catch (error) {
      console.error('Error sending friend request:', error);
      showAlert('Feil', (error as Error).message || 'Kunne ikke sende vennerequest');
    } finally {
      setSendingFriendRequest(false);
    }
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

  const getMeasureTypes = (measures: { [key in MeasureType]?: number } | undefined): MeasureType[] => {
    if (!measures) return ['Slurker'];
    const validMeasureTypes: MeasureType[] = ['Slurker', 'Shot', 'Chug'];
    return Object.keys(measures).filter((key): key is MeasureType => validMeasureTypes.includes(key as MeasureType));
  };

  const getLeaderboardData = async (sortBy: 'betsWon' | 'drinksWon'): Promise<MemberDrinkStats[]> => {
    if (!selectedGroup || !selectedGroup.members) return [];

    const usernames = await fetchMemberUsernames(selectedGroup.members);
    const memberStats: { [userId: string]: MemberDrinkStats } = {};

    await Promise.all(
      selectedGroup.members.map(async (userId: string) => {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', userId));
          memberStats[userId] = {
            userId,
            username: usernames[userId] || 'Ukjent',
            wins: 0,
            totalDrinksWon: 0,
            profilePicture: userDoc.exists() ? userDoc.data().profilePicture || ImageMissing : ImageMissing,
            drinksToConsume: {},
            drinksToDistribute: {},
          };
        } catch (error) {
          console.error(`Error fetching member ${userId}:`, error);
          memberStats[userId] = {
            userId,
            username: usernames[userId] || 'Ukjent',
            wins: 0,
            totalDrinksWon: 0,
            profilePicture: ImageMissing,
            drinksToConsume: {},
            drinksToDistribute: {},
          };
        }
      })
    );

    const finishedBets = bets.filter(bet => bet.isFinished && bet.correctOptionId);
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
          stats.totalDrinksWon += calculatedAmount;
        } else {
          stats.drinksToConsume[drinkType][measureType]! += calculatedAmount;
        }
      });
    });
    
    return Object.values(memberStats).sort((a, b) => 
      sortBy === 'betsWon'? b.wins - a.wins : b.totalDrinksWon - a.totalDrinksWon
    );
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

  const handleMemberTap = (userId: string) => {
    // Find first available drink and measure type
    const drinkTypes = Object.keys(userDrinksToDistribute) as DrinkType[];
    if (drinkTypes.length === 0) return; // No drinks available
    const drinkType = drinkTypes[0];
    const measureTypes = getMeasureTypes(userDrinksToDistribute[drinkType]);
    const measureType = measureTypes[0];

    // Check if enough drinks are available
    const availableAmount = userDrinksToDistribute[drinkType]?.[measureType] || 0;
    if (availableAmount <= 0) return;

    // Update distributions
    setDistributions(prev => {
      const existing = prev.find(d => d.userId === userId && d.drinkType === drinkType && d.measureType === measureType);
      if (existing) {
        return prev.map(d =>
          d.userId === userId && d.drinkType === drinkType && d.measureType === measureType
            ? { ...d, amount: d.amount + 1 }
            : d
        );
      }
      return [...prev, { userId, drinkType, measureType, amount: 1 }];
    });

    // Update local drinksToDistribute
    setUserDrinksToDistribute(prev => {
      const updated = { ...prev };
      updated[drinkType] = { ...updated[drinkType], [measureType]: (updated[drinkType]?.[measureType] || 0) - 1 };
      // Check if updated[drinkType] exists and the measureType amount is <= 0
      if (updated[drinkType] && updated[drinkType][measureType]! <= 0) {
        delete updated[drinkType][measureType];
        if (Object.keys(updated[drinkType]).length === 0) {
          delete updated[drinkType];
        }
      }
      return updated;
    });
  };

  const renderMemberItem = ({ item }: { item: Friend }) => {
    const isCreator = selectedGroup?.createdBy === item.id;
    const isCurrentUserCreator = user?.id === selectedGroup?.createdBy;
    const isFriend = friends.some(f => f.id === item.id);
    const hasPendingRequest = pendingFriendRequests.some(r => r.toUserId === item.id);
    const isCurrentUser = user?.id === item.id;

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
        <Image source={item.profilePicture} style={[globalStyles.circularImage, { width: 50, height: 50, marginRight: 10 }]} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={[groupStyles.wagerUser, { marginBottom: 0, textAlign: 'left', lineHeight: 20 }]}>{item.name}</Text>
          <Text style={[globalStyles.secondaryText, { marginTop: 0, textAlign: 'left', lineHeight: 18 }]}>@{item.username}</Text>
        </View>
        {!isCreator && isCurrentUserCreator && !isCurrentUser && (
          <TouchableOpacity
            style={[globalStyles.outlineButtonGold, { paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'center', justifyContent: 'center', borderColor: 'red' }]}
            onPress={() => handleRemoveFriendFromGroup(item)}
            disabled={inviting || sendingFriendRequest}
          >
            <Text style={[globalStyles.outlineButtonGoldText, { color: 'red' }]}>Fjern</Text>
          </TouchableOpacity>
        )}
        {!isFriend && !hasPendingRequest && !isCurrentUserCreator && !isCurrentUser && (
          <TouchableOpacity
            style={[globalStyles.outlineButtonGold, { paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'center', justifyContent: 'center', marginLeft: 8 }]}
            onPress={() => handleSendFriendRequest(item)}
            disabled={inviting || sendingFriendRequest}
          >
            <Text style={globalStyles.outlineButtonGoldText}>Legg til</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const invitationSent = invitations.some(inv => inv.toUserId === item.id && inv.groupId === selectedGroup?.id);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
        <Image source={item.profilePicture} style={[globalStyles.circularImage, { width: 50, height: 50, marginRight: 10 }]} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={[groupStyles.wagerUser, { marginBottom: 0, textAlign: 'left', lineHeight: 20 }]}>{item.name}</Text>
          <Text style={[globalStyles.secondaryText, { marginTop: 0, textAlign: 'left', lineHeight: 18 }]}>@{item.username}</Text>
        </View>
        <TouchableOpacity
          style={[globalStyles.outlineButtonGold, { paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'center', justifyContent: 'center', backgroundColor: invitationSent ? theme.colors.surface : undefined, borderColor: invitationSent ? theme.colors.primary : undefined }]}
          onPress={() => !invitationSent && handleInviteFriend(item)}
          disabled={inviting || invitationSent}
        >
          <Text style={[globalStyles.outlineButtonGoldText, { color: invitationSent ? theme.colors.primary : undefined }]}>
            {invitationSent ? 'Invitert' : 'Inviter'}
          </Text>
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

  const renderLeaderboardItem = ({ item, index }: { item: MemberDrinkStats; index: number }) => {
    const metric = leaderboardView === 'betsWon' ? `${item.wins} bets vunnet` : `${item.totalDrinksWon} drikker vunnet`
    return (
      <View style={{flexDirection: 'row', 
      alignItems: 'center', 
      paddingVertical: 8, 
      borderBottomWidth: 1, 
      borderBottomColor: theme.colors.border }}>
          <Text style={{ 
            width: 30, 
            fontSize: 14, 
            color: theme.colors.text, 
            textAlign: 'center',
            marginRight: 10 
          }}>
            {index + 4}
          </Text>
          <Image 
            source={item.profilePicture || ImageMissing} 
            style={[globalStyles.circularImage, { width: 40, height: 40, marginRight: 10 }]} 
          />
          <View style={{ flex: 1 }}>
            <Text style={[groupStyles.wagerUser, { fontSize: 14, color: theme.colors.text }]}>
              {item.username}
            </Text>
            <Text style={[globalStyles.secondaryText, { fontSize: 12, color: theme.colors.textSecondary }]}>
              {metric}
            </Text>
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
                          style={{ marginLeft: theme.spacing.sm, opacity: deleting ? 0.5 : 1, alignSelf: 'center' }}
                        >
                          <Text style={{ color: theme.colors.error, fontWeight: 'bold', fontSize: 16, textAlign: 'right' }}>Slett gruppe</Text>
                        </TouchableOpacity>
                      )}
                      {selectedGroup && user && selectedGroup.createdBy !== user.id && (
                        <TouchableOpacity
                          onPress={handleExitGroup}
                          disabled={deleting}
                          style={{ marginLeft: theme.spacing.sm, alignSelf: 'center' }}
                        >
                          <Text style={{ color: theme.colors.error, fontWeight: 'bold', fontSize: 16, textAlign: 'right' }}>Forlat gruppe</Text>
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

        <View style={[groupStyles.createBetSection, {paddingHorizontal: theme.spacing.md}]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.xs }}>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, { flex: 1, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: theme.borderRadius.sm }]} onPress={() => setMembersModalVisible(true)}>
              <Text style={[globalStyles.outlineButtonGoldText, {fontSize: 14}]}>Medlemmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, { flex: 1, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: theme.borderRadius.sm }]} onPress={() => setInviteModalVisible(true)} disabled={inviting}>
              <Text style={[globalStyles.outlineButtonGoldText, {fontSize: 14}]}>Inviter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, { flex: 1, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: theme.borderRadius.sm }]} onPress={() => setLeaderboardModalVisible(true)}>
              <Text style={[globalStyles.outlineButtonGoldText, {fontSize: 14}]}>Ledertavle</Text>
            </TouchableOpacity>
          </View>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, { flex: 1, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: theme.borderRadius.sm }]} onPress={openBetModal}>
              <Text style={[globalStyles.outlineButtonGoldText, {fontSize: 14}]}>Opprett bett</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, { flex: 1, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: theme.borderRadius.sm }]} onPress={() => setDistributeModalVisible(true)}>
            <Text style={[globalStyles.outlineButtonGoldText, {fontSize: 14}]}>Del ut slurker</Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingBottom: theme.spacing.xl }}>
          {bets.map((item, idx) => (
            <View key={item.id}>{renderBet({ item, index: idx })}</View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={distributeModalVisible} animationType="slide" transparent onRequestClose={() => setDistributeModalVisible(false)}>
        <View style={[globalStyles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[
            globalStyles.modalContent, 
            { padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, maxHeight: '80%', width: '90%' }
          ]}>
            <Text style={[
              globalStyles.modalTitle, 
              { marginBottom: theme.spacing.md, fontSize: 18, fontWeight: '600', color: theme.colors.text }
            ]}>
              Utdel drikker
            </Text>
            {Object.keys(userDrinksToDistribute).length > 0 ? (
              <View>
                <Text style={{ fontSize: 14, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
                  Tilgjengelige drikker:
                </Text>
                {Object.entries(userDrinksToDistribute).map(([drinkType, measures]) => (
                  Object.entries(measures).map(([measureType, amount]) => (
                    <Text key={`${drinkType}-${measureType}`} style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4 }}>
                      {amount} {measureType} {drinkType}
                    </Text>
                  ))
                ))}
                <Text style={{ fontSize: 14, color: theme.colors.text, marginVertical: theme.spacing.sm }}>
                  Velg medlemmer:
                </Text>
                <FlatList
                  data={memberData}
                  renderItem={({ item }) => (
                    <View style={{ width: '33.33%', padding: theme.spacing.sm, alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={() => handleMemberTap(item.id)}
                        disabled={distributingDrinks || Object.keys(userDrinksToDistribute).length === 0}
                      >
                        <Image
                          source={item.profilePicture}
                          style={[globalStyles.circularImage, { width: 60, height: 60, marginBottom: 4 }]}
                        />
                        <Text style={[groupStyles.wagerUser, { fontSize: 12, color: theme.colors.text, textAlign: 'center' }]}>
                          {item.name}
                        </Text>
                        <Text style={[globalStyles.secondaryText, { fontSize: 10, color: theme.colors.textSecondary, textAlign: 'center' }]}>
                          @{item.username}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  keyExtractor={item => item.id}
                  numColumns={3}
                  contentContainerStyle={[globalStyles.listContainer, { paddingBottom: theme.spacing.md }]}
                  scrollEnabled
                  showsVerticalScrollIndicator={false}
                />
                <TouchableOpacity
                  style={[
                    globalStyles.outlineButtonGold,
                    { paddingVertical: 8, justifyContent: 'center', alignItems: 'center', marginTop: theme.spacing.md }
                  ]}
                  onPress={handleDistributeDrinks}
                  disabled={distributingDrinks || distributions.length === 0}
                >
                  <Text style={globalStyles.outlineButtonGoldText}>Send</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={[globalStyles.emptyStateText, { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginVertical: theme.spacing.md }]}>
                Ingen drikker tilgjengelig for utdeling
              </Text>
            )}
            <View style={[globalStyles.editButtonsContainer, { marginTop: theme.spacing.md }]}>
              <TouchableOpacity onPress={() => setDistributeModalVisible(false)} disabled={distributingDrinks}>
                <Text style={[globalStyles.cancelButtonText, { fontSize: 16, color: theme.colors.primary }]}>Lukk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={membersModalVisible} animationType="slide" transparent onRequestClose={() => setMembersModalVisible(false)}>
        <View style={[globalStyles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}> 
          <View style={[globalStyles.modalContent, {padding: theme.spacing.md, borderRadius: theme.borderRadius.lg,  maxHeight: '80%', width: '90%'}]}>
            <Text style={[globalStyles.modalTitle, { marginBottom: theme.spacing.md, fontSize: 18, fontWeight: '600', color: theme.colors.text}]}>Medlemmer i {currentGroup.name}</Text>
            {memberData.length > 0 ? (
              <FlatList
                data={memberData}
                renderItem={renderMemberItem}
                keyExtractor={item => item.id}
                contentContainerStyle={[globalStyles.listContainer, {paddingBottom: theme.spacing.md}]}
                scrollEnabled
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Text style={[globalStyles.emptyStateText, { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginVertical: theme.spacing.md}]}>Ingen medlemmer i gruppen</Text>
            )}
            <View style={[globalStyles.editButtonsContainer, { marginTop: theme.spacing.md }]}>
              <TouchableOpacity onPress={() => setMembersModalVisible(false)} disabled={inviting}>
                <Text style={[globalStyles.cancelButtonText, { fontSize: 16, color: theme.colors.primary }]}>Lukk</Text>
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
        <View style={[globalStyles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[globalStyles.modalContent, { padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, maxHeight: '80%', width: '90%' }]}>
            <Text style={[
              globalStyles.modalTitle, { marginBottom: theme.spacing.sm, fontSize: 18, fontWeight: '600', color: theme.colors.text }]}>
                Ledertavle - {leaderboardView === 'betsWon' ? 'Bets Vunnet' : 'Drikker Vunnet'}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <TouchableOpacity 
                  style={[globalStyles.outlineButtonGold,
                    { 
                      flex: 1, 
                      paddingVertical: 8, 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      borderWidth: 1,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: leaderboardView === 'betsWon' ? theme.colors.primary : 'transparent'
                    }
                  ]} 
                  onPress={() => setLeaderboardView('betsWon')}
                >
                  <Text style={[globalStyles.outlineButtonGoldText,{ color: leaderboardView === 'betsWon' ? theme.colors.background : theme.colors.primary, fontSize: 14 }]}>Bets vunnet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    globalStyles.outlineButtonGold,
                    { 
                      flex: 1, 
                      paddingVertical: 8, 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      borderWidth: 1,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor: leaderboardView === 'drinksWon' ? theme.colors.primary : 'transparent'
                    }
                  ]}
                  onPress={() => setLeaderboardView('drinksWon')}
                >
                  <Text style={[
                    globalStyles.outlineButtonGoldText,
                    { color: leaderboardView === 'drinksWon' ? theme.colors.background : theme.colors.primary, fontSize: 14 }
                  ]}>
                    Drikker Vunnet
                  </Text>
                </TouchableOpacity>
              </View>
              {leaderboardData.length > 0 ? (
                <View style={{ marginBottom: theme.spacing.md }}>
                  {/* Podium layout */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: theme.spacing.lg}}>
                    {/* 2nd Place (Silver) */}
                    {leaderboardData[1] && (
                      <View style={{ 
                        alignItems: 'center', 
                        width: '30%', 
                        marginRight: 10,
                        backgroundColor: '#C0C0C0', 
                        borderRadius: theme.borderRadius.sm, 
                        padding: 10,
                        height: 140,
                        justifyContent: 'space-between'
                        }}>
                        <Image 
                          source={leaderboardData[1].profilePicture || ImageMissing} 
                          style={[globalStyles.circularImage, { width: 50, height: 50, marginBottom: 6 }]} 
                        />
                        <Text style={{ fontSize: 14, color: theme.colors.text, textAlign: 'center' }} numberOfLines={1}>
                          {leaderboardData[1].username}
                        </Text>
                        <Image 
                          source={PencilIcon} // Placeholder, replace with ../../assets/icons/trophy.png
                          style={{ width: 24, height: 24, tintColor: theme.colors.text, marginBottom: 4 }} 
                        />
                        <Text style={{ fontSize: 12, color: theme.colors.background, textAlign: 'center', paddingBottom: 8 }}>
                          {leaderboardView === 'betsWon' ? `${leaderboardData[1].wins}` : `${leaderboardData[1].totalDrinksWon}`}
                        </Text>
                      </View>  
                    )}
                    {/* 1st Place (Gold) */}
                    {leaderboardData[0] && (
                      <View style={{ 
                        alignItems: 'center', 
                        width: '40%', 
                        backgroundColor: '#FFD700', 
                        borderRadius: theme.borderRadius.sm, 
                        padding: 12,
                        height: 170,
                        justifyContent: 'space-between'
                      }}>
                        <Image 
                          source={leaderboardData[0].profilePicture || ImageMissing} 
                          style={[globalStyles.circularImage, { width: 60, height: 60, marginBottom: 6 }]} 
                        />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text, textAlign: 'center' }} numberOfLines={1}>
                          {leaderboardData[0].username}
                        </Text>
                        <Image 
                          source={PencilIcon} // Placeholder, replace with ../../assets/icons/trophy.png
                          style={{ width: 30, height: 30, tintColor: theme.colors.text, marginBottom: 6 }} 
                        />
                        <Text style={{ fontSize: 12, color: theme.colors.background, textAlign: 'center', paddingBottom: 8 }}>
                          {leaderboardView === 'betsWon' ? `${leaderboardData[0].wins}` : `${leaderboardData[0].totalDrinksWon}`}
                        </Text>
                      </View>
                    )}
                    {/* 3rd Place (Bronze) */}
                    {leaderboardData[2] && (
                      <View style={{ 
                        alignItems: 'center', 
                        width: '30%', 
                        marginLeft: 10,
                        backgroundColor: '#CD7F32', 
                        borderRadius: theme.borderRadius.sm, 
                        padding: 10,
                        height: 140,
                        justifyContent: 'space-between'
                      }}>
                        <Image 
                          source={leaderboardData[2].profilePicture || ImageMissing} 
                          style={[globalStyles.circularImage, { width: 50, height: 50, marginBottom: 6 }]} 
                        />
                        <Text style={{ fontSize: 14, color: theme.colors.text, textAlign: 'center' }} numberOfLines={1}>
                          {leaderboardData[2].username}
                        </Text>
                        <Image 
                          source={PencilIcon} // Placeholder, replace with ../../assets/icons/trophy.png
                          style={{ width: 24, height: 24, tintColor: theme.colors.text, marginBottom: 4 }} 
                        />
                        <Text style={{ fontSize: 12, color: theme.colors.background, textAlign: 'center', paddingBottom: 8 }}>
                          {leaderboardView === 'betsWon' ? `${leaderboardData[2].wins}` : `${leaderboardData[2].totalDrinksWon}`}
                        </Text>
                      </View>
                    )}
                  </View>
                  {/* Remaining Members */}
                  {leaderboardData.length > 3 && (
                    <FlatList
                      data={leaderboardData.slice(3)}
                      renderItem={renderLeaderboardItem}
                      keyExtractor={item => item.userId}
                      contentContainerStyle={[globalStyles.listContainer, { paddingBottom: theme.spacing.md }]}
                      scrollEnabled
                      showsVerticalScrollIndicator={false}
                    />
                  )}
                </View>
              ) : (
                <Text style={[
                  globalStyles.emptyStateText, 
                  { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginVertical: theme.spacing.md }
                ]}>
                  Ingen ferdige bets ennå
                </Text>
              )}
              <View style={[globalStyles.editButtonsContainer, { marginTop: theme.spacing.md }]}>
                <TouchableOpacity onPress={() => setLeaderboardModalVisible(false)}>
                  <Text style={[globalStyles.cancelButtonText, { fontSize: 16, color: theme.colors.primary }]}>Lukk</Text>
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