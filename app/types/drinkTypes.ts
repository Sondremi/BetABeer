// Drink and betting related types

export type DrinkCategory = 'øl' | 'vin' | 'sprit';
export type DrinkType = 'Øl' | 'Cider' | 'Hard selzer' | 'Vin' | 'Sprit';
export type MeasureType = 'Slurker' | 'Shot' | 'Chug';

export interface DrinkEntry {
  category: DrinkCategory;
  sizeDl: number;
  alcoholPercent: number;
  quantity: number;
  timestamp: number; // Unix timestamp
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
}

export interface Bet {
  id: string;
  title: string;
  options: BettingOption[];
  wagers?: BetWager[];
  correctOptionId?: string;
  isFinished?: boolean;
}

export interface DrinkTransaction {
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  drinkType: DrinkType;
  measureType: MeasureType;
  amount: number;
  source: 'bet' | 'distribution';
  timestamp: number;
}

export interface MemberDrinkStats {
  userId: string;
  username: string;
  wins: number;
  profilePicture: any;
  totalDrinksReceived: number;
  totalDrinksLost: number;
  drinksToConsume: { [key in DrinkType]?: { [key in MeasureType]?: number } };
  drinksToDistribute: { [key in DrinkType]?: { [key in MeasureType]?: number } };
  transactions: DrinkTransaction[];
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  image: any;
  createdBy: string;
  members: string[];
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  fromUserId: string;
  toUserId: string;
  status: 'accepted' | 'pending' | 'declined';
  createdAt: any;
}