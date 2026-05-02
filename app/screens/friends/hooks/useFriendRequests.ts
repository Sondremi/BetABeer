import { useEffect, useState } from 'react';
import { getIncomingRequest, getOutgoingRequest, listenToIncomingRequests, listenToOutgoingRequests } from '../../../services/friendService';
import type { FriendRequest } from '../../../types/userTypes';

type UseFriendRequestsParams = {
  loading: boolean;
  userId?: string;
};

export const useFriendRequests = ({ loading, userId }: UseFriendRequestsParams) => {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (loading) return;

    if (!userId) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }

    const loadInitialRequests = async () => {
      try {
        const [incoming, outgoing] = await Promise.all([
          getIncomingRequest(userId),
          getOutgoingRequest(userId),
        ]);
        setIncomingRequests(incoming);
        setOutgoingRequests(outgoing);
      } catch (error) {
        console.error('Failed to load initial friend requests:', error);
      }
    };

    loadInitialRequests();

    const unsubIncoming = listenToIncomingRequests(userId, setIncomingRequests);
    const unsubOutgoing = listenToOutgoingRequests(userId, setOutgoingRequests);

    return () => {
      if (typeof unsubIncoming === 'function') unsubIncoming();
      if (typeof unsubOutgoing === 'function') unsubOutgoing();
    };
  }, [loading, userId]);

  return {
    incomingRequests,
    outgoingRequests,
    setIncomingRequests,
    setOutgoingRequests,
  };
};
