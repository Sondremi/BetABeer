import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { authService } from '../../../services/firebase/authService';
import { profileService } from '../../../services/profileService';
import type { DrinkCategory, DrinkEntry } from '../../../types/drinkTypes';
import { INPUT_LIMITS, isNumberInRange, normalizeSingleLineText } from '../../../utils/inputValidation';
import { showAlert } from '../../../utils/platformAlert';
import type { ProfileUserInfo } from '../profileTypes';

type DrinkFormState = {
  category: DrinkCategory | 'custom' | '';
  sizeDl: number | '' | 'custom';
  sizeUnit: 'cl' | 'dl' | 'l';
  alcoholPercent: number | '' | 'custom';
  quantity: number | '' | 'custom';
  customAlcoholPercent: string;
  customDrinkName: string;
  customSizeValue: string;
  customSizeUnit: 'cl' | 'dl' | 'l';
  customAlcoholPercentManual: string;
  customQuantity: string;
  consumedAtTime: string;
  hasEndTime: boolean;
  consumedUntilTime: string;
};

type BACEstimatorDrinkOption = {
  key: string;
  label: string;
  template: Omit<DrinkEntry, 'timestamp' | 'quantity'>;
};

type UseProfileBacParams = {
  userId?: string;
  userInfo: ProfileUserInfo;
  setUserInfo: React.Dispatch<React.SetStateAction<ProfileUserInfo>>;
  windowWidth: number;
};

const normalizeDrinkCategory = (category: unknown, alcoholPercent?: number): DrinkCategory => {
  if (typeof category === 'string') {
    const normalized = category.trim().toLowerCase();

    if (['øl', 'ol', 'beer', 'cider', 'selzer', 'seltzer', 'hard selzer', 'hard seltzer'].includes(normalized)) {
      return 'øl';
    }
    if (['vin', 'wine'].includes(normalized)) {
      return 'vin';
    }
    if (['sprit', 'spirit', 'liquor', 'shot', 'shots', 'drink'].includes(normalized)) {
      return 'sprit';
    }
  }

  if (typeof alcoholPercent === 'number') {
    if (alcoholPercent < 8) return 'øl';
    if (alcoholPercent < 22) return 'vin';
  }

  return 'sprit';
};

const resolveDrinkTimestamp = (drink: DrinkEntry): number => {
  const rawTimestamp = drink.endTimestamp ?? drink.timestamp;
  return Number.isFinite(rawTimestamp) ? rawTimestamp : 0;
};

const getCurrentTimeInput = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const createInitialDrinkForm = (): DrinkFormState => ({
  category: '',
  sizeDl: '',
  sizeUnit: 'dl',
  alcoholPercent: '',
  quantity: '',
  customAlcoholPercent: '',
  customDrinkName: '',
  customSizeValue: '',
  customSizeUnit: 'dl',
  customAlcoholPercentManual: '',
  customQuantity: '',
  consumedAtTime: getCurrentTimeInput(),
  hasEndTime: false,
  consumedUntilTime: '',
});

const parseNumericInput = (value: string): number => parseFloat(value.replace(',', '.'));
const hasMaxOneDecimal = (value: string): boolean => /^\d+(?:[.,]\d{1})?$/.test(value.trim());
const isValidTimeInput = (value: string): boolean => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());

const parseTimeToTimestamp = (timeValue: string): number | null => {
  if (!isValidTimeInput(timeValue)) return null;
  const [hours, minutes] = timeValue.split(':').map((part) => parseInt(part, 10));
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};

const getTimeParts = (timeValue: string) => {
  if (!isValidTimeInput(timeValue)) return { hour: '00', minute: '00' };
  const [hour, minute] = timeValue.split(':');
  return { hour, minute };
};

const updateTimeValue = (timeValue: string, nextPart: 'hour' | 'minute', nextValue: string) => {
  const { hour, minute } = getTimeParts(timeValue);
  const resolvedHour = nextPart === 'hour' ? nextValue : hour;
  const resolvedMinute = nextPart === 'minute' ? nextValue : minute;
  return `${resolvedHour}:${resolvedMinute}`;
};

const getSizeOptions = (category: DrinkCategory | '') => {
  switch (category) {
    case 'øl':
      return [3.3, 4, 5, 'custom'] as const;
    case 'vin':
      return [1.2, 7.5, 'custom'] as const;
    case 'sprit':
      return [0.2, 0.4, 5, 'custom'] as const;
    default:
      return [] as const;
  }
};

const getSizeOptionLabel = (category: DrinkCategory | 'custom' | '', size: number | 'custom') => {
  if (size === 'custom') return 'Egendefinert';
  if (category === 'øl') {
    if (size === 3.3) return '0,33 L';
    if (size === 4) return '0,4 L';
    if (size === 5) return '0,5 L';
  }
  if (category === 'vin') {
    if (size === 1.2) return '12 cl (Glass)';
    if (size === 7.5) return '0,75 L';
  }
  if (category === 'sprit') {
    if (size === 0.2) return '2 cl';
    if (size === 0.4) return '4 cl';
    if (size === 5) return '5 dl';
  }

  return `${size} dl`;
};

const getAlcoholPercentOptions = (category: DrinkCategory | '') => {
  switch (category) {
    case 'øl':
      return [4.7, 'custom'];
    case 'vin':
      return [10, 12, 14, 'custom'];
    case 'sprit':
      return [22, 40, 60, 'custom'];
    default:
      return [];
  }
};

const getCustomSizeOptions = () => [3.3, 4, 5, 1.2, 7.5, 0.2, 0.4, 'custom'] as const;

const getCustomSizeOptionLabel = (size: number | 'custom') => {
  if (size === 'custom') return 'Egendefinert';
  if (size === 3.3) return '0,33 L';
  if (size === 4) return '0,4 L';
  if (size === 5) return '0,5 L / 5 dl';
  if (size === 1.2) return '12 cl (Glass)';
  if (size === 7.5) return '0,75 L';
  if (size === 0.2) return '2 cl';
  if (size === 0.4) return '4 cl';
  return `${size} dl`;
};

const getCustomAlcoholPercentOptions = () => [4.7, 12, 22, 40, 'custom'] as const;

const inferCategoryFromAlcoholPercent = (alcoholPercent: number): DrinkCategory => {
  if (alcoholPercent < 8) return 'øl';
  if (alcoholPercent < 22) return 'vin';
  return 'sprit';
};

const convertSizeToDl = (value: number, unit: 'cl' | 'dl' | 'l') => {
  if (unit === 'cl') return value / 10;
  if (unit === 'l') return value * 10;
  return value;
};

export const useProfileBac = ({ userId, userInfo, setUserInfo, windowWidth }: UseProfileBacParams) => {
  const [drinkModalVisible, setDrinkModalVisible] = useState(false);
  const [showDrinkValidationHint, setShowDrinkValidationHint] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [resettingBacHighscore, setResettingBacHighscore] = useState(false);
  const [drinkForm, setDrinkForm] = useState<DrinkFormState>(() => createInitialDrinkForm());
  const [bacCalculationTime, setBacCalculationTime] = useState(() => Date.now());
  const [selectedEstimatorDrinkKey, setSelectedEstimatorDrinkKey] = useState<string>('');
  const [hasHydratedExpandedState, setHasHydratedExpandedState] = useState(false);
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  const soberBacThreshold = 0.2;
  const bacExpandedStorageKey = userId ? `profileBacExpanded:${userId}` : null;

  useEffect(() => {
    let isMounted = true;

    const hydrateBacExpandedState = async () => {
      if (!bacExpandedStorageKey) {
        if (isMounted) setHasHydratedExpandedState(true);
        return;
      }

      try {
        const storedValue = await AsyncStorage.getItem(bacExpandedStorageKey);
        if (!isMounted) return;
        if (storedValue != null) {
          setIsExpanded(storedValue === 'true');
        }
      } catch (error) {
        console.error('Failed to hydrate BAC expanded state:', error);
      } finally {
        if (isMounted) setHasHydratedExpandedState(true);
      }
    };

    hydrateBacExpandedState();

    return () => {
      isMounted = false;
    };
  }, [bacExpandedStorageKey]);

  useEffect(() => {
    const persistBacExpandedState = async () => {
      if (!bacExpandedStorageKey || !hasHydratedExpandedState) return;

      try {
        await AsyncStorage.setItem(bacExpandedStorageKey, String(isExpanded));
      } catch (error) {
        console.error('Failed to persist BAC expanded state:', error);
      }
    };

    persistBacExpandedState();
  }, [bacExpandedStorageKey, hasHydratedExpandedState, isExpanded]);

  const currentBACValue = useMemo(() => {
    if (!userInfo.drinks || !userInfo.weight || !userInfo.gender) return 0;
    return profileService.calculateBAC(userInfo.drinks, userInfo.weight, userInfo.gender, bacCalculationTime);
  }, [userInfo.drinks, userInfo.weight, userInfo.gender, bacCalculationTime]);

  const roundedCurrentBACValue = Number(currentBACValue.toFixed(3));
  const currentBAC = roundedCurrentBACValue.toFixed(3);

  const hasBacRequiredInfo = useMemo(
    () => typeof userInfo.weight === 'number' && userInfo.weight > 0 && Boolean(userInfo.gender),
    [userInfo.weight, userInfo.gender]
  );

  const chartProjection = useMemo(() => {
    if (!userInfo.weight || !userInfo.gender || !userInfo.drinks || userInfo.drinks.length === 0) {
      return null;
    }

    const latestDrinkTimestamp = Math.max(...userInfo.drinks.map((d) => d.endTimestamp ?? d.timestamp));
    if (bacCalculationTime - latestDrinkTimestamp >= twentyFourHoursMs) {
      return null;
    }

    if (roundedCurrentBACValue <= 0) {
      return null;
    }

    const fifteenMinuteMs = 15 * 60 * 1000;
    const points = Array.from({ length: 13 }, (_, i) => {
      const time = bacCalculationTime + i * fifteenMinuteMs;
      const value = profileService.calculateBAC(userInfo.drinks!, userInfo.weight!, userInfo.gender!, time);
      return { time, value };
    });

    const fullLabels = points.map((point) => new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const labels = points.map((_, index) => {
      if (index === points.length - 2) return fullLabels[points.length - 1];
      if (index === points.length - 1) return '';
      if (index % 4 === 0) return fullLabels[index];
      return '';
    });
    const values = points.map((point) => point.value);
    const peak = Math.max(...values);
    const peakIndex = values.findIndex((value) => value === peak);
    const soberSearchStartIndex = Math.max(1, peakIndex + 1);

    let soberTimeLabel = '--:--';
    const soberWithinProjectionIndex = values.findIndex(
      (value, index) => index >= soberSearchStartIndex && value <= soberBacThreshold
    );
    if (soberWithinProjectionIndex >= 0) {
      soberTimeLabel = fullLabels[soberWithinProjectionIndex];
    } else {
      const maxLookaheadSteps = Math.floor((24 * 60) / 15);
      const lookaheadStartStep = Math.max(points.length, soberSearchStartIndex);
      for (let step = lookaheadStartStep; step <= maxLookaheadSteps; step += 1) {
        const time = latestDrinkTimestamp + step * fifteenMinuteMs;
        const value = profileService.calculateBAC(userInfo.drinks!, userInfo.weight!, userInfo.gender!, time);
        if (value <= soberBacThreshold) {
          soberTimeLabel = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          break;
        }
      }
    }

    return {
      labels,
      values,
      peak,
      peakTime: peakIndex >= 0 ? fullLabels[peakIndex] : '--:--',
      soberTime: soberTimeLabel,
      endBAC: values[values.length - 1] ?? 0,
    };
  }, [userInfo.drinks, userInfo.gender, userInfo.weight, bacCalculationTime, twentyFourHoursMs, soberBacThreshold, roundedCurrentBACValue]);

  const chartWidth = useMemo(() => {
    const calculated = windowWidth - 116;

    const maxWidth = Platform.OS === 'web' || windowWidth >= 768 ? 372 : 440;
    return Math.max(280, Math.min(calculated, maxWidth));
  }, [windowWidth]);

  const estimatorDrinkOptions = useMemo<BACEstimatorDrinkOption[]>(() => {
    const drinks = userInfo.drinks || [];
    const unique = new Map<string, BACEstimatorDrinkOption>();

    drinks.forEach((drink) => {
      const namePart = drink.name?.trim() || '';
      const key = `${namePart}|${drink.category}|${drink.sizeDl}|${drink.alcoholPercent}`;
      if (unique.has(key)) return;

      const baseLabel = `${drink.sizeDl} dl ${drink.category} (${drink.alcoholPercent}%)`;
      const label = namePart ? `${namePart} - ${baseLabel}` : baseLabel;

      unique.set(key, {
        key,
        label,
        template: {
          name: namePart || undefined,
          category: drink.category,
          sizeDl: drink.sizeDl,
          alcoholPercent: drink.alcoholPercent,
        },
      });
    });

    return Array.from(unique.values());
  }, [userInfo.drinks]);

  useEffect(() => {
    if (!estimatorDrinkOptions.length) {
      setSelectedEstimatorDrinkKey('');
      return;
    }

    const selectionStillExists = estimatorDrinkOptions.some((option) => option.key === selectedEstimatorDrinkKey);
    if (!selectedEstimatorDrinkKey || !selectionStillExists) {
      setSelectedEstimatorDrinkKey(estimatorDrinkOptions[0].key);
    }
  }, [estimatorDrinkOptions, selectedEstimatorDrinkKey]);

  const selectedEstimatorOption = useMemo(
    () => estimatorDrinkOptions.find((option) => option.key === selectedEstimatorDrinkKey),
    [estimatorDrinkOptions, selectedEstimatorDrinkKey]
  );

  const latestDrinkEntry = useMemo(() => {
    if (!userInfo.drinks?.length) return null;

    return userInfo.drinks.reduce<DrinkEntry | null>((latest, drink) => {
      const currentTimestamp = resolveDrinkTimestamp(drink);
      const latestTimestamp = latest ? resolveDrinkTimestamp(latest) : Number.NEGATIVE_INFINITY;

      if (currentTimestamp <= latestTimestamp) {
        return latest;
      }

      return {
        ...drink,
        category: normalizeDrinkCategory((drink as DrinkEntry & { category?: unknown }).category, drink.alcoholPercent),
      };
    }, null);
  }, [userInfo.drinks]);

  const latestDrinkLabel = useMemo(() => {
    if (!latestDrinkEntry) return 'Ingen tidligere drikke registrert';
    const namePrefix = latestDrinkEntry.name?.trim() ? `${latestDrinkEntry.name} - ` : '';
    return `${namePrefix}${latestDrinkEntry.sizeDl} dl ${latestDrinkEntry.category} (${latestDrinkEntry.alcoholPercent}%)`;
  }, [latestDrinkEntry]);

  const highscoreUpdatedLabel = useMemo(() => {
    if (!userInfo.bacHighscoreUpdatedAt) return 'Ikke satt';
    const updatedAt = new Date(userInfo.bacHighscoreUpdatedAt);
    const day = updatedAt.getDate().toString().padStart(2, '0');
    const month = (updatedAt.getMonth() + 1).toString().padStart(2, '0');
    const year = updatedAt.getFullYear();
    const time = updatedAt.toLocaleTimeString('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${day}.${month}.${year} kl: ${time}`;
  }, [userInfo.bacHighscoreUpdatedAt]);

  const canResetBacHighscore = (userInfo.bacHighscoreAllTime ?? 0) > 0 && !resettingBacHighscore;

  const estimatedAdditionalDrinksToBeatHighscore = useMemo(() => {
    if (!userInfo.drinks?.length || !userInfo.weight || !userInfo.gender) {
      return null;
    }

    const highscore = userInfo.bacHighscoreAllTime ?? 0;
    if (highscore <= 0 || !selectedEstimatorOption) {
      return null;
    }

    const now = bacCalculationTime;
    const threshold = highscore + 0.0005;
    const timeStepMs = 5 * 60 * 1000;
    const horizonMs = 6 * 60 * 60 * 1000;

    const getProjectedPeakBAC = (drinks: DrinkEntry[]) => {
      let peak = 0;
      for (let offset = 0; offset <= horizonMs; offset += timeStepMs) {
        const pointInTime = now + offset;
        const bac = profileService.calculateBAC(drinks, userInfo.weight!, userInfo.gender!, pointInTime);
        if (bac > peak) {
          peak = bac;
        }
      }
      return peak;
    };

    const baselinePeak = getProjectedPeakBAC(userInfo.drinks);
    if (baselinePeak > threshold) {
      return 0;
    }

    const maxAdditionalServings = 50;
    for (let servings = 1; servings <= maxAdditionalServings; servings += 1) {
      const addedDrinks: DrinkEntry[] = Array.from({ length: servings }, () => ({
        ...selectedEstimatorOption.template,
        quantity: 1,
        timestamp: now,
      }));

      const projectedPeak = getProjectedPeakBAC([...userInfo.drinks, ...addedDrinks]);
      if (projectedPeak > threshold) {
        return servings;
      }
    }

    return null;
  }, [
    userInfo.drinks,
    userInfo.weight,
    userInfo.gender,
    userInfo.bacHighscoreAllTime,
    selectedEstimatorOption,
    bacCalculationTime,
  ]);

  useEffect(() => {
    const persistHighscoreIfNeeded = async () => {
      if (!userId || !userInfo.weight || !userInfo.gender) return;
      if (!userInfo.drinks?.length) return;
      if (currentBACValue <= 0) return;

      const existingHighscore = userInfo.bacHighscoreAllTime ?? 0;
      const epsilon = 0.0005;
      if (currentBACValue <= existingHighscore + epsilon) return;

      const roundedHighscore = Number(currentBACValue.toFixed(3));
      try {
        await profileService.updateBACHighscore(userId, roundedHighscore);
        setUserInfo((prev) => ({
          ...prev,
          bacHighscoreAllTime: roundedHighscore,
          bacHighscoreUpdatedAt: Date.now(),
        }));
      } catch (error) {
        console.error(error);
      }
    };

    persistHighscoreIfNeeded();
  }, [currentBACValue, userId, userInfo.weight, userInfo.gender, userInfo.drinks, userInfo.bacHighscoreAllTime, setUserInfo]);

  useEffect(() => {
    if (userInfo.drinks?.length) {
      setBacCalculationTime(Date.now());
    }
  }, [userInfo.drinks]);

  useEffect(() => {
    if (!userInfo.drinks?.length || !userInfo.weight || !userInfo.gender) {
      return;
    }

    const intervalId = setInterval(() => {
      setBacCalculationTime(Date.now());
    }, 15000);

    return () => clearInterval(intervalId);
  }, [userInfo.drinks, userInfo.weight, userInfo.gender]);

  useEffect(() => {
    const clearExpiredDrinks = async () => {
      if (!userId || !userInfo.drinks?.length) return;

      const latestDrinkTimestamp = Math.max(...userInfo.drinks.map((d) => d.endTimestamp ?? d.timestamp));
      if (bacCalculationTime - latestDrinkTimestamp < twentyFourHoursMs) return;

      try {
        await profileService.resetDrinks(userId);
        setUserInfo((prev) => ({ ...prev, drinks: [] }));
      } catch (error) {
        console.error(error);
      }
    };

    clearExpiredDrinks();
  }, [userId, userInfo.drinks, bacCalculationTime, twentyFourHoursMs, setUserInfo]);

  const resolveSelectedDrinkSizeDl = (): number | null => {
    if (drinkForm.category === 'custom') {
      if (drinkForm.sizeDl && drinkForm.sizeDl !== 'custom') {
        return Number(drinkForm.sizeDl);
      }
      const customValue = parseNumericInput(drinkForm.customSizeValue);
      if (isNaN(customValue) || customValue <= 0) return null;
      return convertSizeToDl(customValue, drinkForm.customSizeUnit);
    }
    if (drinkForm.sizeDl === 'custom') {
      const customValue = parseNumericInput(drinkForm.customSizeValue);
      if (isNaN(customValue) || customValue <= 0) return null;
      return convertSizeToDl(customValue, drinkForm.sizeUnit);
    }
    if (typeof drinkForm.sizeDl === 'number') return drinkForm.sizeDl;
    return null;
  };

  const resolveSelectedAlcoholPercent = (): number | null => {
    if (!drinkForm.category || !drinkForm.alcoholPercent) return null;

    if (drinkForm.category === 'custom') {
      const value = drinkForm.alcoholPercent === 'custom'
        ? parseNumericInput(drinkForm.customAlcoholPercentManual)
        : Number(drinkForm.alcoholPercent);
      return Number.isFinite(value) ? value : null;
    }

    const value = drinkForm.alcoholPercent === 'custom'
      ? parseNumericInput(drinkForm.customAlcoholPercent)
      : Number(drinkForm.alcoholPercent);
    return Number.isFinite(value) ? value : null;
  };

  const getRecommendedQuantityOptions = (): number[] => {
    if (!drinkForm.category) return [1, 2, 3];

    const alcoholPercent = resolveSelectedAlcoholPercent();
    const sizeDl = resolveSelectedDrinkSizeDl();
    let maxRecommended = 6;

    if (drinkForm.category === 'sprit') maxRecommended = 3;
    if (drinkForm.category === 'vin') maxRecommended = 4;
    if (drinkForm.category === 'øl') maxRecommended = 8;

    if (alcoholPercent !== null) {
      if (alcoholPercent >= 40) maxRecommended = Math.min(maxRecommended, 2);
      else if (alcoholPercent >= 22) maxRecommended = Math.min(maxRecommended, 3);
      else if (alcoholPercent >= 10) maxRecommended = Math.min(maxRecommended, 5);
    }

    if (sizeDl !== null) {
      if (sizeDl >= 7.5) maxRecommended = Math.min(maxRecommended, 2);
      else if (sizeDl >= 5) maxRecommended = Math.min(maxRecommended, 3);
      else if (sizeDl >= 3.3) maxRecommended = Math.min(maxRecommended, 5);
    }

    const cappedMax = Math.max(1, Math.min(maxRecommended, INPUT_LIMITS.drinkQuantityMax));
    return Array.from({ length: cappedMax }, (_, index) => index + 1);
  };

  const allowsEndTimeForSelection = (): boolean => {
    const sizeDl = resolveSelectedDrinkSizeDl();
    if (!sizeDl || !drinkForm.category) return false;
    if (drinkForm.category === 'vin') return sizeDl >= 7.5;
    if (drinkForm.category === 'sprit') return sizeDl >= 5;
    return sizeDl >= 5;
  };

  const endTimeAllowed = allowsEndTimeForSelection();

  const validateCustomAlcoholPercent = () => {
    if (drinkForm.category === 'custom') return true;
    if (drinkForm.alcoholPercent !== 'custom') return true;
    const value = parseNumericInput(drinkForm.customAlcoholPercent);
    if (isNaN(value)) {
      return false;
    }
    if (drinkForm.category === 'vin' && (value < 10 || value > 20)) {
      return false;
    }
    if (drinkForm.category === 'øl' && (value <= 0 || value > 20)) {
      return false;
    }
    if (drinkForm.category === 'sprit' && (value < 22 || value > 70)) {
      return false;
    }
    return true;
  };

  const drinkValidationMessage = useMemo(() => {
    if (!drinkForm.category) return 'Velg type drikke først.';

    if (!isValidTimeInput(drinkForm.consumedAtTime)) return 'Velg gyldig starttid.';
    if (drinkForm.hasEndTime) {
      if (!endTimeAllowed) return 'Sluttid kan bare brukes for store enheter.';
      if (!isValidTimeInput(drinkForm.consumedUntilTime)) return 'Velg gyldig sluttid.';
      const start = parseTimeToTimestamp(drinkForm.consumedAtTime);
      const end = parseTimeToTimestamp(drinkForm.consumedUntilTime);
      if (!start || !end || end < start) return 'Sluttid må være etter starttid.';
    }

    const quantityValue = drinkForm.quantity === 'custom'
      ? parseNumericInput(drinkForm.customQuantity)
      : Number(drinkForm.quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) return 'Antall må være større enn 0.';
    if (!isNumberInRange(quantityValue, 0.1, INPUT_LIMITS.drinkQuantityMax)) {
      return `Antall må være mellom 0.1 og ${INPUT_LIMITS.drinkQuantityMax}.`;
    }
    if (drinkForm.quantity === 'custom' && !hasMaxOneDecimal(drinkForm.customQuantity)) {
      return 'Antall kan ha maks ett desimal.';
    }

    if (drinkForm.category === 'custom') {
      if (!drinkForm.sizeDl) return 'Velg størrelse.';
      if (!drinkForm.alcoholPercent) return 'Velg alkoholprosent.';

      const sizeValue = drinkForm.sizeDl === 'custom'
        ? parseNumericInput(drinkForm.customSizeValue)
        : Number(drinkForm.sizeDl);
      const resolvedSizeDl = drinkForm.sizeDl === 'custom'
        ? convertSizeToDl(sizeValue, drinkForm.customSizeUnit)
        : sizeValue;
      const alcoholPercent = drinkForm.alcoholPercent === 'custom'
        ? parseNumericInput(drinkForm.customAlcoholPercentManual)
        : Number(drinkForm.alcoholPercent);

      if (isNaN(sizeValue) || sizeValue <= 0) return 'Størrelse må være større enn 0.';
      if (drinkForm.sizeDl === 'custom' && !hasMaxOneDecimal(drinkForm.customSizeValue)) {
        return 'Størrelse kan ha maks ett desimal.';
      }
      if (!isNumberInRange(resolvedSizeDl, 0.1, INPUT_LIMITS.drinkSizeDlMax)) {
        return `Størrelse må være realistisk (maks ${INPUT_LIMITS.drinkSizeDlMax} liter).`;
      }
      if (drinkForm.alcoholPercent === 'custom' && !hasMaxOneDecimal(drinkForm.customAlcoholPercentManual)) {
        return 'Alkoholprosent kan ha maks ett desimal.';
      }
      if (!isNumberInRange(alcoholPercent, INPUT_LIMITS.drinkAlcoholPercentMin, INPUT_LIMITS.drinkAlcoholPercentMax)) {
        return `Alkoholprosent må være mellom ${INPUT_LIMITS.drinkAlcoholPercentMin} og ${INPUT_LIMITS.drinkAlcoholPercentMax}.`;
      }
      return null;
    }

    if (!drinkForm.sizeDl) return 'Velg størrelse.';
    if (!drinkForm.alcoholPercent) return 'Velg alkoholprosent.';

    if (drinkForm.sizeDl === 'custom') {
      const customSizeValue = parseNumericInput(drinkForm.customSizeValue);
      const resolvedSizeDl = convertSizeToDl(customSizeValue, drinkForm.sizeUnit);
      if (isNaN(customSizeValue) || customSizeValue <= 0) return 'Størrelse må være større enn 0.';
      if (!hasMaxOneDecimal(drinkForm.customSizeValue)) return 'Størrelse kan ha maks ett desimal.';
      if (!isNumberInRange(resolvedSizeDl, 0.1, INPUT_LIMITS.drinkSizeDlMax)) {
        return `Størrelse må være realistisk (maks ${INPUT_LIMITS.drinkSizeDlMax} liter).`;
      }
    }

    if (drinkForm.alcoholPercent === 'custom') {
      const value = parseNumericInput(drinkForm.customAlcoholPercent);
      if (!hasMaxOneDecimal(drinkForm.customAlcoholPercent)) return 'Alkoholprosent kan ha maks ett desimal.';
      if (isNaN(value)) return 'Ugyldig alkoholprosent.';
      if (!isNumberInRange(value, INPUT_LIMITS.drinkAlcoholPercentMin, INPUT_LIMITS.drinkAlcoholPercentMax)) {
        return `Alkoholprosent må være mellom ${INPUT_LIMITS.drinkAlcoholPercentMin} og ${INPUT_LIMITS.drinkAlcoholPercentMax}.`;
      }
      if (drinkForm.category === 'vin' && (value < 10 || value > 20)) return 'Alkoholprosent for vin må være mellom 10 og 20.';
      if (drinkForm.category === 'sprit' && (value < 22 || value > 70)) return 'Alkoholprosent for sprit må være mellom 22 og 70.';
      if (drinkForm.category === 'øl' && (value <= 0 || value > 20)) return 'Alkoholprosent for øl må være mellom 0.1 og 20.';
    }

    return null;
  }, [drinkForm, endTimeAllowed]);

  const canSaveDrink = drinkValidationMessage === null;

  useEffect(() => {
    if (!endTimeAllowed && (drinkForm.hasEndTime || drinkForm.consumedUntilTime)) {
      setDrinkForm((prev) => ({ ...prev, hasEndTime: false, consumedUntilTime: '' }));
    }
  }, [endTimeAllowed, drinkForm.hasEndTime, drinkForm.consumedUntilTime]);

  const resolveCurrentUserId = () => userId ?? authService.getCurrentUser()?.uid;

  const refreshUserInfo = async (currentUserId: string) => {
    const updatedUserData = await profileService.getUserData(currentUserId);
    setUserInfo(updatedUserData);
    setBacCalculationTime(Date.now());
  };

  const handleAddDrink = async () => {
    if (drinkValidationMessage) {
      setShowDrinkValidationHint(true);
      return;
    }

    let drink: DrinkEntry;
    const quantity = drinkForm.quantity === 'custom'
      ? parseNumericInput(drinkForm.customQuantity)
      : parseFloat(String(drinkForm.quantity));

    if (isNaN(quantity) || quantity <= 0) {
      return;
    }
    if (!isNumberInRange(quantity, 0.1, INPUT_LIMITS.drinkQuantityMax)) {
      return;
    }
    if (drinkForm.quantity === 'custom' && !hasMaxOneDecimal(drinkForm.customQuantity)) {
      return;
    }

    const startTimestamp = parseTimeToTimestamp(drinkForm.consumedAtTime);
    if (!startTimestamp) {
      return;
    }

    let endTimestamp: number | undefined;
    if (drinkForm.hasEndTime) {
      if (!allowsEndTimeForSelection()) {
        return;
      }
      const parsedEnd = parseTimeToTimestamp(drinkForm.consumedUntilTime);
      if (!parsedEnd) {
        return;
      }
      if (parsedEnd < startTimestamp) {
        return;
      }
      endTimestamp = parsedEnd;
    }

    if (drinkForm.category !== 'custom') {
      if (!drinkForm.category) {
        return;
      }
      if (!drinkForm.sizeDl) {
        return;
      }
      if (!drinkForm.alcoholPercent) {
        return;
      }
      if (!validateCustomAlcoholPercent()) {
        return;
      }

      let sizeDl: number;
      if (drinkForm.sizeDl === 'custom') {
        const customSizeValue = parseNumericInput(drinkForm.customSizeValue);
        if (isNaN(customSizeValue) || customSizeValue <= 0) {
          return;
        }
        if (!hasMaxOneDecimal(drinkForm.customSizeValue)) {
          return;
        }
        sizeDl = convertSizeToDl(customSizeValue, drinkForm.sizeUnit);
      } else {
        sizeDl = parseFloat(drinkForm.sizeDl.toString());
      }

      if (!isNumberInRange(sizeDl, 0.1, INPUT_LIMITS.drinkSizeDlMax)) {
        return;
      }

      const alcoholPercent =
        drinkForm.alcoholPercent === 'custom'
          ? parseNumericInput(drinkForm.customAlcoholPercent)
          : parseFloat(drinkForm.alcoholPercent.toString());

      if (!isNumberInRange(alcoholPercent, INPUT_LIMITS.drinkAlcoholPercentMin, INPUT_LIMITS.drinkAlcoholPercentMax)) {
        return;
      }

      drink = {
        category: drinkForm.category,
        sizeDl,
        alcoholPercent,
        quantity,
        timestamp: startTimestamp,
        ...(typeof endTimestamp === 'number' ? { endTimestamp } : {}),
      };
    } else {
      const trimmedName = normalizeSingleLineText(drinkForm.customDrinkName);
      if (trimmedName.length > INPUT_LIMITS.drinkNameMax) {
        return;
      }
      if (!drinkForm.sizeDl) {
        return;
      }

      const sizeValue = drinkForm.sizeDl === 'custom'
        ? parseNumericInput(drinkForm.customSizeValue)
        : Number(drinkForm.sizeDl);
      const alcoholPercent = drinkForm.alcoholPercent === 'custom'
        ? parseNumericInput(drinkForm.customAlcoholPercentManual)
        : parseFloat(String(drinkForm.alcoholPercent));
      const sizeDl = drinkForm.sizeDl === 'custom'
        ? convertSizeToDl(sizeValue, drinkForm.customSizeUnit)
        : Number(drinkForm.sizeDl);

      if (!drinkForm.alcoholPercent) {
        return;
      }
      if (!isNumberInRange(alcoholPercent, INPUT_LIMITS.drinkAlcoholPercentMin, INPUT_LIMITS.drinkAlcoholPercentMax)) {
        return;
      }
      if (isNaN(sizeValue) || sizeValue <= 0) {
        return;
      }
      if (!isNumberInRange(sizeValue, 0.1, INPUT_LIMITS.drinkSizeDlMax * 10)) {
        return;
      }
      if (drinkForm.sizeDl === 'custom' && !hasMaxOneDecimal(drinkForm.customSizeValue)) {
        return;
      }
      if (drinkForm.alcoholPercent === 'custom' && !hasMaxOneDecimal(drinkForm.customAlcoholPercentManual)) {
        return;
      }
      if (!isNumberInRange(sizeDl, 0.1, INPUT_LIMITS.drinkSizeDlMax)) {
        return;
      }

      drink = {
        ...(trimmedName ? { name: trimmedName } : {}),
        category: inferCategoryFromAlcoholPercent(alcoholPercent),
        sizeDl,
        alcoholPercent,
        quantity,
        timestamp: startTimestamp,
        ...(typeof endTimestamp === 'number' ? { endTimestamp } : {}),
      };
    }

    try {
      const currentUserId = resolveCurrentUserId();
      if (currentUserId) {
        await profileService.addDrink(currentUserId, drink);
        await refreshUserInfo(currentUserId);
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke legge til drikke');
    }
    setDrinkModalVisible(false);
    setShowDrinkValidationHint(false);
    setDrinkForm(createInitialDrinkForm());
  };

  const handleResetDrinks = () => {
    showAlert(
      'Nullstill drikker',
      'Er du sikker på at du vil slette alle registrerte drikker?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Nullstill',
          style: 'destructive',
          async onPress() {
            try {
              const currentUserId = resolveCurrentUserId();
              if (currentUserId) {
                await profileService.resetDrinks(currentUserId);
                setUserInfo((prev) => ({ ...prev, drinks: [] }));
              }
            } catch (error) {
              console.error(error);
              showAlert('Feil', 'Kunne ikke nullstille drikker');
            }
          },
        },
      ]
    );
  };

  const handleResetBacHighscore = () => {
    if (!canResetBacHighscore) return;

    showAlert(
      'Nullstill promille-highscore',
      'Er du sikker på at du vil nullstille promille-highscore?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Nullstill',
          style: 'destructive',
          async onPress() {
            if (!userId) return;
            setResettingBacHighscore(true);
            try {
              await profileService.resetBACHighscore(userId);
              setUserInfo((prev) => ({
                ...prev,
                bacHighscoreAllTime: 0,
                bacHighscoreUpdatedAt: undefined,
              }));
            } catch (error) {
              console.error(error);
              showAlert('Feil', 'Kunne ikke nullstille promille-highscore');
            } finally {
              setResettingBacHighscore(false);
            }
          },
        },
      ]
    );
  };

  const handleAddLatestDrinkAgain = async () => {
    if (!latestDrinkEntry) {
      return;
    }

    try {
      const currentUserId = resolveCurrentUserId();
      if (!currentUserId) return;

      const drink: DrinkEntry = {
        ...(latestDrinkEntry.name ? { name: latestDrinkEntry.name } : {}),
        category: normalizeDrinkCategory(latestDrinkEntry.category, latestDrinkEntry.alcoholPercent),
        sizeDl: latestDrinkEntry.sizeDl,
        alcoholPercent: latestDrinkEntry.alcoholPercent,
        quantity: 1,
        timestamp: Date.now(),
      };

      await profileService.addDrink(currentUserId, drink);
      await refreshUserInfo(currentUserId);
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke registrere siste drikke');
    }
  };

  const openDrinkModal = () => {
    setShowDrinkValidationHint(false);
    setDrinkModalVisible(true);
  };

  const closeDrinkModal = () => {
    setShowDrinkValidationHint(false);
    setDrinkModalVisible(false);
  };

  const resetDrinkFormForCategory = (category: DrinkCategory | 'custom') => {
    setDrinkForm({ ...createInitialDrinkForm(), category });
  };

  return {
    isExpanded,
    hasHydratedExpandedState,
    toggleExpanded: () => setIsExpanded((prev) => !prev),
    hasBacRequiredInfo,
    currentBAC,
    chartProjection,
    chartWidth,
    latestDrinkEntry,
    latestDrinkLabel,
    highscoreUpdatedLabel,
    canResetBacHighscore,
    resettingBacHighscore,
    estimatedAdditionalDrinksToBeatHighscore,
    estimatorDrinkOptions,
    selectedEstimatorDrinkKey,
    setSelectedEstimatorDrinkKey,
    drinkModalVisible,
    showDrinkValidationHint,
    drinkValidationMessage,
    canSaveDrink,
    drinkForm,
    setDrinkForm,
    endTimeAllowed,
    openDrinkModal,
    closeDrinkModal,
    resetDrinkFormForCategory,
    handleAddDrink,
    handleResetDrinks,
    handleResetBacHighscore,
    handleAddLatestDrinkAgain,
    getSizeOptions,
    getSizeOptionLabel,
    getAlcoholPercentOptions,
    getCustomSizeOptions,
    getCustomSizeOptionLabel,
    getCustomAlcoholPercentOptions,
    getRecommendedQuantityOptions,
    getTimeParts,
    updateTimeValue,
  };
};
