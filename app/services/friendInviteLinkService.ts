const FRIEND_INVITE_PARAM = 'inviter';

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

export const parseInviterIdFromUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const inviterId = parsedUrl.searchParams.get(FRIEND_INVITE_PARAM);
    return inviterId?.trim() || null;
  } catch {
    const match = url.match(/[?&]inviter=([^&]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]).trim() : null;
  }
};

export const parseInviterIdFromParams = (value: string | string[] | undefined): string | null => {
  return getSingleParamValue(value);
};

export const buildFriendInviteLink = (inviterId?: string | null): string => {
  const baseUrl = 'http://bet-a-beer.netlify.app/login';
  const trimmedInviterId = String(inviterId || '').trim();

  if (!trimmedInviterId) {
    return baseUrl;
  }

  return `${baseUrl}?${FRIEND_INVITE_PARAM}=${encodeURIComponent(trimmedInviterId)}`;
};
