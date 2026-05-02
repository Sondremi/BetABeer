import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { parseInviterIdFromParams, parseInviterIdFromUrl } from '../../../services/friendInviteLinkService';
import { consumePendingGroupInviteId, parseGroupInviteIdFromParams, parseGroupInviteIdFromUrl } from '../../../services/groupInviteLinkService';

type UseLoginInviteHandlingParams = {
  inviterParam?: string | string[];
  groupInviteParam?: string | string[];
};

export const useLoginInviteHandling = ({ inviterParam, groupInviteParam }: UseLoginInviteHandlingParams) => {
  const [inviterId, setInviterId] = useState<string | null>(null);
  const [groupInviteId, setGroupInviteId] = useState<string | null>(null);

  useEffect(() => {
    const paramInviter = parseInviterIdFromParams(inviterParam);
    if (paramInviter) {
      setInviterId(paramInviter);
    }

    const paramGroupInviteId = parseGroupInviteIdFromParams(groupInviteParam);
    if (paramGroupInviteId) {
      setGroupInviteId(paramGroupInviteId);
    }
  }, [inviterParam, groupInviteParam]);

  useEffect(() => {
    let isMounted = true;

    Linking.getInitialURL()
      .then((url) => {
        if (!isMounted) return;

        const parsedInviter = parseInviterIdFromUrl(url);
        if (parsedInviter) {
          setInviterId(parsedInviter);
        }

        const parsedGroupInviteId = parseGroupInviteIdFromUrl(url);
        if (parsedGroupInviteId) {
          setGroupInviteId(parsedGroupInviteId);
        }
      })
      .catch((error) => {
        console.error('Failed to parse initial invite URL:', error);
      });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      const parsedInviter = parseInviterIdFromUrl(url);
      if (parsedInviter) {
        setInviterId(parsedInviter);
      }

      const parsedGroupInviteId = parseGroupInviteIdFromUrl(url);
      if (parsedGroupInviteId) {
        setGroupInviteId(parsedGroupInviteId);
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydratePendingGroupInvite = async () => {
      try {
        const pendingGroupInviteId = await consumePendingGroupInviteId();
        if (!isMounted || !pendingGroupInviteId) return;
        setGroupInviteId((prev) => prev || pendingGroupInviteId);
      } catch (error) {
        console.error('Failed to hydrate pending group invite:', error);
      }
    };

    hydratePendingGroupInvite();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    inviterId,
    groupInviteId,
    setGroupInviteId,
  };
};
