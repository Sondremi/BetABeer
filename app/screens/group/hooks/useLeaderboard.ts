import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { firestore } from '../../../services/firebase/FirebaseConfig';
import { profileService } from '../../../services/profileService';
import { theme } from '../../../styles/theme';
import type { Bet, DrinkTransaction, DrinkType, Group, MeasureType, MemberDrinkStats } from '../../../types/drinkTypes';
import { getDefaultProfilePicture, resolveProfileImageSource } from '../../../utils/profileImage';

const DefaultProfilePicture = getDefaultProfilePicture();

export type GroupLeaderboardMemberStats = MemberDrinkStats & {
  currentBAC: number;
};

export type BacRangeTone = {
  rowBackground: string;
  rowBorder: string;
  badgeBackground: string;
  badgeBorder: string;
  badgeText: string;
  valueCardBackground: string;
  valueCardBorder: string;
  valueText: string;
  averageFill: string;
};

const getBacRangeTone = (bac: number): BacRangeTone => {
  if (bac < 0.5) {
    return {
      rowBackground: 'rgba(56, 147, 232, 0.12)',
      rowBorder: 'rgba(92, 170, 238, 0.42)',
      badgeBackground: 'rgba(56, 147, 232, 0.22)',
      badgeBorder: 'rgba(92, 170, 238, 0.62)',
      badgeText: '#8FC5F2',
      valueCardBackground: 'rgba(56, 147, 232, 0.62)',
      valueCardBorder: '#8CC7F8',
      valueText: '#F2F9FF',
      averageFill: '#3893E8',
    };
  }

  if (bac <= 1.09) {
    return {
      rowBackground: 'rgba(255, 215, 0, 0.12)',
      rowBorder: 'rgba(255, 215, 0, 0.40)',
      badgeBackground: 'rgba(255, 215, 0, 0.24)',
      badgeBorder: 'rgba(255, 215, 0, 0.62)',
      badgeText: '#FFF0A8',
      valueCardBackground: 'rgba(201, 150, 0, 0.94)',
      valueCardBorder: '#FFE978',
      valueText: '#FFF9E2',
      averageFill: theme.colors.primary,
    };
  }

  if (bac <= 1.59) {
    return {
      rowBackground: 'rgba(255, 165, 0, 0.12)',
      rowBorder: 'rgba(255, 165, 0, 0.42)',
      badgeBackground: 'rgba(255, 165, 0, 0.24)',
      badgeBorder: 'rgba(255, 165, 0, 0.62)',
      badgeText: '#FFD18E',
      valueCardBackground: 'rgba(255, 165, 0, 0.82)',
      valueCardBorder: '#FFD08A',
      valueText: '#241400',
      averageFill: '#FFA500',
    };
  }

  if (bac <= 2.49) {
    return {
      rowBackground: 'rgba(255, 99, 71, 0.12)',
      rowBorder: 'rgba(255, 99, 71, 0.42)',
      badgeBackground: 'rgba(255, 99, 71, 0.24)',
      badgeBorder: 'rgba(255, 99, 71, 0.62)',
      badgeText: '#FFB7A5',
      valueCardBackground: 'rgba(255, 99, 71, 0.82)',
      valueCardBorder: '#FFC5B3',
      valueText: '#2A0900',
      averageFill: '#FF6347',
    };
  }

  return {
    rowBackground: 'rgba(255, 90, 110, 0.14)',
    rowBorder: 'rgba(255, 112, 130, 0.52)',
    badgeBackground: 'rgba(255, 90, 110, 0.26)',
    badgeBorder: 'rgba(255, 136, 150, 0.70)',
    badgeText: '#FFD6DE',
    valueCardBackground: 'rgba(255, 36, 36, 0.90)',
    valueCardBorder: '#FFB3B3',
    valueText: '#FFF5F5',
    averageFill: '#FF2424',
  };
};

const getGroupScopedDrinkStats = (userData: any, groupId?: string) => {
  const groupStats = groupId ? userData?.groupDrinkStats?.[groupId] : null;
  return {
    drinksToConsume: groupStats?.drinksToConsume || userData?.drinksToConsume || {},
    drinksConsumed: groupStats?.drinksConsumed || userData?.drinksConsumed || {},
    drinksToDistribute: groupStats?.drinksToDistribute || userData?.drinksToDistribute || {},
  };
};

type UseLeaderboardParams = {
  bets: Bet[];
  fetchMemberUsernames: (memberIds: string[]) => Promise<{ [key: string]: string }>;
  leaderboardModalVisible: boolean;
  selectedGroup: Group | null;
};

export const useLeaderboard = ({ bets, fetchMemberUsernames, leaderboardModalVisible, selectedGroup }: UseLeaderboardParams) => {
  const [leaderboardData, setLeaderboardData] = useState<GroupLeaderboardMemberStats[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardView, setLeaderboardView] = useState<'betsWon' | 'drinkStats' | 'bac'>('betsWon');

  const getLeaderboardData = useCallback(async (): Promise<GroupLeaderboardMemberStats[]> => {
    if (!selectedGroup || !selectedGroup.members) return [];

    const usernames = await fetchMemberUsernames(selectedGroup.members);
    const memberStats: { [userId: string]: GroupLeaderboardMemberStats } = {};

    const ensureMemberStats = (userId: string, fallbackUsername = 'Ukjent') => {
      if (!memberStats[userId]) {
        memberStats[userId] = {
          userId,
          name: '',
          username: fallbackUsername || 'Ukjent',
          betsWon: 0,
          betsLost: 0,
          currentBAC: 0,
          profilePicture: DefaultProfilePicture,
          drinksToConsume: {},
          drinksConsumed: {},
          drinksToDistribute: {},
          transactions: [],
        };
      }
      return memberStats[userId];
    };

    await Promise.all(
      selectedGroup.members.map(async (userId: string) => {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', userId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          const hasBacData =
            Array.isArray(userData.drinks) &&
            typeof userData.weight === 'number' &&
            (userData.gender === 'male' || userData.gender === 'female');
          const currentBAC = hasBacData
            ? profileService.calculateBAC(userData.drinks, userData.weight, userData.gender, Date.now())
            : 0;

          const scopedDrinkStats = getGroupScopedDrinkStats(userData, selectedGroup.id);

          memberStats[userId] = {
            userId,
            name: userData.name || '',
            username: usernames[userId] || 'Ukjent',
            betsWon: 0,
            betsLost: 0,
            currentBAC,
            profilePicture: userData.profileImage
              ? resolveProfileImageSource(userData.profileImage, DefaultProfilePicture)
              : DefaultProfilePicture,
            drinksToConsume: scopedDrinkStats.drinksToConsume,
            drinksConsumed: scopedDrinkStats.drinksConsumed,
            drinksToDistribute: scopedDrinkStats.drinksToDistribute,
            transactions: [],
          };
        } catch (error) {
          console.error(`Error fetching member ${userId}:`, error);
          memberStats[userId] = {
            userId,
            name: '',
            username: usernames[userId] || 'Ukjent',
            betsWon: 0,
            betsLost: 0,
            currentBAC: 0,
            profilePicture: DefaultProfilePicture,
            drinksToConsume: {},
            drinksConsumed: {},
            drinksToDistribute: {},
            transactions: [],
          };
        }
      })
    );

    const finishedBets = bets.filter((bet) => bet.isFinished && bet.correctOptionId);
    finishedBets.forEach((bet) => {
      const wagers = bet.wagers || [];
      wagers.forEach((wager) => {
        const stats = ensureMemberStats(wager.userId, usernames[wager.userId] || wager.username || 'Ukjent');
        stats.username = usernames[wager.userId] || wager.username || 'Ukjent';
        if (wager.optionId === bet.correctOptionId) {
          stats.betsWon += 1;
        } else {
          stats.betsLost += 1;
        }
      });
    });

    const transactionsRef = collection(firestore, `groups/${selectedGroup.id}/transactions`);
    const transactionsSnapshot = await getDocs(transactionsRef);
    const distributionHistory: DrinkTransaction[] = transactionsSnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        fromUserId: data.fromUserId,
        fromUsername: data.fromUsername,
        toUserId: data.toUserId,
        toUsername: data.toUsername,
        drinkType: data.drinkType as DrinkType,
        measureType: data.measureType as MeasureType,
        amount: data.amount,
        source: data.source,
        timestamp: data.timestamp,
      } as DrinkTransaction;
    });

    distributionHistory.forEach((dist: DrinkTransaction) => {
      const receiverStats = ensureMemberStats(dist.toUserId, usernames[dist.toUserId] || dist.toUsername || 'Ukjent');
      const drinkTypeObj = receiverStats.drinksToConsume[dist.drinkType] ?? (receiverStats.drinksToConsume[dist.drinkType] = {});
      drinkTypeObj[dist.measureType] = (drinkTypeObj[dist.measureType] ?? 0) + dist.amount;
      receiverStats.transactions.push(dist);

      const senderStats = ensureMemberStats(dist.fromUserId, usernames[dist.fromUserId] || dist.fromUsername || 'Ukjent');
      senderStats.transactions.push(dist);
    });

    return Object.values(memberStats).sort((a, b) => b.betsWon - a.betsWon);
  }, [bets, fetchMemberUsernames, selectedGroup]);

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
  }, [getLeaderboardData, leaderboardModalVisible]);

  useEffect(() => {
    if (!leaderboardModalVisible || leaderboardView !== 'bac' || !selectedGroup) return;

    let isMounted = true;
    const refreshPromille = async () => {
      try {
        const data = await getLeaderboardData();
        if (isMounted) setLeaderboardData(data);
      } catch (error) {
        console.error('Error refreshing promille leaderboard:', error);
      }
    };

    refreshPromille();
    const interval = setInterval(refreshPromille, 15 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [bets, getLeaderboardData, leaderboardModalVisible, leaderboardView, selectedGroup]);

  const bacLeaderboardData = useMemo(
    () => [...leaderboardData].sort((a, b) => b.currentBAC - a.currentBAC),
    [leaderboardData]
  );
  const groupAverageBAC = useMemo(() => {
    if (bacLeaderboardData.length === 0) return 0;
    const totalBAC = bacLeaderboardData.reduce((sum, member) => sum + member.currentBAC, 0);
    return totalBAC / bacLeaderboardData.length;
  }, [bacLeaderboardData]);
  const bacVisualMax = useMemo(() => {
    const highestMemberBAC = bacLeaderboardData[0]?.currentBAC || 0;
    return Math.max(0.08, highestMemberBAC);
  }, [bacLeaderboardData]);
  const averageBacBarProgress = useMemo(() => {
    if (bacVisualMax <= 0) return 0;
    return Math.min(1, groupAverageBAC / bacVisualMax);
  }, [groupAverageBAC, bacVisualMax]);
  const groupAverageBacTone = useMemo(() => getBacRangeTone(groupAverageBAC), [groupAverageBAC]);

  return {
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
  };
};

