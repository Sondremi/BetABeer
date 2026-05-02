export const INPUT_LIMITS = {
  groupNameMax: 40,
  betTitleMax: 80,
  betOptionNameMax: 40,
  betOptionCountMax: 8,
  betAmountMin: 1,
  betAmountMax: 50,
  profileNameMax: 40,
  usernameMin: 3,
  usernameMax: 24,
  friendSearchMax: 24,
  emailMax: 254,
  passwordMin: 6,
  passwordMax: 128,
  weightMinKg: 30,
  weightMaxKg: 150,
  drinkNameMax: 40,
  drinkQuantityMax: 20,
  drinkSizeDlMax: 10,
  drinkAlcoholPercentMin: 0.1,
  drinkAlcoholPercentMax: 100,
} as const;

export const normalizeSingleLineText = (value: string): string => {
  return String(value || '').replace(/\s+/g, ' ').trim();
};

export const isIntInRange = (value: number, min: number, max: number): boolean => {
  return Number.isInteger(value) && value >= min && value <= max;
};

export const isNumberInRange = (value: number, min: number, max: number): boolean => {
  return Number.isFinite(value) && value >= min && value <= max;
};

export const hasLengthInRange = (value: string, min: number, max: number): boolean => {
  const len = normalizeSingleLineText(value).length;
  return len >= min && len <= max;
};

export const clampDigits = (value: string, maxLen: number): string => {
  return String(value || '').replace(/[^0-9]/g, '').slice(0, maxLen);
};

export const isValidEmailFormat = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(value || '').trim());
};
