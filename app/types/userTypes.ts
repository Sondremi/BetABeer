import { Friend } from '../services/firebase/friendService';

export type FriendWithPending = Friend & { type?: 'friend' | 'pending'; requestId?: string };

export type Gender = 'male' | 'female';
