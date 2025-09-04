export interface Friend {
  id: string;
  name: string;
  username: string;
  profilePicture: any;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'accepted' | 'pending' | 'declined';
  createdAt: any;
  fromUserName?: string;
  fromUsername?: string;
  fromUserProfileImage?: string;
  name?: string;
  username?: string;
  profilePicture?: any;
}

export type FriendWithPending = Friend & {
  type?: 'friend' | 'pending';
  requestId?: string;
  fromUserName?: string;
  fromUsername?: string;
  fromUserProfileImage?: string;
};

export type Gender = 'male' | 'female';
