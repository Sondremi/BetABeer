import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, FieldPath, getDoc, getDocs, getFirestore, increment, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/firebase/authService';
import { firestore } from '../../services/firebase/FirebaseConfig';
import { cancelGroupInvitation, deleteGroup, distributeDrinks, exitGroup, registerConsumedDrinks, removeFriendFromGroup, sendGroupInvitation } from '../../services/groupService';
import { removeGroupImage, uploadGroupImage } from '../../services/profileImageUploadService';
import { createGroup, updateGroupName } from '../../services/profileService';
import { groupStyles } from '../../styles/components/groupStyles';
import { globalStyles } from '../../styles/globalStyles';
import { theme } from '../../styles/theme';
import type { Bet, BettingOption, BetWager, DrinkType, MeasureType, MemberDrinkStats } from '../../types/drinkTypes';
import { Group } from '../../types/drinkTypes';
import { Friend } from '../../types/userTypes';
import { clampDigits, INPUT_LIMITS, isIntInRange, normalizeSingleLineText } from '../../utils/inputValidation';
import { showAlert } from '../../utils/platformAlert';
import { getDefaultProfilePicture, resolveProfileImageSource } from '../../utils/profileImage';
import BetCard from './components/BetCard';
import DetailedDrinkOverviewCard from './components/DetailedDrinkOverviewCard';
import DistributionMemberCard from './components/DistributionMemberCard';
import FriendInviteRow from './components/FriendInviteRow';
import GroupActionPanel from './components/GroupActionPanel';
import GroupExitSection from './components/GroupExitSection';
import GroupHeader from './components/GroupHeader';
import ActiveBetsSection from './components/ActiveBetsSection';
import LeaderboardPodiumCard from './components/LeaderboardPodiumCard';
import LeaderboardRow from './components/LeaderboardRow';
import MemberRow from './components/MemberRow';
import { useFriendActions } from './hooks/useFriendActions';
import { useGroupData } from './hooks/useGroupData';
import { useLeaderboard, type GroupLeaderboardMemberStats } from './hooks/useLeaderboard';
import GroupScreenModals from './modals/GroupScreenModals';

const ImageMissing = require('../../../assets/images/image_missing.png');
const DefaultProfilePicture = getDefaultProfilePicture();
const PencilIcon = require('../../../assets/icons/noun-pencil-969012.png');
const GroupImageIcon = require('../../../assets/icons/noun-image-7746215.png');
const TrashIcon = require('../../../assets/icons/noun-delete-7938028.png');
const PeopleIcon = require('../../../assets/icons/noun-people-2196504.png');

type SentGroupInvitation = {
  id: string;
  toUserId: string;
};

const GroupScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [betModalVisible, setBetModalVisible] = useState(false);
  const {
    bets,
    fetchMemberUsernames,
    friends,
    groupName,
    groups,
    groupsResolved,
    memberData,
    selectedGroup,
    setBets,
    setGroupName,
    setGroups,
    setMemberData,
    setSelectedGroup,
  } = useGroupData({
    userId: user?.id,
    editingName,
    selectedGroupParam: params.selectedGroup,
  });
  const [groupNameFocused, setGroupNameFocused] = useState(false);
  const [betTitle, setBetTitle] = useState('');
  const [betOptions, setBetOptions] = useState<{ name: string }[]>([{ name: '' }]);
  const [hiddenBetMemberIds, setHiddenBetMemberIds] = useState<string[]>([]);
  const [betSaving, setBetSaving] = useState(false);
  const [placeBetModalVisible, setPlaceBetModalVisible] = useState(false);
  const [selectedBetOption, setSelectedBetOption] = useState<{ bet: Bet; option: BettingOption } | null>(null);
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType>('Øl');
  const [selectedMeasureType, setSelectedMeasureType] = useState<MeasureType>('Slurker');
  const [betAmount, setBetAmount] = useState('1');
  const [betAmountFocused, setBetAmountFocused] = useState(false);
  const [hasInteractedPlaceBetAmount, setHasInteractedPlaceBetAmount] = useState(false);
  const [placeBetAttempted, setPlaceBetAttempted] = useState(false);
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
  const [inviting, setInviting] = useState(false);
  const [distributeModalVisible, setDistributeModalVisible] = useState(false);
  const [selectedEditBet, setSelectedEditBet] = useState<{ bet: Bet; index: number } | null>(null);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [userDrinksToDistribute, setUserDrinksToDistribute] = useState<MemberDrinkStats['drinksToDistribute']>({});
  const [distributingDrinks, setDistributingDrinks] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedDistribution, setSelectedDistribution] = useState<{ drinkType: DrinkType; measureType: MeasureType; amount: number } | null>(null);
  const [distributionAmountMode, setDistributionAmountMode] = useState<'preset' | 'custom'>('preset');
  const [distributionCustomAmount, setDistributionCustomAmount] = useState('');
  const [hasInteractedDistributionCustomAmount, setHasInteractedDistributionCustomAmount] = useState(false);
  const [distributionAmountFocused, setDistributionAmountFocused] = useState(false);
  const [distributions, setDistributions] = useState<{ userId: string; drinkType: DrinkType; measureType: MeasureType; amount: number }[]>([]);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [createGroupName, setCreateGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [sentGroupInvitations, setSentGroupInvitations] = useState<SentGroupInvitation[]>([]);
  const [betTitleFocused, setBetTitleFocused] = useState(false);
  const [editBetTitleFocused, setEditBetTitleFocused] = useState(false);
  const [createGroupNameFocused, setCreateGroupNameFocused] = useState(false);
  const [focusedBetOptionIndex, setFocusedBetOptionIndex] = useState<number | null>(null);
  const [focusedEditBetOptionIndex, setFocusedEditBetOptionIndex] = useState<number | null>(null);
  const [betAnonymous, setBetAnonymous] = useState(false);
  const [editBetAnonymous, setEditBetAnonymous] = useState(false);
  const [membersLoading] = useState(false);
  const [distributionLoading, setDistributionLoading] = useState(false);
  const [consumingDrinkKey, setConsumingDrinkKey] = useState<string | null>(null);
  const [drinkDetailViewByUser, setDrinkDetailViewByUser] = useState<Record<string, 'consume' | 'consumed' | 'distribute'>>({});
  const [uploadingGroupImage, setUploadingGroupImage] = useState(false);
  const {
    averageBacBarProgress,
    bacLeaderboardData,
    bacVisualMax,
    getBacRangeTone,
    getLeaderboardData,
    groupAverageBAC,
    groupAverageBacTone,
    leaderboardData,
    leaderboardLoading,
    leaderboardView,
    setLeaderboardData,
    setLeaderboardLoading,
    setLeaderboardView,
  } = useLeaderboard({
    bets,
    fetchMemberUsernames,
    leaderboardModalVisible,
    selectedGroup,
  });
  const {
    pendingFriendRequests,
    incomingFriendRequests,
    sendingFriendRequest,
    refreshPendingRequests,
    handleAcceptIncomingFriendRequest,
    handleCancelPendingFriendRequest,
    handleSendFriendRequest,
  } = useFriendActions({
    userId: user?.id,
    messages: {
      sendFailed: 'Kunne ikke håndtere venneforespørsel',
      acceptFailed: 'Kunne ikke godta venneforespørsel',
      cancelFailed: 'Kunne ikke angre venneforespørsel',
    },
  });

  const currentGroup: Group & { image: any } = selectedGroup
    ? { ...selectedGroup, name: groupName, image: selectedGroup.image ?? ImageMissing }
    : { id: 'default', name: 'Gruppenavn', memberCount: 0, image: ImageMissing, createdBy: '', members: [] };
  const drinkTypes: DrinkType[] = ['Øl', 'Cider', 'Hard selzer', 'Vin', 'Sprit', 'Drink' ];
  const measureTypes: MeasureType[] = ['Slurker', 'Shot', 'Enhet', 'Chug'];
  const availableFriends = friends.filter(friend => !selectedGroup?.members.includes(friend.id));
  const shouldScrollMembers = memberData.length > 5;
  const shouldScrollAvailableFriends = availableFriends.length > 5;
  const shouldScrollPlannedDistributions = distributions.length > 5;
  const shouldScrollBetOptions = betOptions.length >= 5;
  const shouldScrollEditBetOptions = editBetOptions.length >= 5;
  const canAddBetOption = betOptions.length < INPUT_LIMITS.betOptionCountMax;
  const canAddEditBetOption = editBetOptions.length < INPUT_LIMITS.betOptionCountMax;
  const canSaveBet =
    normalizeSingleLineText(betTitle).length > 0 &&
    normalizeSingleLineText(betTitle).length <= INPUT_LIMITS.betTitleMax &&
    betOptions.length > 0 &&
    betOptions.every((opt) => {
      const name = normalizeSingleLineText(opt.name);
      return name.length > 0 && name.length <= INPUT_LIMITS.betOptionNameMax;
    });
  const getMaxPlaceBetAmount = (drinkType: DrinkType, measureType: MeasureType) => {
    const maxByMeasure: Record<MeasureType, number> = {
      Slurker: 25,
      Shot: 12,
      Enhet: 10,
      Chug: 3,
    };

    const drinkMultiplier: Record<DrinkType, number> = {
      'Øl': 1,
      'Cider': 1,
      'Hard selzer': 1,
      'Vin': 0.7,
      'Sprit': 0.4,
      'Drink': 0.6,
    };

    const rawMax = Math.floor(maxByMeasure[measureType] * drinkMultiplier[drinkType]);
    return Math.max(INPUT_LIMITS.betAmountMin, Math.min(INPUT_LIMITS.betAmountMax, rawMax));
  };

  const placeBetMaxAmount = getMaxPlaceBetAmount(selectedDrinkType, selectedMeasureType);

  const placeBetValidationMessage = (() => {
    const amount = parseInt(betAmount, 10);
    if (!Number.isInteger(amount)) {
      return 'Skriv inn et gyldig heltall.';
    }
    if (!isIntInRange(amount, INPUT_LIMITS.betAmountMin, placeBetMaxAmount)) {
      return `Antall må være mellom ${INPUT_LIMITS.betAmountMin} og ${placeBetMaxAmount} for valgt drikke/måleenhet.`;
    }
    return null;
  })();
  const canPlaceBet = Boolean(selectedBetOption && user && selectedGroup) && placeBetValidationMessage === null;
  const canEditGroupName = Boolean(selectedGroup && user?.id && selectedGroup.members?.includes(user.id));
  const canManageGroupImage = Boolean(selectedGroup && user?.id && selectedGroup.createdBy === user.id);
  const hasCustomGroupImage = Boolean(selectedGroup?.imageUrl);
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
  const getMemberName = useCallback((member: Pick<MemberDrinkStats, 'name' | 'username'>) => {
    const displayName = String(member.name || '').trim();
    const username = String(member.username || 'ukjent').trim();
    return displayName || username || 'Ukjent';
  }, []);

  const getMemberUsernameLabel = useCallback((member: Pick<MemberDrinkStats, 'username'>) => {
    const username = String(member.username || 'ukjent').trim();
    return `@${username}`;
  }, []);

  useEffect(() => {
    if (!user || !groupsResolved) return;
    if (!selectedGroup && groups.length === 0) {
      router.replace('/profile');
    }
  }, [user, groupsResolved, selectedGroup, groups.length, router]);

  useEffect(() => {
    if (!user?.id || !membersModalVisible) return;
    refreshPendingRequests().catch((error) => {
      console.error('Error fetching pending friend requests:', error);
    });
  }, [user?.id, membersModalVisible, refreshPendingRequests]);

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
        const pendingInvitations = sentInvitationSnapshot.docs
          .map((docSnap) => {
            const toUserId = docSnap.data().toUserId;
            if (typeof toUserId !== 'string') return null;
            return { id: docSnap.id, toUserId } as SentGroupInvitation;
          })
          .filter((invitation): invitation is SentGroupInvitation => Boolean(invitation));
        setSentGroupInvitations(pendingInvitations);
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
  }, [distributeModalVisible, user?.id, selectedGroup?.id, getLeaderboardData]);

  const openLeaderboardModal = async () => {
    setLeaderboardModalVisible(true);
    setLeaderboardLoading(true);
    try {
      const data = await getLeaderboardData();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
      setLeaderboardData([]);
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


  const handleDistributeDrinks = async () => {
    if (!user?.id || !selectedGroup?.id) {
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

      setDistributeModalVisible(false);
    } catch (error) {
      console.error('Error distributing drinks:', error);
    } finally {
      setDistributingDrinks(false);
    }
  };

  const handleInviteFriend = async (friend: Friend) => {
    if (!user || !selectedGroup) {
      console.error('=== DEBUG: Missing user or selectedGroup ===', { user, selectedGroup });
      return;
    }
    setInviting(true);
    try {
      await sendGroupInvitation(friend.id, selectedGroup);
      const sentInvitationQuery = query(
        collection(firestore, 'group_invitations'),
        where('fromUserId', '==', user.id),
        where('groupId', '==', selectedGroup.id),
        where('toUserId', '==', friend.id),
        where('status', '==', 'pending')
      );
      const sentInvitationSnapshot = await getDocs(sentInvitationQuery);
      const sentInvitation = sentInvitationSnapshot.docs[0];
      if (sentInvitation) {
        setSentGroupInvitations((prev) => {
          const withoutExisting = prev.filter((invitation) => invitation.toUserId !== friend.id);
          return [...withoutExisting, { id: sentInvitation.id, toUserId: friend.id }];
        });
      }
    } catch(error) {
      console.error(error);
      showAlert('Feil', `Kunne ikke sende invitasjon til ${friend.name}`)
    } finally {
      setInviting(false);
    }
  };

  const handleCancelSentGroupInvitation = async (friend: Friend) => {
    if (!user?.id || !selectedGroup?.id) return;
    const sentInvitation = sentGroupInvitations.find((invitation) => invitation.toUserId === friend.id);
    if (!sentInvitation?.id) return;

    setInviting(true);
    try {
      await cancelGroupInvitation(sentInvitation.id);
      setSentGroupInvitations((prev) => prev.filter((invitation) => invitation.id !== sentInvitation.id));
    } catch (error) {
      console.error('Error cancelling group invitation:', error);
      showAlert('Feil', 'Kunne ikke angre gruppeinvitasjon');
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
            } catch {
              showAlert('Feil', `Kunne ikke forlate gruppe`);
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
      `Er du sikker på at du vil slette gruppen "${selectedGroup.name}"? Dette kan ikke angres`,
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
    const trimmedGroupName = normalizeSingleLineText(createGroupName);
    if (!trimmedGroupName) {
      showAlert('Feil', 'Gruppenavn kan ikke være tomt');
      return;
    }
    if (trimmedGroupName.length > INPUT_LIMITS.groupNameMax) {
      showAlert('Feil', `Gruppenavn kan maks være ${INPUT_LIMITS.groupNameMax} tegn`);
      return;
    }
    setCreatingGroup(true);
    try {
      const newGroup = await createGroup(user.id, trimmedGroupName);
      const groupWithImage: Group = { ...newGroup, image: ImageMissing, imageUrl: null };
      setGroups(prev => prev.some(group => group.id === groupWithImage.id) ? prev : [...prev, groupWithImage]);
      setSelectedGroup(groupWithImage);
      setCreateGroupModalVisible(false);
      setCreateGroupName('');
      
      await AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(groupWithImage));
    } catch (error) {
      console.error('Error creating group:', error);
      showAlert('Feil', 'Kunne ikke opprette gruppe');
    } finally {
      setCreatingGroup(false);
    }
  };

  const openGroupMembersScreen = () => {
    if (!selectedGroup) return;
    router.push({
      pathname: '/group-members',
      params: { selectedGroup: JSON.stringify(selectedGroup) },
    });
  };

  const handleSaveGroupName = async () => {
    if (!selectedGroup) return;
    if (!canEditGroupName) {
      showAlert('Ikke tilgang', 'Du har ikke tilgang til å endre gruppenavn.');
      return;
    }
    const trimmedName = normalizeSingleLineText(groupName);
    if (!trimmedName) {
      showAlert('Feil', 'Gruppenavn kan ikke være tomt');
      return;
    }
    if (trimmedName.length > INPUT_LIMITS.groupNameMax) {
      showAlert('Feil', `Gruppenavn kan maks være ${INPUT_LIMITS.groupNameMax} tegn`);
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
      showAlert('Feil', `Kunne ikke oppdatere gruppenavn`);
    } finally {
      setSaving(false);
    }
  };

  const applyGroupImageLocally = useCallback(async (groupId: string, imageValue: string | null) => {
    const imageSource = resolveProfileImageSource(imageValue, ImageMissing);

    setGroups((prev) => prev.map((group) => (
      group.id === groupId ? { ...group, image: imageSource, imageUrl: imageValue } : group
    )));

    setSelectedGroup((prev) => {
      if (!prev || prev.id !== groupId) return prev;
      const updatedGroup = { ...prev, image: imageSource, imageUrl: imageValue };
      AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(updatedGroup)).catch((error) => {
        console.error('Error saving group image locally:', error);
      });
      return updatedGroup;
    });
  }, [setGroups, setSelectedGroup]);

  const handleUploadOrChangeGroupImage = async () => {
    if (!selectedGroup?.id || !canManageGroupImage) {
      showAlert('Ikke tilgang', 'Kun gruppeeier kan oppdatere gruppebildet');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          showAlert('Tilgang mangler', 'Gi tilgang til bilder for å laste opp gruppebilde');
          return;
        }
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        aspect: [16, 9],
      });

      if (pickerResult.canceled || !pickerResult.assets?.length) {
        return;
      }

      await authService.ensureVerifiedEmailForMediaUpload();
      setUploadingGroupImage(true);

      const selectedAsset = pickerResult.assets[0];
      const webFile = (selectedAsset as any).file as Blob | undefined;
      const uploadedImageUrl = await uploadGroupImage(selectedGroup.id, webFile ?? selectedAsset.uri);
      await updateDoc(doc(firestore, 'groups', selectedGroup.id), { image: uploadedImageUrl });
      await applyGroupImageLocally(selectedGroup.id, uploadedImageUrl);
    } catch (error) {
      console.error('Error uploading group image:', error);
      const errorMessage = (error as Error).message || 'Kunne ikke laste opp gruppebilde.';
      if (errorMessage.toLowerCase().includes('verifiser')) {
        showAlert('Verifisering kreves', errorMessage);
      } else {
        showAlert('Feil', errorMessage);
      }
    } finally {
      setUploadingGroupImage(false);
    }
  };

  const handleRemoveGroupImage = async () => {
    if (!selectedGroup?.id || !canManageGroupImage) {
      showAlert('Ikke tilgang', 'Kun gruppeeier kan fjerne gruppebildet');
      return;
    }
    if (!hasCustomGroupImage) {
      return;
    }

    setUploadingGroupImage(true);
    try {
      await Promise.all([
        updateDoc(doc(firestore, 'groups', selectedGroup.id), { image: null }),
        removeGroupImage(selectedGroup.id),
      ]);
      await applyGroupImageLocally(selectedGroup.id, null);
    } catch (error) {
      console.error('Error removing group image:', error);
      showAlert('Feil', 'Kunne ikke fjerne gruppebilde');
    } finally {
      setUploadingGroupImage(false);
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
    if (!canAddBetOption) {
      return;
    }
    setBetOptions([...betOptions, { name: '' }]);
  };

  const removeBetOption = (idx: number) => {
    if (betOptions.length <= 1) {
      return;
    }
    setBetOptions((prev) => prev.filter((_, optionIdx) => optionIdx !== idx));
    setFocusedBetOptionIndex((prev) => (prev === idx ? null : prev !== null && prev > idx ? prev - 1 : prev));
  };

  const addAllGroupMembersAsBetOptions = () => {
    const uniqueMemberNames = Array.from(new Set(
      memberData
        .map((member) => normalizeSingleLineText(member.name || member.username || ''))
        .filter((name) => name.length > 0)
    ));

    if (uniqueMemberNames.length === 0) {
      showAlert('Feil', 'Fant ingen gruppemedlemmer å legge til som alternativer');
      return;
    }

    setBetOptions(uniqueMemberNames.map((name) => ({ name })));
  };

  const updateBetOption = (idx: number, field: 'name', value: string) => {
    setBetOptions(prev => prev.map((opt, i) => (i === idx ? { ...opt, [field]: value } : opt)));
  };

  const handleSaveBet = async () => {
    if (!selectedGroup || !user?.id) return;
    const trimmedBetTitle = normalizeSingleLineText(betTitle);
    if (!trimmedBetTitle) {
      showAlert('Feil', 'Bet-tittel kan ikke være tom');
      return;
    }

    if (trimmedBetTitle.length > INPUT_LIMITS.betTitleMax) {
      showAlert('Feil', `Bet-tittel kan maks være ${INPUT_LIMITS.betTitleMax} tegn`);
      return;
    }

    const normalizedOptions = betOptions.map((opt) => normalizeSingleLineText(opt.name));
    if (normalizedOptions.some((name) => !name)) {
      showAlert('Feil', 'Alle alternativer må ha navn');
      return;
    }
    if (normalizedOptions.some((name) => name.length > INPUT_LIMITS.betOptionNameMax)) {
      showAlert('Feil', `Alternativ-navn kan maks være ${INPUT_LIMITS.betOptionNameMax} tegn`);
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
        title: trimmedBetTitle,
        options: normalizedOptions.map((name, idx) => ({
          id: `${Date.now()}_${idx}`,
          name,
        })),
        wagers: [],
        hiddenFromUserIds: hiddenBetMemberIds,
        createdByUserId: user.id,
        createdByUsername: user.username || user.name || 'Unknown',
        isAnonymous: betAnonymous,
        createdAt: Date.now(),
      };
      await updateDoc(groupRef, { bets: [newBet, ...groupBets] });
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
    setHasInteractedPlaceBetAmount(false);
    setPlaceBetAttempted(false);
    setPlaceBetModalVisible(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBetOption || !user || !selectedGroup) return;
    if (placeBetValidationMessage) {
      setPlaceBetAttempted(true);
      return;
    }

    const amount = parseInt(betAmount, 10);

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
    if (bet.createdByUserId === user.id) return true;

    const isGroupOwner = selectedGroup?.createdBy === user.id;
    if (!isGroupOwner) return false;

    const members = selectedGroup?.members || [];
    const betCreatorId = bet.createdByUserId;
    const creatorStillMember = Boolean(betCreatorId && members.includes(betCreatorId));

    // Group owner can only take over bet management when original creator has left.
    return !creatorStillMember;
  };

  const openEditBetModal = (bet: Bet, idx: number) => {
    if (!canManageBet(bet)) {
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
        if (!targetBet || !canManageBet(targetBet)) {
          throw new Error('Du har ikke tilgang til å markere dette bettet som ferdig.');
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
              await updateDoc(
                userRef,
                new FieldPath('groupDrinkStats', selectedGroup.id, 'drinksToDistribute', wager.drinkType, wager.measureType),
                increment(wager.amount)
              );
            } else {
              // Loser: gets their own bet amount as drinks to consume
              await updateDoc(
                userRef,
                new FieldPath('groupDrinkStats', selectedGroup.id, 'drinksToConsume', wager.drinkType, wager.measureType),
                increment(wager.amount)
              );
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
    if (!canAddEditBetOption) {
      return;
    }
    setEditBetOptions([...editBetOptions, { name: '' }]);
  };

  const removeEditBetOption = (idx: number) => {
    if (editBetOptions.length <= 1) {
      return;
    }
    setEditBetOptions((prev) => prev.filter((_, optionIdx) => optionIdx !== idx));
    setFocusedEditBetOptionIndex((prev) => (prev === idx ? null : prev !== null && prev > idx ? prev - 1 : prev));
  };

  const handleSaveEditBet = async () => {
    if (editBetIdx === null || !selectedGroup) return;
    const trimmedEditBetTitle = normalizeSingleLineText(editBetTitle);
    if (!trimmedEditBetTitle) {
      showAlert('Feil', 'Bet-tittel kan ikke være tom');
      return;
    }

    if (trimmedEditBetTitle.length > INPUT_LIMITS.betTitleMax) {
      showAlert('Feil', `Bet-tittel kan maks være ${INPUT_LIMITS.betTitleMax} tegn`);
      return;
    }

    const normalizedEditOptions = editBetOptions.map((opt) => normalizeSingleLineText(opt.name));
    if (normalizedEditOptions.some((name) => !name)) {
      showAlert('Feil', 'Alle alternativer må ha navn');
      return;
    }
    if (normalizedEditOptions.some((name) => name.length > INPUT_LIMITS.betOptionNameMax)) {
      showAlert('Feil', `Alternativ-navn kan maks være ${INPUT_LIMITS.betOptionNameMax} tegn`);
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
      if (!originalBet || !canManageBet(originalBet)) {
        throw new Error('Du har ikke tilgang til å redigere dette bettet.');
      }
      const updatedBet = {
        ...originalBet,
        title: trimmedEditBetTitle,
        options: normalizedEditOptions.map((name, idx) => ({
          id: `${originalBet.id}_${idx}`,
          name,
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
      if (!targetBet || !canManageBet(targetBet)) {
        throw new Error('Du har ikke tilgang til å slette dette bettet.');
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

  const handleMemberTap = (userId: string) => {
    setSelectedMember(userId);
    setSelectedDistribution(null);
    setDistributionAmountMode('preset');
    setDistributionCustomAmount('');
    setHasInteractedDistributionCustomAmount(false);
  };

  const handleDistributionSelect = (drinkType: DrinkType, measureType: MeasureType) => {
    if (!selectedMember) return;
    setSelectedDistribution({ drinkType, measureType, amount: 1 });
    setDistributionAmountMode('preset');
    setDistributionCustomAmount('');
    setHasInteractedDistributionCustomAmount(false);
  };

  const handleDistributionAmountChange = (amount: number) => {
    if (!selectedDistribution || !selectedMember) return;
    setDistributionAmountMode('preset');
    setDistributionCustomAmount('');
    setHasInteractedDistributionCustomAmount(false);
    setSelectedDistribution(prev => prev ? { ...prev, amount: Math.max(1, amount) } : null);
  };

  const handleCancelDistributionFlow = () => {
    setSelectedMember(null);
    setSelectedDistribution(null);
    setDistributionAmountMode('preset');
    setDistributionCustomAmount('');
    setHasInteractedDistributionCustomAmount(false);
    setDistributions([]);
    setDistributeModalVisible(false);
  };

  const handleConfirmDistribution = () => {
    if (!selectedMember || !selectedDistribution) return;

    const { drinkType, measureType } = selectedDistribution;
    const amountFromInput = parseInt(distributionCustomAmount, 10);
    const amount = distributionAmountMode === 'custom' ? amountFromInput : selectedDistribution.amount;

    if (!Number.isInteger(amount) || amount <= 0) {
      showAlert('Feil', 'Velg et gyldig antall større enn 0');
      return;
    }
    
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
    setDistributionAmountMode('preset');
    setDistributionCustomAmount('');
    setHasInteractedDistributionCustomAmount(false);
  };

  // Used in drink distribution UI to show member cards for selection
  const renderMemberCard = ({ item }: { item: Friend }) => {
    return (
      <DistributionMemberCard
        item={item}
        selectedMember={selectedMember}
        selectedDistribution={selectedDistribution}
        availableDistributionEntries={availableDistributionEntries}
        distributionCustomAmount={distributionCustomAmount}
        distributionAmountMode={distributionAmountMode}
        hasInteractedDistributionCustomAmount={hasInteractedDistributionCustomAmount}
        distributionAmountFocused={distributionAmountFocused}
        distributingDrinks={distributingDrinks}
        hasAvailableDrinks={hasAvailableDrinks}
        onMemberTap={handleMemberTap}
        onDistributionSelect={handleDistributionSelect}
        onDistributionAmountChange={handleDistributionAmountChange}
        onSetDistributionAmountMode={setDistributionAmountMode}
        onSetHasInteractedDistributionCustomAmount={setHasInteractedDistributionCustomAmount}
        onSetDistributionCustomAmount={setDistributionCustomAmount}
        onSetDistributionAmountFocused={setDistributionAmountFocused}
        onConfirmDistribution={handleConfirmDistribution}
        clampDigits={clampDigits}
      />
    );
  };

  // Used in members list to show member details with admin/friend actions
  const renderMemberItem = ({ item }: { item: Friend }) => {
    const isCreator = selectedGroup?.createdBy === item.id;
    const isCurrentUserCreator = user?.id === selectedGroup?.createdBy;
    const isCurrentUser = user?.id === item.id;
    const isFriend = friends.some((friend) => friend.id === item.id);
    const hasOutgoingRequest = pendingFriendRequests.some((request) => request.toUserId === item.id);
    const hasIncomingRequest = incomingFriendRequests.some((request) => request.fromUserId === item.id);

    return (
      <MemberRow
        item={item}
        isCreator={Boolean(isCreator)}
        isCurrentUserCreator={Boolean(isCurrentUserCreator)}
        isCurrentUser={Boolean(isCurrentUser)}
        isFriend={isFriend}
        hasOutgoingRequest={hasOutgoingRequest}
        hasIncomingRequest={hasIncomingRequest}
        sendingFriendRequest={sendingFriendRequest}
        inviting={inviting}
        onRemoveMember={handleRemoveFriendFromGroup}
        onAddFriend={handleSendFriendRequest}
        onAcceptFriend={handleAcceptIncomingFriendRequest}
        onCancelFriend={handleCancelPendingFriendRequest}
        creatorLabel="(Eier)"
      />
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const invitationSent = sentGroupInvitations.some((invitation) => invitation.toUserId === item.id);
    return (
      <FriendInviteRow
        item={item}
        invitationSent={invitationSent}
        inviting={inviting}
        onInvite={handleInviteFriend}
        onCancelInvitation={handleCancelSentGroupInvitation}
      />
    );
  };

  const renderBet = ({ item, index }: { item: Bet; index: number }) => {
    return (
      <BetCard
        item={item}
        index={index}
        userId={user?.id}
        memberData={memberData}
        canManageBet={canManageBet}
        getUserWagerForBet={getUserWagerForBet}
        getOptionName={getOptionName}
        onOpenPlaceBet={openPlaceBetModal}
        onOpenEditBet={openEditBetModal}
        pencilIcon={PencilIcon}
      />
    );
  };

  const handleRegisterConsumedDrink = useCallback(async (drinkType: DrinkType, measureType: MeasureType) => {
    if (!user?.id || !selectedGroup?.id) return;
    const actionKey = `${drinkType}-${measureType}`;
    setConsumingDrinkKey(actionKey);
    try {
      await registerConsumedDrinks(user.id, selectedGroup.id, [{ drinkType, measureType, amount: 1 }]);
      const updatedLeaderboard = await getLeaderboardData();
      setLeaderboardData(updatedLeaderboard);
    } catch (error) {
      console.error('Error registering consumed drink:', error);
      showAlert('Feil', 'Kunne ikke registrere drikke drukket');
    } finally {
      setConsumingDrinkKey(null);
    }
  }, [getLeaderboardData, selectedGroup?.id, user?.id, setLeaderboardData]);

  const renderDetailedDrinkOverview = ({ item }: { item: MemberDrinkStats }) => {
    const selectedDetailView = drinkDetailViewByUser[item.userId] || 'consume';
    const memberDistributedTransactions = leaderboardData
      .flatMap((member) => member.transactions)
      .filter((transaction) => transaction.fromUserId === item.userId)
      .sort((a, b) => b.timestamp - a.timestamp);

    return (
      <DetailedDrinkOverviewCard
        item={item}
        isOwnUser={item.userId === user?.id}
        selectedDetailView={selectedDetailView}
        onSelectDetailView={(view) => setDrinkDetailViewByUser((prev) => ({ ...prev, [item.userId]: view }))}
        consumingDrinkKey={consumingDrinkKey}
        onRegisterConsumedDrink={handleRegisterConsumedDrink}
        memberDistributedTransactions={memberDistributedTransactions}
        defaultProfilePicture={DefaultProfilePicture}
        getMemberName={getMemberName}
        getMemberUsernameLabel={getMemberUsernameLabel}
      />
    );
  };

  const renderPodiumCard = ({
    member,
    placement,
    mode = 'betsWon',
  }: {
    member: GroupLeaderboardMemberStats;
    placement: 1 | 2 | 3;
    mode?: 'betsWon' | 'bac';
  }) => {
    return (
      <LeaderboardPodiumCard
        imageMissing={ImageMissing}
        member={member}
        placement={placement}
        mode={mode}
        getMemberName={getMemberName}
        getMemberUsernameLabel={getMemberUsernameLabel}
      />
    );
  };

  const renderLeaderboardItem = ({ item, index }: { item: MemberDrinkStats; index: number }) => {
    return (
      <LeaderboardRow
        item={item}
        index={index}
        leaderboardView={leaderboardView}
        defaultProfilePicture={DefaultProfilePicture}
        getMemberName={getMemberName}
        getMemberUsernameLabel={getMemberUsernameLabel}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={globalStyles.containerWeb}
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
          <GroupHeader
            currentGroup={currentGroup}
            editingName={editingName}
            groupName={groupName}
            groupNameFocused={groupNameFocused}
            saving={saving}
            canEditGroupName={canEditGroupName}
            canManageGroupImage={canManageGroupImage}
            hasCustomGroupImage={hasCustomGroupImage}
            uploadingGroupImage={uploadingGroupImage}
            pencilIcon={PencilIcon}
            groupImageIcon={GroupImageIcon}
            trashIcon={TrashIcon}
            peopleIcon={PeopleIcon}
            onBackToProfile={() => router.replace('/profile')}
            onOpenMembers={openGroupMembersScreen}
            onGroupNameChange={setGroupName}
            onSetGroupNameFocused={setGroupNameFocused}
            onSaveGroupName={handleSaveGroupName}
            onCancelEditGroupName={() => {
              setGroupName(selectedGroup.name);
              setGroupNameFocused(false);
              setEditingName(false);
            }}
            onStartEditGroupName={() => setEditingName(true)}
            onUploadOrChangeGroupImage={handleUploadOrChangeGroupImage}
            onRemoveGroupImage={handleRemoveGroupImage}
          />

          <GroupActionPanel
            onOpenBetModal={openBetModal}
            onOpenDistributeModal={openDistributeModal}
            onOpenLeaderboardModal={openLeaderboardModal}
          />

          <ActiveBetsSection
            bets={bets}
            userId={user?.id}
            renderBet={renderBet}
          />

          {selectedGroup && user && (
            <GroupExitSection
              isCreator={selectedGroup.createdBy === user.id}
              deleting={deleting}
              onDeleteGroup={handleDeleteGroup}
              onExitGroup={handleExitGroup}
            />
          )}
        </ScrollView>
      )}

      <GroupScreenModals
        INPUT_LIMITS={INPUT_LIMITS}
        DefaultProfilePicture={DefaultProfilePicture}
        addAllGroupMembersAsBetOptions={addAllGroupMembersAsBetOptions}
        addBetOption={addBetOption}
        addEditBetOption={addEditBetOption}
        averageBacBarProgress={averageBacBarProgress}
        availableDistributionEntries={availableDistributionEntries}
        availableFriends={availableFriends}
        bacLeaderboardData={bacLeaderboardData}
        bacVisualMax={bacVisualMax}
        betAmount={betAmount}
        betAmountFocused={betAmountFocused}
        betAnonymous={betAnonymous}
        betTitle={betTitle}
        betTitleFocused={betTitleFocused}
        betModalVisible={betModalVisible}
        betOptions={betOptions}
        betSaving={betSaving}
        bets={bets}
        canAddBetOption={canAddBetOption}
        canAddEditBetOption={canAddEditBetOption}
        canPlaceBet={canPlaceBet}
        canSaveBet={canSaveBet}
        clampDigits={clampDigits}
        createGroupModalVisible={createGroupModalVisible}
        createGroupName={createGroupName}
        createGroupNameFocused={createGroupNameFocused}
        creatingGroup={creatingGroup}
        distributionLoading={distributionLoading}
        distributions={distributions}
        distributeModalVisible={distributeModalVisible}
        distributingDrinks={distributingDrinks}
        drinkTypes={drinkTypes}
        editBetAnonymous={editBetAnonymous}
        editBetModalVisible={editBetModalVisible}
        editBetOptions={editBetOptions}
        editBetSaving={editBetSaving}
        editBetTitle={editBetTitle}
        editBetTitleFocused={editBetTitleFocused}
        editHiddenBetMemberIds={editHiddenBetMemberIds}
        editMenuModalVisible={editMenuModalVisible}
        focusedBetOptionIndex={focusedBetOptionIndex}
        focusedEditBetOptionIndex={focusedEditBetOptionIndex}
        getBacRangeTone={getBacRangeTone}
        globalStyles={globalStyles}
        groupAverageBAC={groupAverageBAC}
        groupAverageBacTone={groupAverageBacTone}
        groupStyles={groupStyles}
        handleCancelDistributionFlow={handleCancelDistributionFlow}
        handleCreateGroup={handleCreateGroup}
        handleDeleteBet={handleDeleteBet}
        handleDistributeDrinks={handleDistributeDrinks}
        handlePlaceBet={handlePlaceBet}
        handleSaveBet={handleSaveBet}
        handleSaveEditBet={handleSaveEditBet}
        handleSelectCorrectOption={handleSelectCorrectOption}
        hasAvailableDrinks={hasAvailableDrinks}
        hasInteractedPlaceBetAmount={hasInteractedPlaceBetAmount}
        hiddenBetMemberIds={hiddenBetMemberIds}
        leaderboardData={leaderboardData}
        leaderboardLoading={leaderboardLoading}
        leaderboardModalVisible={leaderboardModalVisible}
        leaderboardView={leaderboardView}
        measureTypes={measureTypes}
        memberData={memberData}
        membersLoading={membersLoading}
        membersModalVisible={membersModalVisible}
        placeBetAttempted={placeBetAttempted}
        placeBetMaxAmount={placeBetMaxAmount}
        placeBetModalVisible={placeBetModalVisible}
        placeBetValidationMessage={placeBetValidationMessage}
        placingBet={placingBet}
        removeBetOption={removeBetOption}
        removeEditBetOption={removeEditBetOption}
        renderDetailedDrinkOverview={renderDetailedDrinkOverview}
        renderFriendItem={renderFriendItem}
        renderLeaderboardItem={renderLeaderboardItem}
        renderMemberCard={renderMemberCard}
        renderMemberItem={renderMemberItem}
        renderPodiumCard={renderPodiumCard}
        selectedBetOption={selectedBetOption}
        selectedDrinkType={selectedDrinkType}
        selectedEditBet={selectedEditBet}
        selectedGroup={selectedGroup}
        selectedMeasureType={selectedMeasureType}
        selectCorrectBetIdx={selectCorrectBetIdx}
        selectCorrectModalVisible={selectCorrectModalVisible}
        setBetAmount={setBetAmount}
        setBetAmountFocused={setBetAmountFocused}
        setBetAnonymous={setBetAnonymous}
        setBetModalVisible={setBetModalVisible}
        setBetTitle={setBetTitle}
        setBetTitleFocused={setBetTitleFocused}
        setCreateGroupModalVisible={setCreateGroupModalVisible}
        setCreateGroupName={setCreateGroupName}
        setCreateGroupNameFocused={setCreateGroupNameFocused}
        setEditBetAnonymous={setEditBetAnonymous}
        setEditBetIdx={setEditBetIdx}
        setEditBetModalVisible={setEditBetModalVisible}
        setEditBetOptions={setEditBetOptions}
        setEditBetTitle={setEditBetTitle}
        setEditBetTitleFocused={setEditBetTitleFocused}
        setEditHiddenBetMemberIds={setEditHiddenBetMemberIds}
        setEditMenuModalVisible={setEditMenuModalVisible}
        setFocusedBetOptionIndex={setFocusedBetOptionIndex}
        setFocusedEditBetOptionIndex={setFocusedEditBetOptionIndex}
        setHasInteractedPlaceBetAmount={setHasInteractedPlaceBetAmount}
        setLeaderboardModalVisible={setLeaderboardModalVisible}
        setLeaderboardView={setLeaderboardView}
        setMembersModalVisible={setMembersModalVisible}
        setDistributeModalVisible={setDistributeModalVisible}
        setPlaceBetModalVisible={setPlaceBetModalVisible}
        setSelectedDrinkType={setSelectedDrinkType}
        setSelectedMeasureType={setSelectedMeasureType}
        setSelectCorrectBetIdx={setSelectCorrectBetIdx}
        setSelectCorrectModalVisible={setSelectCorrectModalVisible}
        shouldScrollAvailableFriends={shouldScrollAvailableFriends}
        shouldScrollBetOptions={shouldScrollBetOptions}
        shouldScrollEditBetOptions={shouldScrollEditBetOptions}
        shouldScrollMembers={shouldScrollMembers}
        shouldScrollPlannedDistributions={shouldScrollPlannedDistributions}
        showAlert={showAlert}
        theme={theme}
        toggleEditHiddenBetMember={toggleEditHiddenBetMember}
        toggleHiddenBetMember={toggleHiddenBetMember}
        updateBetOption={updateBetOption}
        updateEditBetOption={updateEditBetOption}
        user={user}
      />
    </KeyboardAvoidingView>
  );
};

export default GroupScreen;
