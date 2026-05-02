import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { firestore } from '../../../services/firebase/FirebaseConfig';
import type { Bet, Group } from '../../../types/drinkTypes';
import type { Friend } from '../../../types/userTypes';
import { getDefaultProfilePicture, resolveProfileImageSource } from '../../../utils/profileImage';

const ImageMissing = require('../../../../assets/images/image_missing.png');
const DefaultProfilePicture = getDefaultProfilePicture();

type UseGroupDataParams = {
  userId?: string;
  editingName: boolean;
  selectedGroupParam?: string | string[];
};

const parseSelectedGroupParamId = (selectedGroupParam?: string | string[]): string | null => {
  if (!selectedGroupParam) return null;
  try {
    const parsed = Array.isArray(selectedGroupParam)
      ? JSON.parse(selectedGroupParam[0])
      : JSON.parse(selectedGroupParam);
    return typeof parsed?.id === 'string' ? parsed.id : null;
  } catch (error) {
    console.error('Error parsing selectedGroup param:', error);
    return null;
  }
};

export const useGroupData = ({ userId, editingName, selectedGroupParam }: UseGroupDataParams) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupsResolved, setGroupsResolved] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [memberData, setMemberData] = useState<Friend[]>([]);
  const [cachedUsernames, setCachedUsernames] = useState<{ [key: string]: string }>({});

  const fetchMemberUsernames = useCallback(async (memberIds: string[]): Promise<{ [key: string]: string }> => {
    const usernames: { [key: string]: string } = { ...cachedUsernames };
    const uncachedIds = memberIds.filter((id) => !usernames[id]);

    if (uncachedIds.length > 0) {
      await Promise.all(
        uncachedIds.map(async (memberId) => {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', memberId));
            usernames[memberId] = userDoc.exists()
              ? userDoc.data().username || userDoc.data().displayName || userDoc.data().email || (userId && memberId === userId ? 'Meg' : 'Ukjent')
              : (userId && memberId === userId ? 'Meg' : 'Ukjent');
          } catch (error) {
            console.error(`Error fetching username for member ${memberId}:`, error);
            usernames[memberId] = userId && memberId === userId ? 'Meg' : 'Ukjent';
          }
        })
      );
      setCachedUsernames(usernames);
    }
    return usernames;
  }, [cachedUsernames, userId]);

  const selectedGroupMembersKey = selectedGroup?.members?.join('|') ?? '';

  useEffect(() => {
    if (!selectedGroup?.id || !Array.isArray(selectedGroup.members) || selectedGroup.members.length === 0) {
      return;
    }

    let isCancelled = false;
    const pruneDeletedMembers = async () => {
      try {
        const memberChecks = await Promise.all(
          selectedGroup.members.map(async (memberId) => {
            const memberDoc = await getDoc(doc(firestore, 'users', memberId));
            return { memberId, exists: memberDoc.exists() };
          })
        );
        if (isCancelled) return;

        const validMemberIds = memberChecks.filter((check) => check.exists).map((check) => check.memberId);
        if (validMemberIds.length === selectedGroup.members.length) {
          return;
        }

        await updateDoc(doc(firestore, 'groups', selectedGroup.id), { members: validMemberIds });
      } catch (error) {
        console.error('Error pruning deleted group members:', error);
      }
    };

    pruneDeletedMembers();
    return () => {
      isCancelled = true;
    };
  }, [selectedGroup, selectedGroupMembersKey]);

  useEffect(() => {
    if (!userId) return;

    setGroupsResolved(false);
    const selectedGroupFromParamsId = parseSelectedGroupParamId(selectedGroupParam);

    const groupQuery = query(collection(firestore, 'groups'), where('members', 'array-contains', userId));
    const unsubscribe = onSnapshot(groupQuery, (groupSnapshot) => {
      const groupList = groupSnapshot.docs.map((docSnap) => {
        const groupData = docSnap.data();
        return {
          id: docSnap.id,
          name: groupData.name || groupData.groupName || groupData.group_name || 'Gruppenavn',
          memberCount: groupData.members?.length || 0,
          image: resolveProfileImageSource(groupData.image, ImageMissing),
          imageUrl: typeof groupData.image === 'string' ? groupData.image : null,
          createdBy: groupData.createdBy || '',
          members: groupData.members || [],
        } as Group;
      });

      const uniqueGroups = Array.from(new Map(groupList.map((group) => [group.id, group])).values());
      setGroups(uniqueGroups);

      if (selectedGroupFromParamsId && !uniqueGroups.some((group) => group.id === selectedGroupFromParamsId)) {
        AsyncStorage.removeItem('lastSelectedGroup').catch((error) => {
          console.error('Error removing invalid group from storage:', error);
        });
      }

      setSelectedGroup((previous) => {
        if (selectedGroupFromParamsId) {
          const groupFromParams = uniqueGroups.find((group) => group.id === selectedGroupFromParamsId);
          if (groupFromParams) return groupFromParams;
        }

        if (previous?.id) {
          const updatedCurrentGroup = uniqueGroups.find((group) => group.id === previous.id);
          if (updatedCurrentGroup) return updatedCurrentGroup;
        }

        return uniqueGroups[0] ?? null;
      });

      setGroupsResolved(true);
    }, (error) => {
      console.error('Error syncing groups snapshot:', error);
      setGroupsResolved(true);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedGroupParam, userId]);

  useEffect(() => {
    if (!selectedGroup) return;
    if (editingName) return;
    setGroupName(selectedGroup.name || '');
  }, [editingName, selectedGroup]);

  useEffect(() => {
    if (!selectedGroup) return;
    AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(selectedGroup)).catch((error) => {
      console.error('Error saving last selected group:', error);
    });
  }, [selectedGroup]);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    const userRef = doc(firestore, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (userDoc) => {
      if (!userDoc.exists() || !isMounted) return;
      const data = userDoc.data();
      const friendIds: string[] = data.friends || [];

      const fetchFriends = async () => {
        const friendData = await Promise.all(
          friendIds.map(async (friendId) => {
            try {
              const friendDoc = await getDoc(doc(firestore, 'users', friendId));
              if (!friendDoc.exists()) return null;
              const payload = friendDoc.data();
              return {
                id: friendDoc.id,
                name: payload.name || 'Ukjent navn',
                username: payload.username || 'ukjent',
                profilePicture: payload.profileImage
                  ? resolveProfileImageSource(payload.profileImage, DefaultProfilePicture)
                  : DefaultProfilePicture,
              } as Friend;
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
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedGroup?.id) {
      setBets([]);
      return;
    }

    const groupRef = doc(firestore, 'groups', selectedGroup.id);
    const unsubscribe = onSnapshot(groupRef, (groupSnap) => {
      if (!groupSnap.exists()) {
        setBets([]);
        return;
      }
      const groupData = groupSnap.data();
      setBets(Array.isArray(groupData.bets) ? groupData.bets : []);
    }, (error) => {
      console.error('Error syncing bets snapshot:', error);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedGroup?.id]);

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
              profilePicture: profileImage
                ? resolveProfileImageSource(profileImage, DefaultProfilePicture)
                : DefaultProfilePicture,
            } as Friend;
          } catch (error) {
            console.error(`Error fetching member ${memberId}:`, error);
            return {
              id: memberId,
              name: 'Ukjent navn',
              username: usernames[memberId] || 'ukjent',
              profilePicture: DefaultProfilePicture,
            } as Friend;
          }
        })
      );
      if (!isMounted) return;
      setMemberData(members.sort((a, b) => a.username.localeCompare(b.username)));
    };

    fetchAndSortMembers();
    return () => {
      isMounted = false;
    };
  }, [fetchMemberUsernames, selectedGroup]);

  return {
    bets,
    fetchMemberUsernames,
    friends,
    groupName,
    groups,
    groupsResolved,
    memberData,
    selectedGroup,
    setBets,
    setFriends,
    setGroupName,
    setGroups,
    setMemberData,
    setSelectedGroup,
  };
};
