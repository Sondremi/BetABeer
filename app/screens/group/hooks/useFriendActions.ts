import { useCallback, useState } from 'react';
import { acceptFriendRequest, cancelFriendRequest, getIncomingRequest, getOutgoingRequest, sendFriendRequest } from '../../../services/friendService';
import type { Friend, FriendRequest } from '../../../types/userTypes';
import { showAlert } from '../../../utils/platformAlert';

type FriendActionMessages = {
  unauthenticated?: string;
  sendFailed?: string;
  acceptFailed?: string;
  cancelFailed?: string;
};

type UseFriendActionsOptions = {
  userId?: string;
  messages?: FriendActionMessages;
};

const defaultMessages: Required<FriendActionMessages> = {
  unauthenticated: 'Bruker ikke autentisert',
  sendFailed: 'Kunne ikke håndtere venneforespørsel',
  acceptFailed: 'Kunne ikke godta venneforespørsel',
  cancelFailed: 'Kunne ikke angre venneforespørsel',
};

export const useFriendActions = ({ userId, messages }: UseFriendActionsOptions) => {
  const mergedMessages = { ...defaultMessages, ...(messages || {}) };
  const [pendingFriendRequests, setPendingFriendRequests] = useState<FriendRequest[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<FriendRequest[]>([]);
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);

  const refreshPendingRequests = useCallback(async () => {
    if (!userId) return;
    const [outgoingRequests, incomingRequests] = await Promise.all([
      getOutgoingRequest(userId),
      getIncomingRequest(userId),
    ]);
    setPendingFriendRequests(outgoingRequests);
    setIncomingFriendRequests(incomingRequests);
  }, [userId]);

  const handleSendFriendRequest = useCallback(async (member: Friend) => {
    if (!userId) {
      showAlert('Feil', mergedMessages.unauthenticated);
      return;
    }

    setSendingFriendRequest(true);
    try {
      const incomingRequests = await getIncomingRequest(userId);
      const existingRequest = incomingRequests.find((request) => request.fromUserId === member.id);

      if (existingRequest) {
        await acceptFriendRequest(existingRequest.id, existingRequest.fromUserId, existingRequest.toUserId);
        setIncomingFriendRequests((prev) => prev.filter((request) => request.id !== existingRequest.id));
      } else {
        await sendFriendRequest(member.id);
      }

      const updatedOutgoing = await getOutgoingRequest(userId);
      setPendingFriendRequests(updatedOutgoing);
    } catch (error) {
      console.error('Error handling friend request:', error);
      showAlert('Feil', mergedMessages.sendFailed);
    } finally {
      setSendingFriendRequest(false);
    }
  }, [mergedMessages.sendFailed, mergedMessages.unauthenticated, userId]);

  const handleAcceptIncomingFriendRequest = useCallback(async (member: Friend) => {
    if (!userId) return;
    const incomingRequest = incomingFriendRequests.find((request) => request.fromUserId === member.id);
    if (!incomingRequest?.id) return;

    setSendingFriendRequest(true);
    try {
      await acceptFriendRequest(incomingRequest.id, incomingRequest.fromUserId, incomingRequest.toUserId);
      setIncomingFriendRequests((prev) => prev.filter((request) => request.id !== incomingRequest.id));
      const updatedOutgoing = await getOutgoingRequest(userId);
      setPendingFriendRequests(updatedOutgoing);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      showAlert('Feil', mergedMessages.acceptFailed);
    } finally {
      setSendingFriendRequest(false);
    }
  }, [incomingFriendRequests, mergedMessages.acceptFailed, userId]);

  const handleCancelPendingFriendRequest = useCallback(async (member: Friend) => {
    if (!userId) return;
    const pendingRequest = pendingFriendRequests.find((request) => request.toUserId === member.id);
    if (!pendingRequest?.id) return;

    setSendingFriendRequest(true);
    try {
      await cancelFriendRequest(pendingRequest.id);
      const updatedOutgoing = await getOutgoingRequest(userId);
      setPendingFriendRequests(updatedOutgoing);
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      showAlert('Feil', mergedMessages.cancelFailed);
    } finally {
      setSendingFriendRequest(false);
    }
  }, [mergedMessages.cancelFailed, pendingFriendRequests, userId]);

  return {
    incomingFriendRequests,
    pendingFriendRequests,
    sendingFriendRequest,
    setIncomingFriendRequests,
    setPendingFriendRequests,
    refreshPendingRequests,
    handleSendFriendRequest,
    handleAcceptIncomingFriendRequest,
    handleCancelPendingFriendRequest,
  };
};

