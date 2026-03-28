import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const GROUP_INVITE_PARAM = 'groupInvite';
const PENDING_GROUP_INVITE_STORAGE_KEY = 'pendingGroupInviteId';

const getSingleParamValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    const firstValue = value[0];
    return typeof firstValue === 'string' ? firstValue.trim() || null : null;
  }
  if (typeof value === 'string') {
    return value.trim() || null;
  }
  return null;
};

export const parseGroupInviteIdFromUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const inviteId = parsedUrl.searchParams.get(GROUP_INVITE_PARAM);
    return inviteId?.trim() || null;
  } catch {
    const match = url.match(/[?&]groupInvite=([^&]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]).trim() : null;
  }
};

export const parseGroupInviteIdFromParams = (value: string | string[] | undefined): string | null => {
  return getSingleParamValue(value);
};

export const buildGroupInviteLink = (groupId: string): string => {
  const encodedGroupId = encodeURIComponent(groupId);
  return `http://bet-a-beer.netlify.app/login?groupInvite=${encodedGroupId}`;
};

export const setPendingGroupInviteId = async (groupId: string): Promise<void> => {
  const trimmedGroupId = String(groupId || '').trim();
  if (!trimmedGroupId) return;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(PENDING_GROUP_INVITE_STORAGE_KEY, trimmedGroupId);
    return;
  }

  await AsyncStorage.setItem(PENDING_GROUP_INVITE_STORAGE_KEY, trimmedGroupId);
};

export const consumePendingGroupInviteId = async (): Promise<string | null> => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const pendingId = window.localStorage.getItem(PENDING_GROUP_INVITE_STORAGE_KEY);
    if (!pendingId) return null;
    window.localStorage.removeItem(PENDING_GROUP_INVITE_STORAGE_KEY);
    return pendingId;
  }

  const pendingId = await AsyncStorage.getItem(PENDING_GROUP_INVITE_STORAGE_KEY);
  if (!pendingId) return null;
  await AsyncStorage.removeItem(PENDING_GROUP_INVITE_STORAGE_KEY);
  return pendingId;
};
