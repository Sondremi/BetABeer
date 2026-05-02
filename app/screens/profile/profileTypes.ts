import type { DrinkEntry } from '../../types/drinkTypes';

export type ProfileUserInfo = {
  name?: string;
  username?: string;
  weight?: number;
  gender?: 'male' | 'female';
  drinks?: DrinkEntry[];
  bacHighscoreAllTime?: number;
  bacHighscoreUpdatedAt?: number;
};
