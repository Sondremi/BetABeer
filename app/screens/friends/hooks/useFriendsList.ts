import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { firestore } from '../../../services/firebase/FirebaseConfig';
import type { FriendRequest, FriendWithPending } from '../../../types/userTypes';
import { getDefaultProfilePicture, resolveProfileImageSource } from '../../../utils/profileImage';

const DefaultProfilePicture = getDefaultProfilePicture();

type UseFriendsListParams = {
  loading: boolean;
  outgoingRequests: FriendRequest[];
  userId?: string;
};

export const useFriendsList = ({ loading, outgoingRequests, userId }: UseFriendsListParams) => {
  const [friends, setFriends] = useState<FriendWithPending[]>([]);

  const fetchFriends = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      return;
    }

    try {
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      const friendIds = userDoc.exists() ? userDoc.data().friends || [] : [];

      const friendDocs = await Promise.all(
        friendIds.map((id: string) => getDoc(doc(firestore, 'users', id)))
      );

      const friendsData: FriendWithPending[] = friendDocs
        .filter((friendDoc) => friendDoc.exists())
        .map((friendDoc) => ({
          id: friendDoc.id,
          name: friendDoc.data().name || 'Ukjent',
          username: friendDoc.data().username || 'ukjent',
          profilePicture: friendDoc.data().profileImage
            ? resolveProfileImageSource(friendDoc.data().profileImage, DefaultProfilePicture)
            : DefaultProfilePicture,
          type: 'friend' as const,
        }));

      const pendingFriends: FriendWithPending[] = outgoingRequests
        .map((request) => ({
          id: request.toUserId,
          name: request.name || 'Ukjent',
          username: request.username || 'ukjent',
          profilePicture: request.profilePicture || DefaultProfilePicture,
          type: 'pending' as const,
          requestId: request.id,
        }))
        .filter((pendingFriend) => !friendsData.some((friend) => friend.id === pendingFriend.id));

      const allFriends = [...pendingFriends, ...friendsData].sort((a, b) => a.name.localeCompare(b.name));
      setFriends(allFriends);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  }, [outgoingRequests, userId]);

  useEffect(() => {
    if (loading) return;
    fetchFriends();
  }, [fetchFriends, loading]);

  return {
    friends,
    setFriends,
    fetchFriends,
  };
};
