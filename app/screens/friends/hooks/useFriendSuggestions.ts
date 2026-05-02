import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { firestore } from '../../../services/firebase/FirebaseConfig';
import type { FriendRequest, FriendWithPending } from '../../../types/userTypes';
import { getDefaultProfilePicture, resolveProfileImageSource } from '../../../utils/profileImage';

const DefaultProfilePicture = getDefaultProfilePicture();

export type FriendSuggestion = {
  id: string;
  name: string;
  username: string;
  profilePicture: any;
  mutualCount: number;
};

type UseFriendSuggestionsParams = {
  incomingRequests: FriendRequest[];
  friends: FriendWithPending[];
  outgoingRequests: FriendRequest[];
  userId?: string;
};

export const useFriendSuggestions = ({ incomingRequests, friends, outgoingRequests, userId }: UseFriendSuggestionsParams) => {
  const [friendSuggestions, setFriendSuggestions] = useState<FriendSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    const loadFriendSuggestions = async () => {
      if (!userId) {
        setFriendSuggestions([]);
        return;
      }

      const directFriendIds = new Set(
        friends
          .filter((friend) => friend.type !== 'pending')
          .map((friend) => friend.id)
      );

      if (directFriendIds.size === 0) {
        setFriendSuggestions([]);
        return;
      }

      setSuggestionsLoading(true);
      try {
        const outgoingIds = new Set(outgoingRequests.map((request) => request.toUserId));
        const incomingIds = new Set(incomingRequests.map((request) => request.fromUserId));
        const mutualByCandidate = new Map<string, Set<string>>();

        await Promise.all(
          Array.from(directFriendIds).map(async (friendId) => {
            const friendDoc = await getDoc(doc(firestore, 'users', friendId));
            if (!friendDoc.exists()) return;

            const friendFriendIds = (friendDoc.data().friends || []) as string[];
            friendFriendIds.forEach((candidateId) => {
              if (
                candidateId === userId
                || directFriendIds.has(candidateId)
                || outgoingIds.has(candidateId)
                || incomingIds.has(candidateId)
              ) {
                return;
              }
              const mutualSet = mutualByCandidate.get(candidateId) || new Set<string>();
              mutualSet.add(friendId);
              mutualByCandidate.set(candidateId, mutualSet);
            });
          })
        );

        const candidateIds = Array.from(mutualByCandidate.keys());
        if (candidateIds.length === 0) {
          setFriendSuggestions([]);
          return;
        }

        const candidateDocs = await Promise.all(
          candidateIds.map((candidateId) => getDoc(doc(firestore, 'users', candidateId)))
        );

        const suggestions: FriendSuggestion[] = candidateDocs
          .filter((candidateDoc) => candidateDoc.exists())
          .map((candidateDoc) => {
            const candidateData = candidateDoc.data();
            return {
              id: candidateDoc.id,
              name: candidateData.name || 'Ukjent',
              username: candidateData.username || 'ukjent',
              profilePicture: candidateData.profileImage
                ? resolveProfileImageSource(candidateData.profileImage, DefaultProfilePicture)
                : DefaultProfilePicture,
              mutualCount: mutualByCandidate.get(candidateDoc.id)?.size || 0,
            };
          })
          .sort((a, b) => {
            if (b.mutualCount !== a.mutualCount) return b.mutualCount - a.mutualCount;
            return a.name.localeCompare(b.name);
          });

        setFriendSuggestions(suggestions);
      } catch (error) {
        console.error('Failed to load friend suggestions:', error);
        setFriendSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    loadFriendSuggestions();
  }, [friends, incomingRequests, outgoingRequests, userId]);

  return {
    friendSuggestions,
    suggestionsLoading,
  };
};
