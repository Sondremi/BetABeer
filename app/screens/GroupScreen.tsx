import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, getFirestore, increment, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../services/firebase/FirebaseConfig';
import { acceptFriendRequest, cancelFriendRequest, getIncomingRequest, getOutgoingRequest, sendFriendRequest } from '../services/friendService';
import { deleteGroup, distributeDrinks, exitGroup, registerConsumedDrinks, removeFriendFromGroup, sendGroupInvitation } from '../services/groupService';
import { createGroup, getGroupInvitation, updateGroupName } from '../services/profileService';
import { groupStyles } from '../styles/components/groupStyles';
import { globalStyles } from '../styles/globalStyles';
import { theme } from '../styles/theme';
import type { Bet, BettingOption, BetWager, DrinkTransaction, DrinkType, MeasureType, MemberDrinkStats } from '../types/drinkTypes';
import { Group, GroupInvitation } from '../types/drinkTypes';
import { Friend, FriendRequest } from '../types/userTypes';
import { defaultProfileImageMap } from '../utils/defaultProfileImages';
import { showAlert } from '../utils/platformAlert';

const ImageMissing = require('../../assets/images/image_missing.png');
const DefaultProfilePicture = require('../../assets/images/default/default_profilepicture.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');

const GroupScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [betModalVisible, setBetModalVisible] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [betTitle, setBetTitle] = useState('');
  const [betOptions, setBetOptions] = useState<{ name: string }[]>([{ name: '' }]);
  const [hiddenBetMemberIds, setHiddenBetMemberIds] = useState<string[]>([]);
  const [betSaving, setBetSaving] = useState(false);
  const [bets, setBets] = useState<Bet[]>([]);
  const [placeBetModalVisible, setPlaceBetModalVisible] = useState(false);
  const [selectedBetOption, setSelectedBetOption] = useState<{ bet: Bet; option: BettingOption } | null>(null);
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType>('Øl');
  const [selectedMeasureType, setSelectedMeasureType] = useState<MeasureType>('Slurker');
  const [betAmount, setBetAmount] = useState('1');
  const [betAmountFocused, setBetAmountFocused] = useState(false);
  const [placingBet, setPlacingBet] = useState(false);
  const [selectCorrectModalVisible, setSelectCorrectModalVisible] = useState(false);
  const [selectCorrectBetIdx, setSelectCorrectBetIdx] = useState<number | null>(null);
  const [editBetModalVisible, setEditBetModalVisible] = useState(false);
  const [editBetIdx, setEditBetIdx] = useState<number | null>(null);
  const [editBetTitle, setEditBetTitle] = useState('');
  const [editBetOptions, setEditBetOptions] = useState<{ name: string }[]>([]);
  const [editHiddenBetMemberIds, setEditHiddenBetMemberIds] = useState<string[]>([]);
  const [editBetSaving, setEditBetSaving] = useState(false);
  const [leaderboardModalVisible, setLeaderboardModalVisible] = useState(false);
  const [editMenuModalVisible, setEditMenuModalVisible] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<FriendRequest[]>([]);
  const [inviting, setInviting] = useState(false);
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const [distributeModalVisible, setDistributeModalVisible] = useState(false);
  const [selectedMemberForDistribution, setSelectedMemberForDistribution] = useState<string | null>(null);
  const [distributionAmount, setDistributionAmount] = useState('');
  const [selectedEditBet, setSelectedEditBet] = useState<{ bet: Bet; index: number } | null>(null);
  const [memberData, setMemberData] = useState<Friend[]>([]);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [cachedUsernames, setCachedUsernames] = useState<{ [key: string]: string }>({});
  const [leaderboardView, setLeaderboardView] = useState<'betsWon' | 'drinkStats'>('betsWon');
  const [leaderboardData, setLeaderboardData] = useState<MemberDrinkStats[]>([]);
  const [userDrinksToDistribute, setUserDrinksToDistribute] = useState<MemberDrinkStats['drinksToDistribute']>({});
  const [distributingDrinks, setDistributingDrinks] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedDistribution, setSelectedDistribution] = useState<{ drinkType: DrinkType; measureType: MeasureType; amount: number } | null>(null);
  const [distributions, setDistributions] = useState<{ userId: string; drinkType: DrinkType; measureType: MeasureType; amount: number }[]>([]);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [createGroupName, setCreateGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [sentInvitationUserIds, setSentInvitationUserIds] = useState<string[]>([]);
  const [betTitleFocused, setBetTitleFocused] = useState(false);
  const [editBetTitleFocused, setEditBetTitleFocused] = useState(false);
  const [createGroupNameFocused, setCreateGroupNameFocused] = useState(false);
  const [focusedBetOptionIndex, setFocusedBetOptionIndex] = useState<number | null>(null);
  const [focusedEditBetOptionIndex, setFocusedEditBetOptionIndex] = useState<number | null>(null);
  const [betAnonymous, setBetAnonymous] = useState(false);
  const [editBetAnonymous, setEditBetAnonymous] = useState(false);
  const [groupsResolved, setGroupsResolved] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [distributionLoading, setDistributionLoading] = useState(false);
  const [consumingDrinkKey, setConsumingDrinkKey] = useState<string | null>(null);
  const [drinkDetailViewByUser, setDrinkDetailViewByUser] = useState<Record<string, 'consume' | 'consumed' | 'distribute'>>({});

  const currentGroup: Group & { image: any } = selectedGroup
    ? { ...selectedGroup, name: groupName, image: selectedGroup.image ?? ImageMissing }
    : { id: 'default', name: 'Gruppenavn', memberCount: 0, image: ImageMissing, createdBy: '', members: [] };
  const drinkTypes: DrinkType[] = ['Øl', 'Cider', 'Hard selzer', 'Vin', 'Sprit'];
  const measureTypes: MeasureType[] = ['Slurker', 'Shot', 'Chug'];
  const availableFriends = friends.filter(friend => !selectedGroup?.members.includes(friend.id));
  const shouldScrollMembers = memberData.length > 5;
  const shouldScrollAvailableFriends = availableFriends.length > 5;
  const canSaveBet = betTitle.trim().length > 0 && betOptions.length > 0 && betOptions.every(opt => opt.name.trim().length > 0);
  const availableDistributionEntries = Object.entries(userDrinksToDistribute).flatMap(([drinkType, measures]) =>
    Object.entries(measures || {})
      .filter(([, amount]) => Number(amount) > 0)
      .map(([measureType, amount]) => ({
        drinkType: drinkType as DrinkType,
        measureType: measureType as MeasureType,
        amount: Number(amount),
      }))
  );
  const hasAvailableDrinks = availableDistributionEntries.length > 0;

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchGroupsAndInvitations = async () => {
      setGroupsResolved(false);
      const groupQuery = query(collection(firestore, 'groups'), where('members', 'array-contains', user.id));
      const groupSnapshot = await getDocs(groupQuery);
      if (!isMounted) return;
      const groupList = groupSnapshot.docs.map((docSnap) => {
        const groupData = docSnap.data();
        return {
          id: docSnap.id,
          name: groupData.name || groupData.groupName || groupData.group_name || 'Gruppenavn',
          memberCount: groupData.members?.length || 0,
          image: ImageMissing,
          createdBy: groupData.createdBy || '',
          members: groupData.members || [],
        };
      });
      const uniqueGroups = Array.from(new Map(groupList.map((group) => [group.id, group])).values());
      setGroups(uniqueGroups);

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
      
      if (groupFromParams && !foundGroup) {
        AsyncStorage.removeItem('lastSelectedGroup').catch(error => {
          console.error('Error removing invalid group from storage:', error);
        });
      }
      
      setSelectedGroup(foundGroup ?? null);
      setGroupsResolved(true);
    };
    fetchGroupsAndInvitations();
    return () => {
      isMounted = false;
    };
  }, [user, params.selectedGroup]);

  useEffect(() => {
    if (!user || !groupsResolved) return;
    if (!selectedGroup && groups.length === 0) {
      router.replace('/profile');
    }
  }, [user, groupsResolved, selectedGroup, groups.length, router]);

  useEffect(() => {
    if (selectedGroup && selectedGroup.name !== groupName) {
      setGroupName(selectedGroup.name);
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedGroup) {
      AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(selectedGroup)).catch(error => {
        console.error('Error saving last selected group:', error);
      });
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
                    profilePicture: friendData.profileImage ? 
                      defaultProfileImageMap[friendData.profileImage] || DefaultProfilePicture 
                      : DefaultProfilePicture,
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
    if (!leaderboardModalVisible) return;

    let isMounted = true;
    const refreshLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        const data = await getLeaderboardData();
        if (isMounted) setLeaderboardData(data);
      } finally {
        if (isMounted) setLeaderboardLoading(false);
      }
    };

    refreshLeaderboard();
    return () => {
      isMounted = false;
    };
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
            const userData = userDoc.data();
            const profileImage = userData?.profileImage;
            return {
              id: memberId,
              name: userData?.name || 'Ukjent navn',
              username: usernames[memberId] || 'ukjent',
              profilePicture: profileImage ? 
                defaultProfileImageMap[profileImage] || DefaultProfilePicture 
                : DefaultProfilePicture,
            };
          } catch (error) {
            console.error(`Error fetching member ${memberId}:`, error);
            return {
              id: memberId,
              name: 'Ukjent navn',
              username: usernames[memberId] || 'ukjent',
              profilePicture: DefaultProfilePicture,
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
    if (!user?.id || !selectedGroup?.id || !membersModalVisible) return;

    const fetchSentInvitations = async () => {
      try {
        const sentInvitationQuery = query(
          collection(firestore, 'group_invitations'),
          where('fromUserId', '==', user.id),
          where('groupId', '==', selectedGroup.id),
          where('status', '==', 'pending')
        );
        const sentInvitationSnapshot = await getDocs(sentInvitationQuery);
        const invitedUserIds = Array.from(
          new Set(
            sentInvitationSnapshot.docs
              .map((docSnap) => docSnap.data().toUserId)
              .filter((id): id is string => typeof id === 'string')
          )
        );
        setSentInvitationUserIds(invitedUserIds);
      } catch (error) {
        console.error('Error fetching sent group invitations:', error);
      }
    };

    fetchSentInvitations();
  }, [user?.id, selectedGroup?.id, membersModalVisible]);

  useEffect(() => {
    if (!user?.id || !selectedGroup?.id || !distributeModalVisible) return;

    let isMounted = true;
    const loadAvailableDrinks = async () => {
      setDistributionLoading(true);
      try {
        const data = await getLeaderboardData();
        if (!isMounted) return;
        const userStats = data.find(stat => stat.userId === user.id);
        setUserDrinksToDistribute(userStats?.drinksToDistribute || {});
      } finally {
        if (isMounted) setDistributionLoading(false);
      }
    };

    loadAvailableDrinks();
    return () => {
      isMounted = false;
    };
  }, [distributeModalVisible, user?.id, selectedGroup?.id]);

  const openMembersModal = async () => {
    if (!user?.id) {
      setMembersModalVisible(true);
      return;
    }

    setMembersModalVisible(true);
    setMembersLoading(true);
    try {
      const requestsPromise = getOutgoingRequest(user.id)
        .then(setPendingFriendRequests)
        .catch((error) => {
          console.error('Error fetching pending friend requests:', error);
        });

      const invitationsPromise = selectedGroup?.id
        ? (async () => {
            try {
              const sentInvitationQuery = query(
                collection(firestore, 'group_invitations'),
                where('fromUserId', '==', user.id),
                where('groupId', '==', selectedGroup.id),
                where('status', '==', 'pending')
              );
              const sentInvitationSnapshot = await getDocs(sentInvitationQuery);
              const invitedUserIds = Array.from(
                new Set(
                  sentInvitationSnapshot.docs
                    .map((docSnap) => docSnap.data().toUserId)
                    .filter((id): id is string => typeof id === 'string')
                )
              );
              setSentInvitationUserIds(invitedUserIds);
            } catch (error) {
              console.error('Error fetching sent group invitations:', error);
            }
          })()
        : Promise.resolve();

      await Promise.all([requestsPromise, invitationsPromise]);
    } finally {
      setMembersLoading(false);
    }
  };

  const openLeaderboardModal = async () => {
    setLeaderboardModalVisible(true);
    setLeaderboardLoading(true);
    try {
      const data = await getLeaderboardData();
      setLeaderboardData(data);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const openDistributeModal = async () => {
    if (!user?.id || !selectedGroup?.id) {
      setDistributeModalVisible(true);
      return;
    }

    setDistributeModalVisible(true);
    setDistributionLoading(true);
    try {
      const data = await getLeaderboardData();
      const userStats = data.find((stat) => stat.userId === user.id);
      setUserDrinksToDistribute(userStats?.drinksToDistribute || {});
    } finally {
      setDistributionLoading(false);
    }
  };

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
      
      // Refresh all data
      const updatedLeaderboard = await getLeaderboardData();
      setLeaderboardData(updatedLeaderboard);
      
      // Update user's available drinks
      const userStats = updatedLeaderboard.find(stat => stat.userId === user.id);
      setUserDrinksToDistribute(userStats?.drinksToDistribute || {});
      
      // Clear state
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
      // Check for existing incoming request from this member first
      const incomingRequests = await getIncomingRequest(user.id);
      const existingRequest = incomingRequests.find(request => request.fromUserId === member.id);

      if (existingRequest) {
        await acceptFriendRequest(existingRequest.id, existingRequest.fromUserId, existingRequest.toUserId);
        showAlert('Suksess', `Du og ${member.name} er nå venner`);
      } else {
        await sendFriendRequest(member.id);
        const updatedRequests = await getOutgoingRequest(user.id);
        setPendingFriendRequests(updatedRequests);
        showAlert('Suksess', `Vennerequest sendt til ${member.name}`);
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
      showAlert('Feil', (error as Error).message || 'Kunne ikke håndtere vennerequest');
    } finally {
      setSendingFriendRequest(false);
    }
  };

  const handleCancelPendingFriendRequest = async (member: Friend) => {
    const pendingRequest = pendingFriendRequests.find((request) => request.toUserId === member.id);
    if (!pendingRequest?.id || !user?.id) return;

    setSendingFriendRequest(true);
    try {
      await cancelFriendRequest(pendingRequest.id);
      const updatedRequests = await getOutgoingRequest(user.id);
      setPendingFriendRequests(updatedRequests);
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      showAlert('Feil', (error as Error).message || 'Kunne ikke angre vennerequest');
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
      setSentInvitationUserIds(prev => prev.includes(friend.id) ? prev : [...prev, friend.id]);
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

  const handleCreateGroup = async () => {
    if (!user) return;
    const trimmedGroupName = createGroupName.trim();
    if (!trimmedGroupName) {
      showAlert('Feil', 'Gruppenavn kan ikke være tomt');
      return;
    }
    setCreatingGroup(true);
    try {
      const newGroup = await createGroup(user.id, trimmedGroupName);
      const groupWithImage: Group = { ...newGroup, image: ImageMissing };
      setGroups(prev => prev.some(group => group.id === groupWithImage.id) ? prev : [...prev, groupWithImage]);
      setSelectedGroup(groupWithImage);
      setCreateGroupModalVisible(false);
      setCreateGroupName('');
      
      await AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(groupWithImage));
      
      showAlert('Suksess', 'Gruppe opprettet!');
    } catch (error) {
      console.error('Error creating group:', error);
      showAlert('Feil', 'Kunne ikke opprette gruppe');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSaveGroupName = async () => {
    if (!selectedGroup) return;
    if (selectedGroup.createdBy !== user?.id) {
      showAlert('Ikke tilgang', 'Kun gruppeeier kan endre gruppenavn.');
      return;
    }
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      showAlert('Feil', 'Gruppenavn kan ikke være tomt');
      return;
    }
    setSaving(true);
    try {
      await updateGroupName(selectedGroup.id, trimmedName);
      const updatedGroup = { ...selectedGroup, name: trimmedName };
      setSelectedGroup(updatedGroup);
      setGroups(prev => prev.map(group => group.id === selectedGroup.id ? { ...group, name: trimmedName } : group));
      await AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(updatedGroup));
      setEditingName(false);
    } catch (error) {
      console.error('Error saving group name:', error);
      showAlert('Feil', `Kunne ikke oppdatere gruppenavn: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const openBetModal = () => {
    setBetTitle('');
    setBetOptions([{ name: '' }]);
    setHiddenBetMemberIds([]);
    setBetAnonymous(false);
    setBetModalVisible(true);
  };

  const toggleHiddenBetMember = (memberId: string) => {
    setHiddenBetMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const toggleEditHiddenBetMember = (memberId: string) => {
    setEditHiddenBetMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const addBetOption = () => {
    setBetOptions([...betOptions, { name: '' }]);
  };

  const updateBetOption = (idx: number, field: 'name', value: string) => {
    setBetOptions(prev => prev.map((opt, i) => (i === idx ? { ...opt, [field]: value } : opt)));
  };

  const handleSaveBet = async () => {
    if (!selectedGroup || !user?.id) return;
    if (!betTitle.trim()) {
      showAlert('Feil', 'Bet-tittel kan ikke være tom');
      return;
    }
    if (betOptions.some(opt => !opt.name.trim())) {
      showAlert('Feil', 'Alle alternativer må ha navn');
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
        })),
        wagers: [],
        hiddenFromUserIds: hiddenBetMemberIds,
        createdByUserId: user.id,
        createdByUsername: user.username || user.name || 'Unknown',
        isAnonymous: betAnonymous,
        createdAt: Date.now(),
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

  const canManageBet = (bet: Bet) => {
    if (!user?.id) return false;
    return bet.createdByUserId === user.id;
  };

  const openEditBetModal = (bet: Bet, idx: number) => {
    if (!canManageBet(bet)) {
      showAlert('Ikke tilgang', 'Kun den som opprettet bettet kan redigere eller markere det som ferdig.');
      return;
    }
    setSelectedEditBet({ bet, index: idx });
    setEditBetIdx(idx);
    setEditBetAnonymous(Boolean(bet.isAnonymous));
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
        const targetBet = groupBets[selectCorrectBetIdx];
        if (!targetBet || targetBet.createdByUserId !== user?.id) {
          throw new Error('Only the bet creator can mark this bet as finished.');
        }
        const newBets = [...groupBets];

        if (optionId === null) {
          delete newBets[selectCorrectBetIdx].correctOptionId;
          newBets[selectCorrectBetIdx].isFinished = false;
        } else {
          newBets[selectCorrectBetIdx].correctOptionId = optionId;
          newBets[selectCorrectBetIdx].isFinished = true;
          
          // Calculate and update rewards for each wager
          const finishedBet = newBets[selectCorrectBetIdx];
          const wagers = finishedBet.wagers || [];
          
          // Process each wager individually
          await Promise.all(wagers.map(async (wager: BetWager) => {
            const userRef = doc(db, 'users', wager.userId);
            
            if (wager.optionId === optionId) {
              // Winner: gets their own bet amount as distributable drinks
              await updateDoc(userRef, {
                [`drinksToDistribute.${wager.drinkType}.${wager.measureType}`]: increment(wager.amount)
              });
            } else {
              // Loser: gets their own bet amount as drinks to consume
              await updateDoc(userRef, {
                [`drinksToConsume.${wager.drinkType}.${wager.measureType}`]: increment(wager.amount)
              });
            }
          }));
        }

        await updateDoc(groupRef, { bets: newBets });
        setBets(newBets);
        
        // Refresh leaderboard data to show updated drink distributions
        const updatedLeaderboard = await getLeaderboardData();
        setLeaderboardData(updatedLeaderboard);
        
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
    setEditBetOptions([...editBetOptions, { name: '' }]);
  };

  const handleSaveEditBet = async () => {
    if (editBetIdx === null || !selectedGroup) return;
    if (!editBetTitle.trim()) {
      showAlert('Feil', 'Bet-tittel kan ikke være tom');
      return;
    }
    if (editBetOptions.some(opt => !opt.name.trim())) {
      showAlert('Feil', 'Alle alternativer må ha navn');
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
      const originalBet = groupBets[editBetIdx];
      if (!originalBet || originalBet.createdByUserId !== user?.id) {
        throw new Error('Only the bet creator can edit this bet.');
      }
      const updatedBet = {
        ...originalBet,
        title: editBetTitle,
        options: editBetOptions.map((opt, idx) => ({
          id: `${originalBet.id}_${idx}`,
          name: opt.name,
        })),
        hiddenFromUserIds: editHiddenBetMemberIds,
        isAnonymous: editBetAnonymous,
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

  const handleDeleteBet = async (betIndex: number) => {
    if (!selectedGroup) return;
    
    setEditBetSaving(true);
    try {
      const db = getFirestore();
      const groupRef = doc(db, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      let groupBets: Bet[] = [];
      if (groupSnap.exists() && groupSnap.data().bets) {
        groupBets = groupSnap.data().bets;
      }
      const targetBet = groupBets[betIndex];
      if (!targetBet || targetBet.createdByUserId !== user?.id) {
        throw new Error('Only the bet creator can delete this bet.');
      }
      const newBets = groupBets.filter((_, idx: number) => idx !== betIndex);
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
  };

  const getLeaderboardData = async (): Promise<MemberDrinkStats[]> => {
    if (!selectedGroup || !selectedGroup.members) return [];

    const usernames = await fetchMemberUsernames(selectedGroup.members);
    const memberStats: { [userId: string]: MemberDrinkStats } = {};

    await Promise.all(
      selectedGroup.members.map(async (userId: string) => {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', userId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          memberStats[userId] = {
            userId,
            username: usernames[userId] || 'Ukjent',
            betsWon: 0,
            betsLost: 0,
            profilePicture: userData.profileImage ? 
              defaultProfileImageMap[userData.profileImage] || DefaultProfilePicture 
              : DefaultProfilePicture,
            drinksToConsume: userData.drinksToConsume || {},
            drinksConsumed: userData.drinksConsumed || {},
            drinksToDistribute: userData.drinksToDistribute || {},
            transactions: [],
          };
        } catch (error) {
          console.error(`Error fetching member ${userId}:`, error);
          memberStats[userId] = {
            userId,
            username: usernames[userId] || 'Ukjent',
            betsWon: 0,
            betsLost: 0,
            profilePicture: DefaultProfilePicture,
            drinksToConsume: {},
            drinksConsumed: {},
            drinksToDistribute: {},
            transactions: [],
          };
        }
      })
    );

    const finishedBets = bets.filter(bet => bet.isFinished && bet.correctOptionId);
    finishedBets.forEach(bet => {
      const wagers = bet.wagers || [];
      
      // Only count wins and losses, don't modify drink amounts since they're already in Firestore
      wagers.forEach(wager => {
        const stats = memberStats[wager.userId];
        if (!stats) return;

        stats.username = usernames[wager.userId] || wager.username || 'Ukjent';
        
        if (wager.optionId === bet.correctOptionId) {
          stats.betsWon += 1;
        } else {
          stats.betsLost += 1;
        }
      });
    });

    // Collect distribution transactions from Firestore
    const transactionsRef = collection(firestore, `groups/${selectedGroup.id}/transactions`);
    const transactionsSnapshot = await getDocs(transactionsRef);
    const distributionHistory: DrinkTransaction[] = transactionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        fromUserId: data.fromUserId,
        fromUsername: data.fromUsername,
        toUserId: data.toUserId,
        toUsername: data.toUsername,
        drinkType: data.drinkType,
        measureType: data.measureType,
        amount: data.amount,
        source: data.source,
        timestamp: data.timestamp,
      } as DrinkTransaction;
    });
    
    distributionHistory.forEach((dist: DrinkTransaction) => {
      const receiverStats = memberStats[dist.toUserId];
      if (receiverStats) {
  const drinkTypeObj = receiverStats.drinksToConsume[dist.drinkType] ?? (receiverStats.drinksToConsume[dist.drinkType] = {});
  drinkTypeObj[dist.measureType] = (drinkTypeObj[dist.measureType] ?? 0) + dist.amount;
        receiverStats.transactions.push(dist);
      }
    });
    
    // Sort by bets won descending
    return Object.values(memberStats).sort((a, b) => b.betsWon - a.betsWon);
  };

  const handleMemberTap = (userId: string) => {
    setSelectedMember(userId);
    setSelectedDistribution(null);
  };

  const handleDistributionSelect = (drinkType: DrinkType, measureType: MeasureType) => {
    if (!selectedMember) return;
    setSelectedDistribution({ drinkType, measureType, amount: 1 });
  };

  const handleDistributionAmountChange = (amount: number) => {
    if (!selectedDistribution || !selectedMember) return;
    setSelectedDistribution(prev => prev ? { ...prev, amount: Math.max(1, amount) } : null);
  };

  const handleCancelDistributionFlow = () => {
    setSelectedMember(null);
    setSelectedDistribution(null);
    setDistributions([]);
    setDistributeModalVisible(false);
  };

  const handleConfirmDistribution = () => {
    if (!selectedMember || !selectedDistribution) return;

    const { drinkType, measureType, amount } = selectedDistribution;
    
    const alreadyDistributed = distributions.reduce((sum, dist) => {
      if (dist.drinkType === drinkType && dist.measureType === measureType) {
        return sum + dist.amount;
      }
      return sum;
    }, 0);

    const totalAvailable = userDrinksToDistribute[drinkType]?.[measureType] || 0;
    const remainingAvailable = totalAvailable - alreadyDistributed;

    console.log('Distribution check:', {
      totalAvailable,
      alreadyDistributed,
      remainingAvailable,
      tryingToDistribute: amount,
      allDistributions: distributions,
      currentDistribution: selectedDistribution
    });

    // Check if enough drinks are available
    if (remainingAvailable < amount) {
      showAlert('Feil', `Du har kun ${remainingAvailable} ${measureType} ${drinkType} tilgjengelig`);
      return;
    }

    setDistributions(prev => [...prev, { userId: selectedMember, drinkType, measureType, amount }]);

    // Remove distributed drinks from available pool
    setUserDrinksToDistribute(prev => {
      const newAmount = (prev[drinkType]?.[measureType] || 0) - amount;
      if (newAmount <= 0) {
        const updated = { ...prev };
        if (updated[drinkType]) {
          delete updated[drinkType][measureType];
          if (Object.keys(updated[drinkType]).length === 0) {
            delete updated[drinkType];
          }
        }
        return updated;
      }
      return {
        ...prev,
        [drinkType]: {
          ...prev[drinkType],
          [measureType]: newAmount
        }
      };
    });

    setSelectedMember(null);
    setSelectedDistribution(null);
  };

  // Used in drink distribution UI to show member cards for selection
  const renderMemberCard = ({ item }: { item: Friend }) => {
    const isSelected = selectedMember === item.id;
    const selectedEntry = selectedDistribution
      ? availableDistributionEntries.find(
          (entry) => entry.drinkType === selectedDistribution.drinkType && entry.measureType === selectedDistribution.measureType
        )
      : null;
    const maxAvailable = selectedEntry?.amount || 0;
    const amountOptions = selectedEntry
      ? Array.from(new Set([1, 2, 3, 4, 5, 10, maxAvailable].filter((num) => num > 0 && num <= maxAvailable))).sort((a, b) => a - b)
      : [];

    return (
      <View
        style={[
          groupStyles.modalSectionCard,
          isSelected && groupStyles.memberSelectCardActive,
          (distributingDrinks || !hasAvailableDrinks) && globalStyles.disabledButton,
        ]}
      >
        <TouchableOpacity style={groupStyles.memberRow} onPress={() => handleMemberTap(item.id)} disabled={distributingDrinks || !hasAvailableDrinks}>
          <Image
            source={item.profilePicture}
            style={[globalStyles.circularImage, groupStyles.memberAvatar, isSelected && groupStyles.memberSelectAvatarActive]}
          />
          <View style={groupStyles.memberMeta}>
            <Text style={[groupStyles.wagerUser, isSelected && groupStyles.memberSelectNameActive]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={groupStyles.memberUsername}>@{item.username}</Text>
          </View>
          <Text style={[groupStyles.memberActionText, isSelected ? groupStyles.memberSelectLabel : globalStyles.secondaryText]}>
            {isSelected ? 'Valgt' : 'Velg'}
          </Text>
        </TouchableOpacity>

        {isSelected && hasAvailableDrinks && (
          <View style={groupStyles.memberDistributionPanel}>
            <Text style={groupStyles.modalSectionTitle}>Velg drikke</Text>
            {availableDistributionEntries.map((entry) => (
              <TouchableOpacity
                key={`${entry.drinkType}-${entry.measureType}`}
                onPress={() => handleDistributionSelect(entry.drinkType, entry.measureType)}
                style={[
                  groupStyles.distributionChoiceButton,
                  selectedDistribution?.drinkType === entry.drinkType &&
                    selectedDistribution?.measureType === entry.measureType &&
                    groupStyles.distributionChoiceButtonActive,
                ]}
              >
                <Text
                  style={[
                    groupStyles.distributionChoiceText,
                    selectedDistribution?.drinkType === entry.drinkType &&
                      selectedDistribution?.measureType === entry.measureType &&
                      groupStyles.distributionChoiceTextActive,
                  ]}
                >
                  {entry.measureType} {entry.drinkType}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedDistribution && selectedDistribution.amount > 0 && (
              <>
                <Text style={groupStyles.memberDistributionHelperText}>Velg antall</Text>
                <View style={groupStyles.amountChipRow}>
                  {amountOptions.map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => handleDistributionAmountChange(num)}
                      style={[groupStyles.amountChip, selectedDistribution.amount === num && groupStyles.amountChipSelected]}
                    >
                      <Text style={[groupStyles.amountChipText, selectedDistribution.amount === num && groupStyles.amountChipTextSelected]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[globalStyles.outlineButtonGold, groupStyles.memberDistributionAddButton]} onPress={handleConfirmDistribution}>
                  <Text style={globalStyles.outlineButtonGoldText}>
                    Legg til
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  // Used in members list to show member details with admin/friend actions
  const renderMemberItem = ({ item }: { item: Friend }) => {
    const isCreator = selectedGroup?.createdBy === item.id;
    const isCurrentUserCreator = user?.id === selectedGroup?.createdBy;
    const isCurrentUser = user?.id === item.id;
    const isFriend = friends.some(friend => friend.id === item.id);
    const pendingRequest = pendingFriendRequests.find(request => request.toUserId === item.id);
    const hasPendingRequest = Boolean(pendingRequest);

    return (
      <View style={groupStyles.memberRow}>
        <Image source={item.profilePicture} style={[globalStyles.circularImage, groupStyles.memberAvatar]} />
        <View style={groupStyles.memberMeta}>
          <Text style={[groupStyles.wagerUser, groupStyles.memberName]}>
            {item.name} {isCreator}
          </Text>
          <Text style={[globalStyles.secondaryText, groupStyles.memberUsername]}>@{item.username}</Text>
        </View>
        {/* Show remove button for admins */}
        {!isCreator && isCurrentUserCreator && !isCurrentUser && (
          <TouchableOpacity
            style={[globalStyles.outlineButtonGold, groupStyles.memberActionButton, groupStyles.memberActionDangerBorder]}
            onPress={() => handleRemoveFriendFromGroup(item)}
            disabled={false}
          >
            <Text style={[globalStyles.outlineButtonGoldText, groupStyles.memberActionText, groupStyles.memberActionDangerText]}>Fjern</Text>
          </TouchableOpacity>
        )}
        {/* Show add friend button for non-friends who haven't received a request */}
        {!isFriend && !hasPendingRequest && !isCurrentUser && !isCurrentUserCreator && (
          <TouchableOpacity
            style={[globalStyles.outlineButtonGold, groupStyles.memberActionButton, groupStyles.memberActionButtonWithGap]}
            onPress={() => handleSendFriendRequest(item)}
            disabled={inviting || sendingFriendRequest}
          >
            <Text style={[globalStyles.outlineButtonGoldText, groupStyles.memberActionText]}>Legg til venn</Text>
          </TouchableOpacity>
        )}
        {!isFriend && hasPendingRequest && !isCurrentUser && !isCurrentUserCreator && (
          <TouchableOpacity
            style={[globalStyles.outlineButtonGold, groupStyles.memberActionButton, groupStyles.memberActionButtonWithGap]}
            onPress={() => handleCancelPendingFriendRequest(item)}
            disabled={sendingFriendRequest}
          >
            <Text style={[globalStyles.outlineButtonGoldText, groupStyles.memberActionText]}>Angre</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const invitationSent = sentInvitationUserIds.includes(item.id);
    return (
      <View style={groupStyles.memberRow}>
        <Image source={item.profilePicture} style={[globalStyles.circularImage, groupStyles.memberAvatar]} />
        <View style={groupStyles.memberMeta}>
          <Text style={[groupStyles.wagerUser, groupStyles.memberName]}>{item.name}</Text>
          <Text style={[globalStyles.secondaryText, groupStyles.memberUsername]}>@{item.username}</Text>
        </View>
        <TouchableOpacity
          style={[
            globalStyles.outlineButtonGold,
            groupStyles.memberActionButton,
            invitationSent && { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary },
          ]}
          onPress={() => !invitationSent && handleInviteFriend(item)}
          disabled={inviting || invitationSent}
        >
          <Text style={[globalStyles.outlineButtonGoldText, groupStyles.memberActionText, { color: invitationSent ? theme.colors.primary : undefined }]}> 
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
            <>
            </>
          )}
        </View>
        <Text
          style={[
            groupStyles.optionName,
            isUserChoice && groupStyles.optionNameSelected,
            isCorrect && groupStyles.optionNameCorrect,
            isBetFinished && !isCorrect && groupStyles.optionNameIncorrect,
          ]}
        />
        
      </TouchableOpacity>
    );
  };

  const renderBet = ({ item, index }: { item: Bet; index: number }) => {
    const userWager = getUserWagerForBet(item);
    const creatorName = item.createdByUsername?.trim() || '';
    const createdAtLabel = item.createdAt
      ? (() => {
          const createdDate = new Date(item.createdAt);
          const dateLabel = createdDate.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit' });
          const timeLabel = createdDate.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
          return `${dateLabel} kl ${timeLabel}`;
        })()
      : null;
    const betMeta = item.isAnonymous
      ? createdAtLabel
      : [creatorName ? `Av ${creatorName}` : '', createdAtLabel]
          .filter(Boolean)
          .join(' • ');
    const shouldScrollWagers = Boolean(item.wagers && item.wagers.length > 5);

    return (
      <View style={groupStyles.betContainer}>
        <View style={[globalStyles.contentCard, groupStyles.betSpacing]}>
          <View style={globalStyles.rowSpread}>
            <View style={{ flex: 1 }}>
              <Text style={groupStyles.betTitle}>{item.title}</Text>
              {betMeta ? <Text style={groupStyles.betMetaText}>{betMeta}</Text> : null}
              {item.isFinished && (
                <Text style={groupStyles.betStatusText}>
                  Ferdig - Riktig svar: {getOptionName(item, item.correctOptionId || '')}
                </Text>
              )}
            </View>
            {canManageBet(item) && (
              <TouchableOpacity onPress={() => openEditBetModal(item, index)}>
                <Image source={PencilIcon} style={globalStyles.primaryIcon} />
              </TouchableOpacity>
            )}
          </View>

          <View style={globalStyles.listContainer}>
            {item.options.map((option) => (
              <View key={option.id}>{renderBettingOption({ item: option, bet: item })}</View>
            ))}
          </View>

          {item.wagers && item.wagers.length > 0 && (
            <View style={globalStyles.sectionDivider}>
              <Text style={groupStyles.wagersSectionTitle}>Plasserte bets ({item.wagers.length}):</Text>
              <ScrollView
                style={shouldScrollWagers ? groupStyles.wagersScrollWrap : undefined}
                nestedScrollEnabled={shouldScrollWagers}
                showsVerticalScrollIndicator={shouldScrollWagers}
              >
                {item.wagers.map((wager, idx) => (
                  <View key={idx} style={groupStyles.wagerListItem}>
                    <Text style={groupStyles.wagerUser}>{wager.username}</Text>
                    <Text style={groupStyles.wagerDetails}>
                      {wager.amount} {wager.measureType} {wager.drinkType} på {getOptionName(item, wager.optionId)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTransactionItem = ({ item }: { item: DrinkTransaction }) => (
    <View style={groupStyles.transactionRow}>
      <Text style={groupStyles.transactionTitleText}>
        {item.fromUsername} → {item.toUsername}
      </Text>
      <Text style={groupStyles.transactionDetailText}>
        {item.amount} {item.measureType} {item.drinkType}
      </Text>
    </View>
  );

  const renderDetailedDrinkOverview = ({ item }: { item: MemberDrinkStats }) => {
    type DrinkDetailView = 'consume' | 'consumed' | 'distribute';

    type DrinkBreakdownRow = {
      key: string;
      label: string;
      amount: number;
      drinkType?: DrinkType;
      measureType?: MeasureType;
    };

    const isOwnUser = item.userId === user?.id;
    const selectedDetailView: DrinkDetailView = drinkDetailViewByUser[item.userId] || 'consume';
    const totalToConsume = Object.values(item.drinksToConsume).reduce((sum, drinkTypeObj) => {
      return sum + Object.values(drinkTypeObj || {}).reduce((s, v) => s + (v || 0), 0);
    }, 0);
    const totalConsumed = Object.values(item.drinksConsumed || {}).reduce((sum, drinkTypeObj) => {
      return sum + Object.values(drinkTypeObj || {}).reduce((s, v) => s + (v || 0), 0);
    }, 0);
    const totalToDistribute = Object.values(item.drinksToDistribute).reduce((sum, drinkTypeObj) => {
      return sum + Object.values(drinkTypeObj || {}).reduce((s, v) => s + (v || 0), 0);
    }, 0);

    // Create a detailed breakdown of drinks to consume
    const drinkBreakdown: { [key: string]: { [key: string]: number } } = {};
    
    Object.entries(item.drinksToConsume).forEach(([drinkType, measures]) => {
      Object.entries(measures || {}).forEach(([measureType, amount]) => {
        if (!drinkBreakdown[drinkType]) drinkBreakdown[drinkType] = {};
        drinkBreakdown[drinkType][measureType] = (drinkBreakdown[drinkType][measureType] || 0) + (amount || 0);
      });
    });
    const drinkBreakdownRows: DrinkBreakdownRow[] = Object.entries(drinkBreakdown).flatMap(([drinkType, measures]) =>
      Object.entries(measures)
        .filter(([, amount]) => Number(amount) > 0)
        .map(([measureType, amount]) => ({
          key: `${drinkType}-${measureType}`,
          drinkType: drinkType as DrinkType,
          measureType: measureType as MeasureType,
          label: `${drinkType} - ${measureType}`,
          amount,
        }))
    );

    const consumedBreakdown: { [key: string]: { [key: string]: number } } = {};
    Object.entries(item.drinksConsumed || {}).forEach(([drinkType, measures]) => {
      Object.entries(measures || {}).forEach(([measureType, amount]) => {
        if (!consumedBreakdown[drinkType]) consumedBreakdown[drinkType] = {};
        consumedBreakdown[drinkType][measureType] = (consumedBreakdown[drinkType][measureType] || 0) + (amount || 0);
      });
    });
    const consumedBreakdownRows: DrinkBreakdownRow[] = Object.entries(consumedBreakdown).flatMap(([drinkType, measures]) =>
      Object.entries(measures)
        .filter(([, amount]) => Number(amount) > 0)
        .map(([measureType, amount]) => ({
          key: `consumed-${drinkType}-${measureType}`,
          label: `${drinkType} - ${measureType}`,
          amount,
        }))
    );

    const distributeBreakdown: { [key: string]: { [key: string]: number } } = {};
    Object.entries(item.drinksToDistribute || {}).forEach(([drinkType, measures]) => {
      Object.entries(measures || {}).forEach(([measureType, amount]) => {
        if (!distributeBreakdown[drinkType]) distributeBreakdown[drinkType] = {};
        distributeBreakdown[drinkType][measureType] = (distributeBreakdown[drinkType][measureType] || 0) + (amount || 0);
      });
    });
    const distributeBreakdownRows: DrinkBreakdownRow[] = Object.entries(distributeBreakdown).flatMap(([drinkType, measures]) =>
      Object.entries(measures)
        .filter(([, amount]) => Number(amount) > 0)
        .map(([measureType, amount]) => ({
          key: `distribute-${drinkType}-${measureType}`,
          label: `${drinkType} - ${measureType}`,
          amount,
        }))
    );

    const selectedRows: DrinkBreakdownRow[] =
      selectedDetailView === 'consume'
        ? drinkBreakdownRows
        : selectedDetailView === 'consumed'
          ? consumedBreakdownRows
          : distributeBreakdownRows;

    const selectedSectionTitle =
      selectedDetailView === 'consume'
        ? 'Må drikke'
        : selectedDetailView === 'consumed'
          ? 'Drukket'
          : 'Til utdeling';

    const handleRegisterConsumedDrink = async (drinkType: DrinkType, measureType: MeasureType) => {
      if (!user?.id) return;
      const actionKey = `${drinkType}-${measureType}`;
      setConsumingDrinkKey(actionKey);
      try {
        await registerConsumedDrinks(user.id, [{ drinkType, measureType, amount: 1 }]);
        const updatedLeaderboard = await getLeaderboardData();
        setLeaderboardData(updatedLeaderboard);
      } catch (error) {
        console.error('Error registering consumed drink:', error);
        showAlert('Feil', (error as Error).message || 'Kunne ikke registrere drukket');
      } finally {
        setConsumingDrinkKey(null);
      }
    };

    return (
      <View style={groupStyles.detailedMemberCard}>
        <View style={groupStyles.detailedMemberHeader}>
          <Image 
            source={item.profilePicture || DefaultProfilePicture} 
            style={[globalStyles.circularImage, groupStyles.detailedMemberAvatar]} 
          />
          <View style={{ flex: 1 }}>
            <Text style={groupStyles.detailedMemberName}>{item.username}</Text>
            <Text style={groupStyles.detailedMemberSubtext}>{item.betsWon} seiere • {item.betsLost} tap</Text>
          </View>
        </View>

        <View style={groupStyles.statChipRow}>
          <TouchableOpacity
            onPress={() => setDrinkDetailViewByUser((prev) => ({ ...prev, [item.userId]: 'consume' }))}
            style={[groupStyles.statChip, selectedDetailView === 'consume' && groupStyles.statChipPrimary]}
          >
            <Text style={groupStyles.statChipLabel}>Til konsum</Text>
            <Text style={groupStyles.statChipValue}>{totalToConsume}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDrinkDetailViewByUser((prev) => ({ ...prev, [item.userId]: 'consumed' }))}
            style={[groupStyles.statChip, selectedDetailView === 'consumed' && groupStyles.statChipPrimary]}
          >
            <Text style={groupStyles.statChipLabel}>Drukket</Text>
            <Text style={groupStyles.statChipValue}>{totalConsumed}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDrinkDetailViewByUser((prev) => ({ ...prev, [item.userId]: 'distribute' }))}
            style={[groupStyles.statChip, selectedDetailView === 'distribute' && groupStyles.statChipPrimary]}
          >
            <Text style={groupStyles.statChipLabel}>Til utdeling</Text>
            <Text style={groupStyles.statChipValue}>{totalToDistribute}</Text>
          </TouchableOpacity>
        </View>

        {selectedRows.length > 0 ? (
          <View style={groupStyles.modalSectionCard}>
            <Text style={groupStyles.modalSectionTitle}>{selectedSectionTitle}</Text>
            {selectedDetailView === 'consume' && isOwnUser && (
              <Text style={[globalStyles.secondaryText, groupStyles.consumeHelperText]}>
                Trykk "Drikk" for å registrere at du har drukket én av valgt type.
              </Text>
            )}
            <ScrollView
              style={selectedRows.length > 5 ? groupStyles.statsBreakdownScroll : undefined}
              nestedScrollEnabled={selectedRows.length > 5}
              showsVerticalScrollIndicator={selectedRows.length > 5}
            >
              {selectedRows.map((row) => (
                <View key={row.key} style={groupStyles.statsBreakdownRow}>
                  <Text style={groupStyles.statsBreakdownLabel}>{row.label}</Text>
                  <View style={groupStyles.statsBreakdownActionRow}>
                    <Text style={groupStyles.statsBreakdownValue}>{row.amount}</Text>
                    {selectedDetailView === 'consume' && isOwnUser && row.amount > 0 && row.drinkType && row.measureType && (
                      <TouchableOpacity
                        onPress={() => handleRegisterConsumedDrink(row.drinkType!, row.measureType!)}
                        disabled={Boolean(consumingDrinkKey)}
                        style={[
                          globalStyles.outlineButtonGold,
                          groupStyles.consumeActionButton,
                          consumingDrinkKey && globalStyles.disabledButton,
                        ]}
                      >
                        <Text style={[globalStyles.outlineButtonGoldText, groupStyles.consumeActionButtonText]}>
                          {consumingDrinkKey === row.key ? 'Laster...' : 'Drikk'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={[groupStyles.modalSectionCard, { alignItems: 'center' }]}> 
            <Text style={groupStyles.noConsumeDrinksTitle}>
              {selectedDetailView === 'consume'
                ? 'Ingen drikker til konsum'
                : selectedDetailView === 'consumed'
                  ? 'Ingen registrerte drikker'
                  : 'Ingen drikker til utdeling'}
            </Text>
            <Text style={groupStyles.noConsumeDrinksSubtext}>
              {selectedDetailView === 'consume'
                ? 'Alt er enten utdelt eller ferdig drukket.'
                : selectedDetailView === 'consumed'
                  ? 'Ingen drikker er registrert som drukket ennå.'
                  : 'Ingen drikker er tilgjengelige for utdeling akkurat nå.'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderPodiumCard = ({ member, placement }: { member: MemberDrinkStats; placement: 1 | 2 | 3 }) => {
    const isFirst = placement === 1;
    const cardWidth = isFirst ? '34%' : '30%';
    const cardHeight = isFirst ? 200 : 170;
    const sideMargin = placement === 2 ? { marginRight: 8 } : placement === 3 ? { marginLeft: 8 } : null;
    const cardColor = placement === 1 ? theme.colors.primary : placement === 2 ? theme.colors.silver : theme.colors.bronze;
    const avatarSize = isFirst ? 60 : 50;

    return (
      <View
        style={{
          alignItems: 'center',
          width: cardWidth,
          backgroundColor: cardColor,
          borderRadius: theme.borderRadius.lg,
          padding: 16,
          height: cardHeight,
          justifyContent: 'space-between',
          ...(sideMargin || {}),
        }}
      >
        <Image
          source={member.profilePicture || ImageMissing}
          style={[globalStyles.circularImage, { width: avatarSize, height: avatarSize }]}
        />

        <View style={{ paddingHorizontal: 4, width: '100%' }}>
          <Text
            style={{ fontSize: isFirst ? 15 : 13, color: theme.colors.text, textAlign: 'center', fontWeight: isFirst ? '600' : '500' }}
            numberOfLines={2}
          >
            {member.username}
          </Text>
        </View>

        <View
          style={{
            paddingHorizontal: isFirst ? 14 : 12,
            paddingVertical: isFirst ? 6 : 5,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <Text style={{ fontSize: isFirst ? 13 : 12, color: theme.colors.background, fontWeight: '700' }}>#{placement}</Text>
        </View>

        <View
          style={{
            width: '100%',
            borderRadius: theme.borderRadius.md,
            backgroundColor: isFirst ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.14)',
            paddingVertical: isFirst ? 10 : 8,
            paddingHorizontal: 8,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 10, color: theme.colors.background, opacity: 0.9 }}>VUNNET</Text>
              <Text style={{ fontSize: isFirst ? 18 : 16, color: theme.colors.background, fontWeight: '700' }}>{member.betsWon}</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 10, color: theme.colors.background, opacity: 0.9 }}>TAPT</Text>
              <Text style={{ fontSize: isFirst ? 18 : 16, color: theme.colors.background, fontWeight: '700' }}>{member.betsLost}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = ({ item, index }: { item: MemberDrinkStats; index: number }) => {
    const totalReceived = Object.values(item.drinksToConsume).reduce((sum, drinkTypeObj) => {
      return sum + Object.values(drinkTypeObj || {}).reduce((s, v) => s + (v || 0), 0);
    }, 0);
    const totalDistributed = Object.values(item.drinksToDistribute).reduce((sum, drinkTypeObj) => {
      return sum + Object.values(drinkTypeObj || {}).reduce((s, v) => s + (v || 0), 0);
    }, 0);
    const rank = index + 4;

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.md,
          backgroundColor: theme.colors.surface,
          paddingVertical: 10,
          paddingHorizontal: 12,
          marginBottom: 8,
        }}
      >
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: theme.colors.primary + '1F',
            borderWidth: 1,
            borderColor: theme.colors.primary + '55',
            marginRight: 10,
            minWidth: 46,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '700' }}>#{rank}</Text>
        </View>

        <Image
          source={item.profilePicture || DefaultProfilePicture}
          style={[globalStyles.circularImage, { width: 42, height: 42, marginRight: 10 }]}
        />

        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[groupStyles.wagerUser, { fontSize: 14, color: theme.colors.text }]} numberOfLines={1}>
            {item.username}
          </Text>
          {leaderboardView === 'betsWon' ? (
            <Text style={[globalStyles.secondaryText, { fontSize: 11, color: theme.colors.textSecondary }]}> 
              {item.betsWon} vunnet • {item.betsLost} tapt
            </Text>
          ) : (
            <Text style={[globalStyles.secondaryText, { fontSize: 11, color: theme.colors.textSecondary }]}> 
              {totalReceived} mottatt, {totalDistributed} tilgjengelig
            </Text>
          )}
        </View>

        <View
          style={{
            minWidth: leaderboardView === 'betsWon' ? 104 : 84,
            borderRadius: theme.borderRadius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.background,
            paddingVertical: 6,
            paddingHorizontal: 8,
          }}
        >
          {leaderboardView === 'betsWon' ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 9, color: theme.colors.textSecondary, letterSpacing: 0.3 }}>V</Text>
                <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '700' }}>{item.betsWon}</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 9, color: theme.colors.textSecondary, letterSpacing: 0.3 }}>T</Text>
                <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '700' }}>{item.betsLost}</Text>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: theme.colors.textSecondary, letterSpacing: 0.4 }}>TILGJENGELIG</Text>
              <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '700' }}>{totalDistributed}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container, groupStyles.screenContainer]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {!selectedGroup ? (
        <View style={[globalStyles.container, groupStyles.emptyStateContainer]}> 
          <Text style={[globalStyles.secondaryText, groupStyles.emptyStateText]}>Laster gruppe...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[globalStyles.fullWidthScrollContent, groupStyles.pageScrollContent]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={globalStyles.headerContainer}> 
          <Image source={currentGroup.image} style={globalStyles.groupHeaderImage} />
          <TouchableOpacity
            onPress={() => router.replace('/profile')}
            style={groupStyles.heroImageBackButton}
          >
            <Text style={groupStyles.heroBackButtonText}>←</Text>
          </TouchableOpacity>
          <View style={[globalStyles.overlay, groupStyles.groupHeaderOverlayCompact]}>
            <View style={globalStyles.headerInfo}>
              {editingName ? (
                <View style={globalStyles.inputGroup}>
                  <Text style={globalStyles.label}>Gruppenavn</Text>
                  <View style={globalStyles.rowCenter}>
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
                      <Image source={PencilIcon} style={globalStyles.primaryIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      setGroupName(selectedGroup.name);
                      setEditingName(false);
                    }} disabled={saving} style={{ marginLeft: 4 }}>
                      <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={groupStyles.groupHeaderRow}>
                  <Text style={groupStyles.groupHeaderName}>{currentGroup.name}</Text>
                  {selectedGroup && (
                    <View style={groupStyles.groupHeaderActions}>
                      {selectedGroup.createdBy === user?.id && (
                        <TouchableOpacity onPress={() => setEditingName(true)} style={groupStyles.groupActionIconButton}>
                          <Image source={PencilIcon} style={globalStyles.primaryIcon} />
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

        {selectedGroup?.createdBy === user?.id && (
          <View style={groupStyles.groupTopControlArea}>
            <View style={groupStyles.groupTopControlBottomRow}>
              <TouchableOpacity
                onPress={handleDeleteGroup}
                disabled={deleting}
                style={[groupStyles.groupTopDangerLinkButton, deleting && globalStyles.disabledButton]}
              >
                <Text style={groupStyles.groupTopDangerLinkText}>Slett gruppe</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={groupStyles.actionCard}>

          <View style={groupStyles.actionGridRow}>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, groupStyles.actionGridButton]} onPress={openMembersModal}>
              <Text style={[globalStyles.outlineButtonGoldText, groupStyles.actionGridButtonText]}>Medlemmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, groupStyles.actionGridButton]} onPress={openLeaderboardModal}>
              <Text style={[globalStyles.outlineButtonGoldText, groupStyles.actionGridButtonText]}>Vinnere</Text>
            </TouchableOpacity>
          </View>
          <View style={groupStyles.actionGridRow}>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, groupStyles.actionGridButton]} onPress={openBetModal}>
              <Text style={[globalStyles.outlineButtonGoldText, groupStyles.actionGridButtonText]}>Opprett bett</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.outlineButtonGold, groupStyles.actionGridButton]} onPress={openDistributeModal}>
              <Text style={[globalStyles.outlineButtonGoldText, groupStyles.actionGridButtonText]}>Del ut slurker</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={groupStyles.betListSection}>
          <View style={groupStyles.actionCard}>
            <Text style={globalStyles.sectionTitleLeft}>Aktive bets</Text>
            <Text style={[globalStyles.secondaryText, { marginTop: theme.spacing.xs }]}>Plasser bet, følg status og se resultater samlet her.</Text>
            <View style={{ marginTop: theme.spacing.md }}>
              {bets
                .filter((bet) => bet.isFinished || !bet.hiddenFromUserIds?.includes(user?.id || ''))
                .map((item) => {
                  const originalIndex = bets.findIndex((bet) => bet.id === item.id);
                  return <View key={item.id}>{renderBet({ item, index: originalIndex })}</View>;
                })}
            </View>
          </View>
        </View>

        {selectedGroup && user && selectedGroup.createdBy !== user.id && (
          <View style={groupStyles.groupBottomExitArea}>
            <TouchableOpacity
              onPress={handleExitGroup}
              disabled={deleting}
              style={[groupStyles.groupBottomExitButton, deleting && globalStyles.disabledButton]}
            >
              <Text style={groupStyles.groupBottomExitButtonText}>Forlat gruppe</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      )}

      <Modal visible={distributeModalVisible} animationType="slide" transparent onRequestClose={() => setDistributeModalVisible(false)}>
        <View style={globalStyles.modalContainer}>
          <View style={[globalStyles.modalContent, groupStyles.modalContentLarge]}>
            <Text style={[
              globalStyles.modalTitle, 
              { marginBottom: theme.spacing.md, fontSize: 20, fontWeight: '700', color: theme.colors.text, textAlign: 'center' }
            ]}>
              Del ut drikker
            </Text>
            {hasAvailableDrinks ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={groupStyles.modalScrollContent}>
                {distributionLoading && (
                  <Text style={groupStyles.modalLoadingText}>Laster...</Text>
                )}
                {distributions.length > 0 && (
                  <View style={groupStyles.modalSectionCard}>
                    <Text style={groupStyles.modalSectionTitle}>Planlagte utdelinger</Text>
                    <Text style={[globalStyles.secondaryText, { marginBottom: theme.spacing.sm }]}>Legg til flere først, og send alle samlet senere.</Text>
                    {distributions.map((dist, idx) => {
                      const member = memberData.find(m => m.id === dist.userId);
                      return (
                        <View key={idx} style={{ 
                          flexDirection: 'row', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: theme.colors.primary + '10',
                          padding: 10,
                          borderRadius: 8,
                          marginBottom: 6
                        }}>
                          <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '500' }}>
                            {member?.name}
                          </Text>
                          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                            {dist.amount} {dist.measureType} {dist.drinkType}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={groupStyles.modalSectionCard}>
                  <Text style={groupStyles.modalSectionTitle}>Tilgjengelig å dele ut</Text>
                  {availableDistributionEntries.map((entry) => (
                    <View key={`${entry.drinkType}-${entry.measureType}`} style={groupStyles.availabilityRow}>
                      <Text style={{ flex: 1, color: theme.colors.text, fontSize: 14 }}>
                        {entry.measureType} {entry.drinkType}
                      </Text>
                      <Text style={groupStyles.distributionAmountPlainText}>{entry.amount}</Text>
                    </View>
                  ))}
                </View>

                <View style={groupStyles.modalSectionCard}>
                  <Text style={groupStyles.modalSectionTitle}>Velg mottaker</Text>
                  <ScrollView style={groupStyles.recipientListWrap} nestedScrollEnabled showsVerticalScrollIndicator>
                    <View>
                      {memberData.map((member) => (
                        <View key={member.id}>{renderMemberCard({ item: member })}</View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </ScrollView>
            ) : (
              <View style={[groupStyles.modalSectionCard, { alignItems: 'center', paddingVertical: theme.spacing.xl }]}> 
                <Text style={[globalStyles.emptyStateText, { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center' }]}>
                  Ingen drikker tilgjengelig for utdeling
                </Text>
                <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm }}>
                  Vinn noen bets først.
                </Text>
              </View>
            )}
            <View style={[globalStyles.editButtonsContainer, groupStyles.modalFooter, groupStyles.distributionFooterRow]}> 
              <TouchableOpacity 
                onPress={handleCancelDistributionFlow}
                disabled={distributingDrinks}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.border
                }}
              >
                <Text style={[globalStyles.cancelButtonText, { fontSize: 16, color: theme.colors.text }]}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.primaryButton, groupStyles.distributionSubmitButton, distributions.length === 0 && globalStyles.disabledButton]}
                onPress={handleDistributeDrinks}
                disabled={distributingDrinks || distributions.length === 0}
              >
                <Text style={[globalStyles.primaryButtonText, groupStyles.distributionSubmitText]}>
                  {distributingDrinks ? 'Deles ut...' : 'Del ut'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={membersModalVisible} animationType="slide" transparent onRequestClose={() => setMembersModalVisible(false)}>
        <View style={globalStyles.modalContainer}> 
          <View style={[globalStyles.modalContent, groupStyles.modalContentLarge]}>
            <ScrollView contentContainerStyle={groupStyles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={[globalStyles.modalTitle, { marginBottom: theme.spacing.md, fontSize: 18, fontWeight: '600', color: theme.colors.text}]}> 
                Medlemmer i {selectedGroup?.name}
              </Text>
              
              {/* Members section */}
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={[globalStyles.sectionTitleLeft, { fontSize: 16, marginBottom: theme.spacing.sm }]}>Medlemmer</Text>
                {membersLoading ? (
                  <Text style={groupStyles.modalLoadingText}>Laster...</Text>
                ) : memberData.length > 0 ? (
                  <View style={globalStyles.listContainer}> 
                    <ScrollView
                      style={shouldScrollMembers ? groupStyles.scrollableListWrap : undefined}
                      nestedScrollEnabled={shouldScrollMembers}
                      showsVerticalScrollIndicator={shouldScrollMembers}
                    >
                      {memberData.map((member) => (
                        <View key={member.id}>{renderMemberItem({ item: member })}</View>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={[globalStyles.emptyStateText, { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginVertical: theme.spacing.md}]}> 
                    Ingen medlemmer i gruppen
                  </Text>
                )}
              </View>

              {/* Invite friends section */}
              <View>
                <Text style={[globalStyles.sectionTitleLeft, { fontSize: 16, marginBottom: theme.spacing.sm }]}>Inviter venner</Text>
                {membersLoading ? (
                  <Text style={groupStyles.modalLoadingText}>Laster...</Text>
                ) : availableFriends.length === 0 ? (
                  <Text style={[globalStyles.secondaryText, { textAlign: 'center', paddingVertical: theme.spacing.md }]}> 
                    Ingen flere å invitere
                  </Text>
                ) : (
                  <View style={globalStyles.listContainer}>
                    <ScrollView
                      style={shouldScrollAvailableFriends ? groupStyles.scrollableListWrap : undefined}
                      nestedScrollEnabled={shouldScrollAvailableFriends}
                      showsVerticalScrollIndicator={shouldScrollAvailableFriends}
                    >
                      {availableFriends.map((friend) => (
                        <View key={friend.id}>{renderFriendItem({ item: friend })}</View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={[globalStyles.editButtonsContainer, groupStyles.modalFooter]}> 
              <TouchableOpacity onPress={() => setMembersModalVisible(false)}>
                <Text style={[globalStyles.cancelButtonText, { fontSize: 16, color: theme.colors.primary }]}>Lukk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      <Modal visible={betModalVisible} animationType="slide" transparent onRequestClose={() => setBetModalVisible(false)}>
        <View style={globalStyles.modalContainer}>
          <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={groupStyles.modalScrollContent}
            >
              <Text style={globalStyles.modalTitle}>Opprett nytt bet</Text>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Tittel på bet</Text>
                <View style={[globalStyles.inputShellDark, groupStyles.inputShell, betTitleFocused && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    placeholder="Tittel på bet"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={betTitle}
                    onChangeText={setBetTitle}
                    onFocus={() => setBetTitleFocused(true)}
                    onBlur={() => setBetTitleFocused(false)}
                    style={[globalStyles.input, groupStyles.inputInsideShell]}
                  />
                </View>
              </View>
              {betOptions.map((opt, idx) => (
                <View key={idx} style={globalStyles.inputGroup}>
                  <View style={globalStyles.rowSpread}>
                    <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                      <Text style={globalStyles.label}>Alternativ {idx + 1}</Text>
                      <View style={[globalStyles.inputShellDark, groupStyles.inputShell, focusedBetOptionIndex === idx && globalStyles.inputShellFocusedGold]}>
                        <TextInput
                          placeholder={`Alternativ ${idx + 1}`}
                          placeholderTextColor={theme.colors.textSecondary}
                          value={opt.name}
                          onChangeText={text => updateBetOption(idx, 'name', text)}
                          onFocus={() => setFocusedBetOptionIndex(idx)}
                          onBlur={() => setFocusedBetOptionIndex(null)}
                          style={[globalStyles.input, groupStyles.inputInsideShell]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity onPress={addBetOption} style={{ marginBottom: theme.spacing.md, alignSelf: 'flex-start' }}>
                <Text style={globalStyles.addOptionText}>+ Legg til alternativ</Text>
              </TouchableOpacity>

              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Anonymitet</Text>
                <Text style={[globalStyles.secondaryText, { marginBottom: theme.spacing.sm }]}>Vis navnet ditt på bettet.</Text>
                <View style={groupStyles.anonymousToggleRow}>
                  <TouchableOpacity
                    style={[globalStyles.selectionButton, groupStyles.anonymousToggleButton, !betAnonymous && globalStyles.selectionButtonSelected]}
                    onPress={() => setBetAnonymous(false)}
                  >
                    <Text style={[globalStyles.selectionButtonText, !betAnonymous && globalStyles.selectionButtonTextSelected]}>Ikke anonym</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[globalStyles.selectionButton, groupStyles.anonymousToggleButton, betAnonymous && globalStyles.selectionButtonSelected]}
                    onPress={() => setBetAnonymous(true)}
                  >
                    <Text style={[globalStyles.selectionButtonText, betAnonymous && globalStyles.selectionButtonTextSelected]}>Anonym</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Skjul bettet for medlemmer</Text>
                <Text style={[globalStyles.secondaryText, { marginBottom: theme.spacing.sm }]}>Disse kan ikke se bettet før det markeres som ferdig.</Text>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator>
                  <View style={{ gap: theme.spacing.xs, paddingRight: 2 }}>
                    {memberData
                      .filter((member) => member.id !== user?.id)
                      .map((member) => {
                        const isHidden = hiddenBetMemberIds.includes(member.id);
                        return (
                          <TouchableOpacity
                            key={member.id}
                            style={[
                              globalStyles.listItemRow,
                              {
                                paddingVertical: theme.spacing.sm,
                                backgroundColor: isHidden ? theme.colors.primary + '20' : theme.colors.surface,
                                borderColor: isHidden ? theme.colors.primary : theme.colors.border,
                              },
                            ]}
                            onPress={() => toggleHiddenBetMember(member.id)}
                          >
                            <Image
                              source={member.profilePicture}
                              style={[globalStyles.circularImage, { width: 32, height: 32, marginRight: 10 }]}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={groupStyles.wagerUser}>{member.name}</Text>
                              <Text style={globalStyles.secondaryText}>@{member.username}</Text>
                            </View>
                            <Text style={[globalStyles.selectionButtonText, { color: isHidden ? theme.colors.primary : theme.colors.textSecondary, fontWeight: '700' }]}> 
                              {isHidden ? 'Skjult' : 'Synlig'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>

            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => setBetModalVisible(false)} disabled={betSaving}>
                <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveBet}
                disabled={betSaving || !canSaveBet}
                style={!canSaveBet ? globalStyles.disabledButton : undefined}
              >
                <Text style={[globalStyles.saveButtonText, !canSaveBet && groupStyles.disabledGoldActionText]}>
                  {betSaving ? 'Oppretter...' : 'Opprett'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={placeBetModalVisible} animationType="slide" transparent onRequestClose={() => setPlaceBetModalVisible(false)}>
        <View style={globalStyles.modalContainer}>
          <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={groupStyles.modalScrollContent}>
              <Text style={globalStyles.modalTitle}>Plasser bet</Text>
              {selectedBetOption && (
                <View>
                  <Text style={globalStyles.modalText}>Bet: {selectedBetOption.bet.title}</Text>
                  <Text style={globalStyles.secondaryText}>
                    Alternativ: {selectedBetOption.option.name}
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
                <View style={[globalStyles.inputShellDark, groupStyles.inputShell, betAmountFocused && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    placeholder="Antall"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={betAmount}
                    onChangeText={setBetAmount}
                    onFocus={() => setBetAmountFocused(true)}
                    onBlur={() => setBetAmountFocused(false)}
                    keyboardType="numeric"
                    style={[globalStyles.input, groupStyles.inputInsideShell]}
                  />
                </View>
              </View>
            </ScrollView>
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
          <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={groupStyles.modalScrollContent}>
              <Text style={globalStyles.modalTitle}>Rediger bet</Text>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Tittel på bet</Text>
                <View style={[globalStyles.inputShellDark, groupStyles.inputShell, editBetTitleFocused && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    placeholder="Tittel på bett"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={editBetTitle}
                    onChangeText={setEditBetTitle}
                    onFocus={() => setEditBetTitleFocused(true)}
                    onBlur={() => setEditBetTitleFocused(false)}
                    style={[globalStyles.input, groupStyles.inputInsideShell]}
                  />
                </View>
              </View>
              {editBetOptions.map((opt, idx) => (
                <View key={idx} style={globalStyles.inputGroup}>
                  <View>
                    <Text style={globalStyles.label}>Alternativ {idx + 1}</Text>
                    <View style={[globalStyles.inputShellDark, groupStyles.inputShell, focusedEditBetOptionIndex === idx && globalStyles.inputShellFocusedGold]}>
                      <TextInput
                        placeholder={`Alternativ ${idx + 1}`}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={opt.name}
                        onChangeText={text => updateEditBetOption(idx, 'name', text)}
                        onFocus={() => setFocusedEditBetOptionIndex(idx)}
                        onBlur={() => setFocusedEditBetOptionIndex(null)}
                        style={[globalStyles.input, groupStyles.inputInsideShell]}
                      />
                    </View>
                  </View>
                </View>
              ))}
              <TouchableOpacity onPress={addEditBetOption} style={{ marginBottom: theme.spacing.md, alignSelf: 'flex-start' }}>
                <Text style={globalStyles.addOptionText}>+ Legg til alternativ</Text>
              </TouchableOpacity>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Anonymitet</Text>
                <Text style={[globalStyles.secondaryText, { marginBottom: theme.spacing.sm }]}>Vis navnet ditt på bettet.</Text>
                <View style={groupStyles.anonymousToggleRow}>
                  <TouchableOpacity
                    style={[globalStyles.selectionButton, groupStyles.anonymousToggleButton, !editBetAnonymous && globalStyles.selectionButtonSelected]}
                    onPress={() => setEditBetAnonymous(false)}
                  >
                    <Text style={[globalStyles.selectionButtonText, !editBetAnonymous && globalStyles.selectionButtonTextSelected]}>Ikke anonym</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[globalStyles.selectionButton, groupStyles.anonymousToggleButton, editBetAnonymous && globalStyles.selectionButtonSelected]}
                    onPress={() => setEditBetAnonymous(true)}
                  >
                    <Text style={[globalStyles.selectionButtonText, editBetAnonymous && globalStyles.selectionButtonTextSelected]}>Anonym</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={globalStyles.inputGroup}>
                <Text style={globalStyles.label}>Skjul bettet for medlemmer</Text>
                <Text style={[globalStyles.secondaryText, { marginBottom: theme.spacing.sm }]}>Disse kan ikke se bettet før det markeres som ferdig.</Text>
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator>
                  <View style={{ gap: theme.spacing.xs, paddingRight: 2 }}>
                    {memberData
                      .filter((member) => member.id !== user?.id)
                      .map((member) => {
                        const isHidden = editHiddenBetMemberIds.includes(member.id);
                        return (
                          <TouchableOpacity
                            key={member.id}
                            style={[
                              globalStyles.listItemRow,
                              {
                                paddingVertical: theme.spacing.sm,
                                backgroundColor: isHidden ? theme.colors.primary + '20' : theme.colors.surface,
                                borderColor: isHidden ? theme.colors.primary : theme.colors.border,
                              },
                            ]}
                            onPress={() => toggleEditHiddenBetMember(member.id)}
                          >
                            <Image
                              source={member.profilePicture}
                              style={[globalStyles.circularImage, { width: 32, height: 32, marginRight: 10 }]}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={groupStyles.wagerUser}>{member.name}</Text>
                              <Text style={globalStyles.secondaryText}>@{member.username}</Text>
                            </View>
                            <Text style={[globalStyles.selectionButtonText, { color: isHidden ? theme.colors.primary : theme.colors.textSecondary, fontWeight: '700' }]}>
                              {isHidden ? 'Skjult' : 'Synlig'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </ScrollView>
              </View>
            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => setEditBetModalVisible(false)} disabled={editBetSaving}>
                <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveEditBet} disabled={editBetSaving}>
                <Text style={globalStyles.saveButtonText}>{editBetSaving ? 'Lagrer...' : 'Lagre'}</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={selectCorrectModalVisible} animationType="slide" transparent onRequestClose={() => setSelectCorrectModalVisible(false)}>
        <View style={globalStyles.modalContainer}>
          <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={groupStyles.modalScrollContent}>
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
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            </ScrollView>
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
          <View style={[globalStyles.modalContent, groupStyles.leaderboardModalContent]}> 
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <Text style={[globalStyles.modalTitle, { marginBottom: theme.spacing.sm, fontSize: 18, fontWeight: '600', color: theme.colors.text }]}>
                {leaderboardView === 'betsWon' ? 'Bet Statistikk' : 'Drikke Statistikk'}
              </Text>
              {leaderboardLoading && (
                <Text style={groupStyles.modalLoadingText}>Laster...</Text>
              )}
            <View style={groupStyles.leaderboardToggleRow}>
                <TouchableOpacity 
                  style={[
                    globalStyles.outlineButtonGold,
                    groupStyles.leaderboardToggleButton,
                    leaderboardView === 'betsWon' && groupStyles.leaderboardToggleActive,
                  ]}
                  onPress={() => setLeaderboardView('betsWon')}
                >
                  <Text style={[globalStyles.outlineButtonGoldText,{ color: leaderboardView === 'betsWon' ? theme.colors.background : theme.colors.primary, fontSize: 14 }]}>Bets</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    globalStyles.outlineButtonGold,
                    groupStyles.leaderboardToggleButton,
                    leaderboardView === 'drinkStats' && groupStyles.leaderboardToggleActive,
                  ]}
                  onPress={() => setLeaderboardView('drinkStats')}
                >
                  <Text style={[
                    globalStyles.outlineButtonGoldText,
                    { color: leaderboardView === 'drinkStats' ? theme.colors.background : theme.colors.primary, fontSize: 14 }
                  ]}>
                    Drikke
                  </Text>
                </TouchableOpacity>
              </View>
              {leaderboardData.length > 0 ? (
                <View style={{ marginBottom: theme.spacing.md }}>
                  {leaderboardView === 'drinkStats' ? (
                    <View>
                      <Text style={groupStyles.modalSectionSubtitle}>Oversikt over drikkestatus per medlem.</Text>
                      
                      {/* Detaljert medlemsoversikt */}
                      <View style={{ marginBottom: theme.spacing.lg }}>
                        <Text style={groupStyles.modalSectionTitle}>Medlemmer</Text>
                        <View>
                          {leaderboardData.map((member) => (
                            <View key={member.userId}>{renderDetailedDrinkOverview({ item: member })}</View>
                          ))}
                        </View>
                      </View>
                      
                      {/* Transaksjonshistorikk */}
                      <View style={{ marginTop: theme.spacing.lg }}>
                        <Text style={groupStyles.modalSectionTitle}>Siste overføringer</Text>
                        {(() => {
                          const recentTransactions = leaderboardData
                            .flatMap(member => member.transactions)
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .slice(0, 10);
                          if (recentTransactions.length === 0) {
                            return (
                              <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' }}>
                                Ingen overføringer ennå
                              </Text>
                            );
                          }
                          return (
                            <View style={[globalStyles.listContainer, { paddingBottom: theme.spacing.md }]}> 
                              {recentTransactions.map((transaction, idx) => (
                                <View key={`${transaction.fromUserId}-${transaction.toUserId}-${transaction.timestamp}-${idx}`}>
                                  {renderTransactionItem({ item: transaction })}
                                </View>
                              ))}
                            </View>
                          );
                        })()}
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text style={groupStyles.modalSectionSubtitle}>
                        Oversikt over hvem som har vunnet flest bets
                      </Text>
                      {/* Podium layout */}
                      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: theme.spacing.lg}}>
                        {leaderboardData[1] && renderPodiumCard({ member: leaderboardData[1], placement: 2 })}
                        {leaderboardData[0] && renderPodiumCard({ member: leaderboardData[0], placement: 1 })}
                        {leaderboardData[2] && renderPodiumCard({ member: leaderboardData[2], placement: 3 })}
                      </View>
                      {/* Remaining Members */}
                      {leaderboardData.length > 3 && (
                        <View style={[globalStyles.listContainer, { paddingBottom: theme.spacing.md }]}> 
                          {leaderboardData.slice(3).map((member, idx) => (
                            <View key={member.userId}>{renderLeaderboardItem({ item: member, index: idx })}</View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={[
                  globalStyles.emptyStateText, 
                  { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginVertical: theme.spacing.md }
                ]}>
                  Ingen data tilgjengelig ennå
                </Text>
              )}
            </ScrollView>
            <View style={[globalStyles.editButtonsContainer, groupStyles.modalFooterBordered]}> 
              <TouchableOpacity onPress={() => setLeaderboardModalVisible(false)}>
                <Text style={[globalStyles.cancelButtonText, { fontSize: 16, color: theme.colors.primary }]}>Lukk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editMenuModalVisible} animationType="slide" transparent onRequestClose={() => setEditMenuModalVisible(false)}>
               <View style={globalStyles.modalContainer}>
          <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
            <Text style={globalStyles.modalTitle}>Administrer bet</Text>
            <Text style={globalStyles.modalText}>{selectedEditBet?.bet.title || 'Velg en handling for bettet'}</Text>
            <TouchableOpacity
              style={[globalStyles.selectionButton, { marginBottom: theme.spacing.sm }]}
              onPress={() => {
                if (selectedEditBet) {
                  setEditBetIdx(selectedEditBet.index);
                  setEditBetTitle(selectedEditBet.bet.title);
                  setEditBetAnonymous(Boolean(selectedEditBet.bet.isAnonymous));
                  setEditHiddenBetMemberIds(selectedEditBet.bet.hiddenFromUserIds || []);
                  setEditBetOptions(
                    selectedEditBet.bet.options.map((opt: BettingOption) => ({
                      name: opt.name,

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
                  setEditMenuModalVisible(false);
                  showAlert(
                    'Bekreft sletting',
                    'Er du sikker på at du vil slette dette bettet? Dette kan ikke angres.',
                    [
                      { text: 'Avbryt', style: 'cancel' },
                      {
                        text: 'Slett',
                        style: 'destructive',
                        onPress: () => handleDeleteBet(selectedEditBet.index),
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

      {/* Create Group Modal */}
      <Modal visible={createGroupModalVisible} animationType="slide" transparent onRequestClose={() => {
        setCreateGroupName('');
        setCreateGroupModalVisible(false);
      }}>
        <View style={globalStyles.modalContainer}>
          <View style={[globalStyles.modalContent, groupStyles.modalContentMedium]}>
            <Text style={globalStyles.modalTitle}>Opprett gruppe</Text>
            <View style={globalStyles.inputGroup}>
              <Text style={globalStyles.label}>Gruppenavn</Text>
              <View style={[globalStyles.inputShellDark, groupStyles.inputShell, createGroupNameFocused && globalStyles.inputShellFocusedGold]}>
                <TextInput
                  placeholder="Skriv gruppenavn"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={createGroupName}
                  onChangeText={setCreateGroupName}
                  onFocus={() => setCreateGroupNameFocused(true)}
                  onBlur={() => setCreateGroupNameFocused(false)}
                  style={[globalStyles.input, groupStyles.inputInsideShell]}
                  maxLength={40}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[
                globalStyles.selectionButton,
                { marginBottom: theme.spacing.sm },
                !createGroupName.trim() && globalStyles.disabledButton,
              ]}
              onPress={handleCreateGroup}
              disabled={creatingGroup || !createGroupName.trim()}
            >
              <Text style={globalStyles.selectionButtonText}>
                {creatingGroup ? 'Oppretter...' : 'Opprett gruppe'}
              </Text>
            </TouchableOpacity>
            <View style={globalStyles.editButtonsContainer}>
              <TouchableOpacity onPress={() => {
                setCreateGroupName('');
                setCreateGroupModalVisible(false);
              }}>
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