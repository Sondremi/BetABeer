export type DrinkCategory = 'øl' | 'vin' | 'sprit';
export interface DrinkEntry {
  category: DrinkCategory;
  sizeDl: number;
  alcoholPercent: number;
  quantity: number;
  timestamp: number; // Unix timestamp
}