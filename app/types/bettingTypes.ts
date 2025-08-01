export type DrinkType = 'Øl' | 'Cider' | 'Hard selzer' | 'Vin' | 'Sprit';
export type MeasureType = 'Slurker' | 'Shot' | 'Chug';

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  senderId: string;
  receiverId: string;
  status: 'accepted' | 'pending' | 'declined';
  createdAt: any;
}

export interface BetWager {
  userId: string;
  username: string;
  optionId: string;
  drinkType: DrinkType;
  measureType: MeasureType;
  amount: number;
  timestamp: number;
}

export interface BettingOption {
  id: string;
  name: string;
  odds: number;
}

export interface Bet {
  id: string;
  title: string;
  options: BettingOption[];
  wagers?: BetWager[];
  correctOptionId?: string;
  isFinished?: boolean;
}

export interface MemberDrinkStats {
  userId: string;
  username: string;
  wins: number;
  drinksToConsume: { [key in DrinkType]?: { [key in MeasureType]?: number } };
  drinksToDistribute: { [key in DrinkType]?: { [key in MeasureType]?: number } };
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  profilePicture: any;
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  image: any;
  createdBy: string;
  members: string[];
}