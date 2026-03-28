import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/firebase/authService';
import { firestore } from '../services/firebase/FirebaseConfig';
import { sendGroupInvitation } from '../services/groupService';
import { acceptGroupInvitation, createGroup, declineGroupInvitation, profileService } from '../services/profileService';
import { profileChartConfig, profileChartDataset, profileScreenTokens, profileStyles } from '../styles/components/profileStyles';
import { globalStyles } from '../styles/globalStyles';
import { DrinkCategory, DrinkEntry, Group, GroupInvitation } from '../types/drinkTypes';
import { Friend } from '../types/userTypes';
import { defaultProfileImageMap, defaultProfileImages } from '../utils/defaultProfileImages';
import { showAlert } from '../utils/platformAlert';
const DefaultProfilePicture = require('../../assets/images/default/default_profilepicture.png');
const ImageMissing = require('../../assets/images/image_missing.png');
const SettingsIcon = require('../../assets/icons/noun-settings-2650525.png');
const FriendsIcon = require('../../assets/icons/noun-people-2196504.png');
const PencilIcon = require('../../assets/icons/noun-pencil-969012.png');

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
  consumedUntilTime: string;
};

type BACEstimatorDrinkOption = {
  key: string;
  label: string;
  template: Omit<DrinkEntry, 'timestamp' | 'quantity'>;
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
  consumedUntilTime: '',
});

const ProfileScreen: React.FC = () => {
  const { user, loading } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const [profileImageModalVisible, setProfileImageModalVisible] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [profileNameFocused, setProfileNameFocused] = useState(false);

  useEffect(() => {
    if (user && (user as any).profileImage) {
      setSelectedProfileImage((user as any).profileImage);
    }
  }, [user]);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);

  const handleProfileSave = async () => {
    if (!user) return;
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      showAlert('Feil', 'Name cannot be empty');
      return;
    }

    const payload: { name: string; profileImage?: string | null } = { name: trimmedName };
    if (selectedProfileImage) {
      payload.profileImage = selectedProfileImage;
    }

    try {
      await updateDoc(doc(firestore, 'users', user.id), payload);
      setProfileImageModalVisible(false);
    } catch (error) {
      console.error(error)
      showAlert('Feil', 'Could not update profile');
    }
  };
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [createGroupName, setCreateGroupName] = useState('');
  const [createGroupNameFocused, setCreateGroupNameFocused] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupInviteCandidates, setGroupInviteCandidates] = useState<Friend[]>([]);
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<string[]>([]);
  const [loadingGroupInviteCandidates, setLoadingGroupInviteCandidates] = useState(false);
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([]);
  const [handlingInvitation, setHandlingInvitation] = useState(false);
  const [userNames, setUserNames] = useState<{ [id: string]: string }>({});
  const [incomingFriendRequestCount, setIncomingFriendRequestCount] = useState(0);
  // Move Hook call to top level
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    username?: string;
    weight?: number;
    gender?: 'male' | 'female';
    drinks?: DrinkEntry[];
    bacHighscoreAllTime?: number;
    bacHighscoreUpdatedAt?: number;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [drinkModalVisible, setDrinkModalVisible] = useState(false);
  const [isBacExpanded, setIsBacExpanded] = useState(true);
  const [isInvitationsExpanded, setIsInvitationsExpanded] = useState(true);
  const [drinkForm, setDrinkForm] = useState<DrinkFormState>(() => createInitialDrinkForm());
  const [bacCalculationTime, setBacCalculationTime] = useState(() => Date.now());
  const [selectedEstimatorDrinkKey, setSelectedEstimatorDrinkKey] = useState<string>('');
  const currentBACValue = useMemo(() => {
    if (!userInfo.drinks || !userInfo.weight || !userInfo.gender) return 0;
    return profileService.calculateBAC(userInfo.drinks, userInfo.weight, userInfo.gender, bacCalculationTime);
  }, [userInfo.drinks, userInfo.weight, userInfo.gender, bacCalculationTime]);
  const currentBAC = currentBACValue.toFixed(3);
  const hasBacRequiredInfo = Boolean(userInfo.weight && userInfo.gender);
  const chartProjection = useMemo(() => {
    if (!userInfo.weight || !userInfo.gender || !userInfo.drinks || userInfo.drinks.length === 0) {
      return null;
    }

    const latestDrinkTimestamp = Math.max(...userInfo.drinks.map((d) => d.endTimestamp ?? d.timestamp));
    const fifteenMinuteMs = 15 * 60 * 1000;
    const points = Array.from({ length: 21 }, (_, i) => {
      const time = latestDrinkTimestamp + i * fifteenMinuteMs;
      const value = profileService.calculateBAC(userInfo.drinks!, userInfo.weight!, userInfo.gender!, time);
      return { time, value };
    });

    const fullLabels = points.map((point) => new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    // Keep x-axis readable on mobile by showing hourly clock labels.
    const labels = points.map((_, index) => {
      if (index === points.length - 2) return fullLabels[points.length - 1];
      if (index === points.length - 1) return '';
      if (index % 4 === 0) return fullLabels[index];
      return '';
    });
    const values = points.map((point) => point.value);
    const peak = Math.max(...values);
    const peakIndex = values.findIndex((value) => value === peak);

    let soberTimeLabel = '--:--';
    const soberWithinProjectionIndex = values.findIndex((value, index) => index > 0 && value <= 0.001);
    if (soberWithinProjectionIndex >= 0) {
      soberTimeLabel = fullLabels[soberWithinProjectionIndex];
    } else {
      const maxLookaheadSteps = Math.floor((24 * 60) / 15);
      for (let step = points.length; step <= maxLookaheadSteps; step += 1) {
        const time = latestDrinkTimestamp + step * fifteenMinuteMs;
        const value = profileService.calculateBAC(userInfo.drinks!, userInfo.weight!, userInfo.gender!, time);
        if (value <= 0.001) {
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
  }, [userInfo.drinks, userInfo.gender, userInfo.weight]);
  const chartWidth = useMemo(() => {
    const calculated = windowWidth - 116;

    // Keep current mobile behavior, but clamp harder on wider screens/web so chart never spills outside card padding.
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
      if (!user?.id || !userInfo.weight || !userInfo.gender) return;
      if (!userInfo.drinks?.length) return;
      if (currentBACValue <= 0) return;

      const existingHighscore = userInfo.bacHighscoreAllTime ?? 0;
      const epsilon = 0.0005;
      if (currentBACValue <= existingHighscore + epsilon) return;

      const roundedHighscore = Number(currentBACValue.toFixed(3));
      try {
        await profileService.updateBACHighscore(user.id, roundedHighscore);
        setUserInfo(prev => ({
          ...prev,
          bacHighscoreAllTime: roundedHighscore,
          bacHighscoreUpdatedAt: Date.now(),
        }));
      } catch (error) {
        console.error(error);
      }
    };

    persistHighscoreIfNeeded();
  }, [currentBACValue, user?.id, userInfo.weight, userInfo.gender, userInfo.drinks, userInfo.bacHighscoreAllTime]);

  useEffect(() => {
    if (!userInfo.drinks?.length || !userInfo.weight || !userInfo.gender) {
      return;
    }

    // Keep BAC display current as metabolism changes over time.
    const intervalId = setInterval(() => {
      setBacCalculationTime(Date.now());
    }, 15000);

    return () => clearInterval(intervalId);
  }, [userInfo.drinks, userInfo.weight, userInfo.gender]);

  useEffect(() => {
    if (!user) return;
    const groupQuery = query(collection(firestore, 'groups'), where('members', 'array-contains', user.id));
    const invitationQuery = query(
      collection(firestore, 'group_invitations'),
      where('toUserId', '==', user.id),
      where('status', '==', 'pending')
    );

    const unsubscribeGroups = onSnapshot(groupQuery, (groupSnapshot) => {
      const groupMap = new Map<string, Group>();
      const sortedGroupDocs = [...groupSnapshot.docs].sort((a, b) => {
        const aCreatedAt = a.data().createdAt?.toMillis?.() ?? 0;
        const bCreatedAt = b.data().createdAt?.toMillis?.() ?? 0;
        return bCreatedAt - aCreatedAt;
      });

      sortedGroupDocs.forEach((docSnap) => {
        const groupData = docSnap.data();
        groupMap.set(docSnap.id, {
          id: docSnap.id,
          name: groupData.name || groupData.groupName || groupData.group_name || 'Gruppenavn',
          memberCount: groupData.members?.length || 0,
          image: ImageMissing,
          createdBy: groupData.createdBy || '',
          members: groupData.members || [],
        });
      });
      setGroups(Array.from(groupMap.values()));
    });

    const unsubscribeInvitations = onSnapshot(invitationQuery, (snapshot) => {
      const invitationList = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          groupName: data.groupName || data.group_name || 'Group',
        };
      }) as GroupInvitation[];
      setGroupInvitations(invitationList);
    });

    return () => {
      unsubscribeGroups();
      unsubscribeInvitations();
    };
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setIncomingFriendRequestCount(0);
      return;
    }

    const incomingFriendRequestsQuery = query(
      collection(firestore, 'friendRequests'),
      where('toUserId', '==', user.id),
      where('status', '==', 'pending')
    );

    const unsubscribeIncomingFriendRequests = onSnapshot(incomingFriendRequestsQuery, (snapshot) => {
      setIncomingFriendRequestCount(snapshot.size);
    });

    return () => {
      unsubscribeIncomingFriendRequests();
    };
  }, [user?.id]);

  useEffect(() => {
    const fetchNames = async () => {
      if (!groupInvitations.length) return;
      const idsToFetch = groupInvitations
        .map(inv => inv.fromUserId)
        .filter(id => !(id in userNames));
      const newNames: { [id: string]: string } = {};
      await Promise.all(
        idsToFetch.map(async (id) => {
          const userDoc = await getDoc(doc(firestore, 'users', id));
          newNames[id] = userDoc.exists() ? userDoc.data().name || id : id;
        })
      );
      if (Object.keys(newNames).length > 0) {
        setUserNames(prev => ({ ...prev, ...newNames }));
      }
    };
    fetchNames();
  }, [groupInvitations, userNames]);

  const loadUserData = useCallback(async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const userData = await profileService.getUserData(currentUser.uid);
        setUserInfo(userData);

        if (!userData.weight || !userData.gender) {
          const alertStorageKey = `bacMissingInfoAlertShown:${currentUser.uid}`;
          const hasShownAlert = await AsyncStorage.getItem(alertStorageKey);

          if (!hasShownAlert) {
            showAlert(
              'Mangler informasjon',
              'Du må angi vekt og kjønn i innstillingene for å bruke promillekalkulatoren.',
              [
                {
                  text: 'Gå til innstillinger',
                  onPress: () => router.push('/settings'),
                },
                { text: 'Avbryt', style: 'cancel' },
              ]
            );
            await AsyncStorage.setItem(alertStorageKey, 'true');
          }
        }
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke laste brukerdata');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  useEffect(() => {
    if (userInfo.name) {
      setDisplayName(userInfo.name);
    }
  }, [userInfo.name]);

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

  const DRINK_NUMBER_PLACEHOLDER = 'Skriv verdi';
  const DRINK_TEXT_PLACEHOLDER = 'Skriv type/navn';

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

  const allowsEndTimeForSelection = (): boolean => {
    const sizeDl = resolveSelectedDrinkSizeDl();
    if (!sizeDl || !drinkForm.category) return false;
    if (drinkForm.category === 'vin') return sizeDl >= 7.5;
    if (drinkForm.category === 'sprit') return sizeDl >= 5;
    return sizeDl >= 5;
  };

  const validateCustomAlcoholPercent = () => {
    if (drinkForm.category === 'custom') return true;
    if (drinkForm.alcoholPercent !== 'custom') return true;
    const value = parseNumericInput(drinkForm.customAlcoholPercent);
    if (isNaN(value)) {
      showAlert('Feil', 'Ugyldig alkoholprosent');
      return false;
    }
    if (drinkForm.category === 'vin' && (value < 10 || value > 20)) {
      showAlert('Feil', 'Alkoholprosent for vin må være mellom 10 og 20');
      return false;
    }
    if (drinkForm.category === 'øl' && (value <= 0 || value > 20)) {
      showAlert('Feil', 'Alkoholprosent for øl må være mellom 0.1 og 20');
      return false;
    }
    if (drinkForm.category === 'sprit' && (value < 22 || value > 70)) {
      showAlert('Feil', 'Alkoholprosent for sprit må være mellom 22 og 70');
      return false;
    }
    return true;
  };

  const canSaveDrink = useMemo(() => {
    if (!drinkForm.category) return false;

    if (!isValidTimeInput(drinkForm.consumedAtTime)) return false;
    if (drinkForm.consumedUntilTime.trim()) {
      if (!allowsEndTimeForSelection()) return false;
      if (!isValidTimeInput(drinkForm.consumedUntilTime)) return false;
      const start = parseTimeToTimestamp(drinkForm.consumedAtTime);
      const end = parseTimeToTimestamp(drinkForm.consumedUntilTime);
      if (!start || !end || end < start) return false;
    }

    const quantityValue = drinkForm.quantity === 'custom'
      ? parseNumericInput(drinkForm.customQuantity)
      : Number(drinkForm.quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) return false;
    if (drinkForm.quantity === 'custom' && !hasMaxOneDecimal(drinkForm.customQuantity)) return false;

    if (drinkForm.category === 'custom') {
      if (!drinkForm.customDrinkName.trim()) return false;
      if (!drinkForm.sizeDl) return false;

      const sizeValue = drinkForm.sizeDl === 'custom'
        ? parseNumericInput(drinkForm.customSizeValue)
        : Number(drinkForm.sizeDl);
      const alcoholPercent = drinkForm.alcoholPercent === 'custom'
        ? parseNumericInput(drinkForm.customAlcoholPercentManual)
        : Number(drinkForm.alcoholPercent);

      if (isNaN(sizeValue) || sizeValue <= 0) return false;
      if (drinkForm.sizeDl === 'custom' && !hasMaxOneDecimal(drinkForm.customSizeValue)) return false;
      if (!drinkForm.alcoholPercent) return false;
      if (drinkForm.alcoholPercent === 'custom' && !hasMaxOneDecimal(drinkForm.customAlcoholPercentManual)) return false;
      if (isNaN(alcoholPercent) || alcoholPercent <= 0 || alcoholPercent > 100) return false;
      return true;
    }

    if (!drinkForm.sizeDl || !drinkForm.alcoholPercent) return false;

    if (drinkForm.sizeDl === 'custom') {
      const customSizeValue = parseNumericInput(drinkForm.customSizeValue);
      if (isNaN(customSizeValue) || customSizeValue <= 0) return false;
      if (!hasMaxOneDecimal(drinkForm.customSizeValue)) return false;
    }

    if (drinkForm.alcoholPercent === 'custom') {
      const value = parseNumericInput(drinkForm.customAlcoholPercent);
      if (!hasMaxOneDecimal(drinkForm.customAlcoholPercent)) return false;
      if (isNaN(value)) return false;
      if (drinkForm.category === 'vin' && (value < 10 || value > 20)) return false;
      if (drinkForm.category === 'sprit' && (value < 22 || value > 70)) return false;
      if (drinkForm.category === 'øl' && (value <= 0 || value > 20)) return false;
    }

    return true;
  }, [drinkForm]);

  const navigateToSettings = () => {
    router.push('/settings');
  };

  const navigateToFriends = () => {
    router.push('/friends');
  };

  const navigateToGroup = async (group: Group) => {
    try {
      await AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(group));
    } catch (error) {
      console.error('Error saving selected group:', error);
    }
    router.push({ pathname: '/groups', params: { selectedGroup: JSON.stringify(group) } });
  };

  const handleAddDrink = async () => {
    let drink: DrinkEntry;
    const quantity = drinkForm.quantity === 'custom'
      ? parseNumericInput(drinkForm.customQuantity)
      : parseFloat(String(drinkForm.quantity));

    if (isNaN(quantity) || quantity <= 0) {
      showAlert('Feil', 'Antall må være et tall større enn 0');
      return;
    }
    if (drinkForm.quantity === 'custom' && !hasMaxOneDecimal(drinkForm.customQuantity)) {
      showAlert('Feil', 'Antall kan ha maks ett desimal');
      return;
    }

    const startTimestamp = parseTimeToTimestamp(drinkForm.consumedAtTime);
    if (!startTimestamp) {
      showAlert('Feil', 'Ugyldig starttid. Bruk format HH:MM');
      return;
    }

    let endTimestamp: number | undefined;
    if (drinkForm.consumedUntilTime.trim()) {
      if (!allowsEndTimeForSelection()) {
        showAlert('Feil', 'Sluttid kan bare settes for store enheter');
        return;
      }
      const parsedEnd = parseTimeToTimestamp(drinkForm.consumedUntilTime);
      if (!parsedEnd) {
        showAlert('Feil', 'Ugyldig sluttid. Bruk format HH:MM');
        return;
      }
      if (parsedEnd < startTimestamp) {
        showAlert('Feil', 'Sluttid må være etter starttid');
        return;
      }
      endTimestamp = parsedEnd;
    }

    if (drinkForm.category !== 'custom') {
      if (!drinkForm.category) {
        showAlert('Feil', 'Velg en drikkekategori');
        return;
      }
      if (!drinkForm.sizeDl) {
        showAlert('Feil', 'Velg en størrelse');
        return;
      }
      if (!drinkForm.alcoholPercent) {
        showAlert('Feil', 'Velg en alkoholprosent');
        return;
      }
      if (!validateCustomAlcoholPercent()) {
        return;
      }

      let sizeDl: number;
      if (drinkForm.sizeDl === 'custom') {
        const customSizeValue = parseNumericInput(drinkForm.customSizeValue);
        if (isNaN(customSizeValue) || customSizeValue <= 0) {
          showAlert('Feil', 'Størrelse må være et tall større enn 0');
          return;
        }
        if (!hasMaxOneDecimal(drinkForm.customSizeValue)) {
          showAlert('Feil', 'Størrelse kan ha maks ett desimal');
          return;
        }
        sizeDl = convertSizeToDl(customSizeValue, drinkForm.sizeUnit);
      } else {
        sizeDl = parseFloat(drinkForm.sizeDl.toString());
      }

      const alcoholPercent =
        drinkForm.alcoholPercent === 'custom'
          ? parseNumericInput(drinkForm.customAlcoholPercent)
          : parseFloat(drinkForm.alcoholPercent.toString());

      drink = {
        category: drinkForm.category,
        sizeDl,
        alcoholPercent,
        quantity,
        timestamp: startTimestamp,
        endTimestamp,
      };
    } else {
      const trimmedName = drinkForm.customDrinkName.trim();
      if (!trimmedName) {
        showAlert('Feil', 'Type/navn er påkrevd for egendefinert kategori');
        return;
      }
      if (!drinkForm.sizeDl) {
        showAlert('Feil', 'Velg en størrelse');
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
        showAlert('Feil', 'Velg en alkoholprosent');
        return;
      }
      if (isNaN(alcoholPercent) || alcoholPercent <= 0 || alcoholPercent > 100) {
        showAlert('Feil', 'Alkoholprosent må være mellom 0 og 100');
        return;
      }
      if (isNaN(sizeValue) || sizeValue <= 0) {
        showAlert('Feil', 'Størrelse må være større enn 0');
        return;
      }
      if (drinkForm.sizeDl === 'custom' && !hasMaxOneDecimal(drinkForm.customSizeValue)) {
        showAlert('Feil', 'Størrelse kan ha maks ett desimal');
        return;
      }
      if (drinkForm.alcoholPercent === 'custom' && !hasMaxOneDecimal(drinkForm.customAlcoholPercentManual)) {
        showAlert('Feil', 'Alkoholprosent kan ha maks ett desimal');
        return;
      }

      drink = {
        name: trimmedName,
        category: inferCategoryFromAlcoholPercent(alcoholPercent),
        sizeDl,
        alcoholPercent,
        quantity,
        timestamp: startTimestamp,
        endTimestamp,
      };
    }

    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        await profileService.addDrink(currentUser.uid, drink);
        const updatedUserData = await profileService.getUserData(currentUser.uid);
        setUserInfo(updatedUserData);
      }
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke legge til drikke');
    }
    setDrinkModalVisible(false);
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
              const currentUser = authService.getCurrentUser();
              if (currentUser) {
                await profileService.resetDrinks(currentUser.uid);
                setUserInfo(prev => ({ ...prev, drinks: [] }));
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

  const handleCreateGroup = async () => {
    if (!user) return;
    const trimmedGroupName = createGroupName.trim();
    if (!trimmedGroupName) {
      showAlert('Feil', 'Gruppenavn kan ikke være tomt');
      return;
    }
    setCreatingGroup(true);
    try {
      const newGroup = await createGroup(user.id, trimmedGroupName);
      const groupWithImage: Group = { ...newGroup, image: ImageMissing };
      const inviteTargets = selectedInviteeIds.filter((inviteeId) => inviteeId !== user.id);
      const invitationResults = await Promise.allSettled(
        inviteTargets.map((inviteeId) => sendGroupInvitation(inviteeId, groupWithImage))
      );
      const failedInvitations = invitationResults.filter((result) => result.status === 'rejected').length;
      
      await AsyncStorage.setItem('lastSelectedGroup', JSON.stringify(groupWithImage));
      setCreateGroupName('');
      setSelectedInviteeIds([]);
      setCreateGroupModalVisible(false);

      if (failedInvitations > 0) {
        showAlert('Delvis fullført', `Gruppen ble opprettet, men ${failedInvitations} invitasjon(er) feilet.`);
      }
      
      router.push({ pathname: '/groups', params: { selectedGroup: JSON.stringify(groupWithImage) } });
    } catch (error) {
      console.error('Error creating group:', error);
      showAlert('Feil', 'Kunne ikke opprette gruppe');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAcceptInvitation = async (invitation: GroupInvitation) => {
    if (!user) return;
    setHandlingInvitation(true);
    try {
      await acceptGroupInvitation(invitation);
      setGroupInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showAlert('Feil', `Kunne ikke godta invitasjonen: ${(error as Error).message}`);
    } finally {
      setHandlingInvitation(false);
    }
  };

  const handleRejectInvitation = async (invitation: GroupInvitation) => {
    if (!user) return;
    setHandlingInvitation(true);
    try {
      await declineGroupInvitation(invitation.id);
      setGroupInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
    } catch (error) {
      console.error('Error declining invitation:', error);
      showAlert('Feil', 'Kunne ikke avslå invitasjonen');
    } finally {
      setHandlingInvitation(false);
    }
  };

  const loadGroupInviteCandidates = async () => {
    if (!user) {
      setGroupInviteCandidates([]);
      return;
    }

    setLoadingGroupInviteCandidates(true);
    try {
      const userSnap = await getDoc(doc(firestore, 'users', user.id));
      const friendIds = userSnap.exists() ? ((userSnap.data().friends || []) as string[]) : [];
      if (!friendIds.length) {
        setGroupInviteCandidates([]);
        return;
      }

      const friendSnaps = await Promise.all(friendIds.map((friendId) => getDoc(doc(firestore, 'users', friendId))));
      const friends = friendSnaps
        .filter((snap) => snap.exists())
        .map((snap) => {
          const data = snap.data();
          return {
            id: snap.id,
            name: data.name || 'Ukjent',
            username: data.username || 'ukjent',
            profilePicture: data.profileImage ? defaultProfileImageMap[data.profileImage] || DefaultProfilePicture : DefaultProfilePicture,
          } as Friend;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setGroupInviteCandidates(friends);
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke laste vennelisten');
      setGroupInviteCandidates([]);
    } finally {
      setLoadingGroupInviteCandidates(false);
    }
  };

  const toggleInvitee = (friendId: string) => {
    setSelectedInviteeIds((prev) => (
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    ));
  };

  useEffect(() => {
    if (!createGroupModalVisible) return;
    loadGroupInviteCandidates();
  }, [createGroupModalVisible, user?.id]);

  if (isLoading) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContent]}>
        <Text style={globalStyles.circularImage}>Laster...</Text>
      </View>
    );
  }

  const renderGroupItem = (item: Group) => (
    <TouchableOpacity style={profileStyles.groupItem} onPress={() => navigateToGroup(item)}>
      <Image source={item.image} style={globalStyles.groupHeaderImage} />
      <View style={globalStyles.overlay}>
        <Text style={profileStyles.groupName}>{item.name}</Text>
        <Text style={profileStyles.groupMembers}>{item.memberCount} medlemmer</Text>
      </View>
    </TouchableOpacity>
  );

  const renderInvitationItem = (item: GroupInvitation) => (
    <View style={[globalStyles.listItemRow, profileStyles.invitationItemRow]}>
      <View style={profileStyles.invitationInfo}>
        <Text style={globalStyles.modalText}>{item.groupName}</Text>
        <Text style={globalStyles.secondaryText}>Fra: {userNames[item.fromUserId] || item.fromUserId}</Text>
      </View>
      <View style={profileStyles.invitationActionRow}>
        <TouchableOpacity
          style={[globalStyles.selectionButton, profileStyles.invitationRejectButton, profileStyles.invitationAcceptButton]}
          onPress={() => handleRejectInvitation(item)}
          disabled={handlingInvitation}
        >
          <Text style={[globalStyles.selectionButtonText, profileStyles.invitationRejectButtonText]}>Avslå</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[globalStyles.selectionButton, profileStyles.invitationAcceptButton]}
          onPress={() => handleAcceptInvitation(item)}
          disabled={handlingInvitation}
        >
          <Text style={globalStyles.outlineButtonGoldText}>Godta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContent]}>
        <Text style={globalStyles.largeBoldText}>Laster...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        Platform.OS === 'web' ? globalStyles.containerWeb : globalStyles.container,
        profileStyles.pageContainer,
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={globalStyles.fullWidthScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile content */}
        <View style={[globalStyles.centeredSection, profileStyles.compactCenteredSection, profileStyles.heroSection]}>
          <View style={[globalStyles.premiumCard, profileStyles.profileHeroCard]}>
            <TouchableOpacity style={profileStyles.heroFriendsButton} onPress={navigateToFriends}>
              <Image source={FriendsIcon} style={profileStyles.heroFriendsIcon} />
              {incomingFriendRequestCount > 0 && (
                <View style={profileStyles.heroFriendsBadge}>
                  <Text style={profileStyles.heroFriendsBadgeText}>
                    {incomingFriendRequestCount > 9 ? '9+' : incomingFriendRequestCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={profileStyles.heroSettingsButton} onPress={navigateToSettings}>
              <Image source={SettingsIcon} style={globalStyles.primaryIcon} />
            </TouchableOpacity>
            {/* Profile picture */}
            <View style={profileStyles.profileImageContainer}>
              <Image
                source={
                  (selectedProfileImage && defaultProfileImageMap[selectedProfileImage])
                    ? defaultProfileImageMap[selectedProfileImage]
                    : (user && (user as any).profileImage && defaultProfileImageMap[(user as any).profileImage])
                      ? defaultProfileImageMap[(user as any).profileImage]
                      : DefaultProfilePicture
                }
                style={[globalStyles.circularImage, profileStyles.profileImage]}
              />
              <TouchableOpacity
                style={profileStyles.editProfileImageButton}
                onPress={() => setProfileImageModalVisible(true)}
              >
                <Image source={PencilIcon} style={globalStyles.primaryIcon} />
              </TouchableOpacity>
            </View>

            {/* Name and username */}
            <Text style={[globalStyles.largeBoldText, profileStyles.profileName]}>{user?.name || 'Navn'}</Text>
            <Text style={[globalStyles.secondaryText, profileStyles.profileUsername]}>{user?.username || 'Brukernavn'}</Text>
          </View>
        {/* Modal to change profilepicture */}
        <Modal
          visible={profileImageModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setProfileImageModalVisible(false)}
        >
          <View style={globalStyles.modalContainer}> 
            <View style={[globalStyles.modalContent, profileStyles.profileModalContent]}> 
              <Text style={globalStyles.modalTitle}>Velg profilbilde</Text>
              <ScrollView contentContainerStyle={profileStyles.profileModalGrid}>
                {defaultProfileImages.map((img) => (
                  <TouchableOpacity
                    key={img}
                    style={[
                      profileStyles.profileImageChoice,
                      selectedProfileImage === img && profileStyles.profileImageChoiceSelected,
                    ]}
                    onPress={() => setSelectedProfileImage(img)}
                  >
                    <Image
                      source={defaultProfileImageMap[img]}
                      style={profileStyles.profileImageChoiceImage}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={[globalStyles.inputGroup, profileStyles.profileNameGroup]}> 
                <Text style={globalStyles.label}>Navn</Text>
                <View style={[globalStyles.inputShellDark, profileNameFocused && globalStyles.inputShellFocusedGold]}>
                  <TextInput
                    style={[globalStyles.input, profileStyles.profileNameInput]}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Your name"
                    placeholderTextColor={profileScreenTokens.nameInputPlaceholderTextColor}
                    maxLength={40}
                    autoCapitalize="words"
                    onFocus={() => setProfileNameFocused(true)}
                    onBlur={() => setProfileNameFocused(false)}
                  />
                </View>
              </View>
              <View style={globalStyles.buttonRow}>
                <TouchableOpacity style={globalStyles.cancelButton} onPress={() => setProfileImageModalVisible(false)}>
                  <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={globalStyles.saveButton} onPress={handleProfileSave}>
                  <Text style={globalStyles.saveButtonTextAlt}>Lagre</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        </View>

        { /* Blood Alcohol Level */ }
        <View style={[globalStyles.section, profileStyles.compactSection]}>
          <View style={[globalStyles.premiumCard, profileStyles.sectionCard, profileStyles.sectionCardSpacing]}>
            <View style={[profileStyles.bacHeaderRow, !isBacExpanded && profileStyles.collapsedHeaderRow]}>
              <Text style={globalStyles.sectionTitleLeft}>Promillekalkulator</Text>
              <TouchableOpacity
                style={[globalStyles.outlineButtonGold, profileStyles.bacToggleButton]}
                onPress={() => setIsBacExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={isBacExpanded ? 'Minimer promillekalkulator' : 'Utvid promillekalkulator'}
              >
                <Text style={[globalStyles.outlineButtonGoldText, profileStyles.bacToggleButtonText]}>
                  {isBacExpanded ? '▾' : '▸'}
                </Text>
              </TouchableOpacity>
            </View>

            {isBacExpanded && (
              <View style={globalStyles.inputGroup}>
                <View style={profileStyles.bacActionRow}>
                  <TouchableOpacity
                    style={[globalStyles.primaryButtonShadow, profileStyles.bacActionButton, !hasBacRequiredInfo && globalStyles.disabledButton]}
                    onPress={() => setDrinkModalVisible(true)}
                    disabled={!hasBacRequiredInfo}
                  >
                    <Text style={[globalStyles.primaryButtonText, profileStyles.bacActionButtonText]}>Legg til drikke</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[globalStyles.dangerButton, profileStyles.bacResetButton, !hasBacRequiredInfo && globalStyles.disabledButton]}
                    onPress={handleResetDrinks}
                    disabled={!hasBacRequiredInfo}
                  >
                    <Text style={globalStyles.dangerButtonText}>Nullstill drikker</Text>
                  </TouchableOpacity>
                </View>
                {!hasBacRequiredInfo && (
                  <Text style={globalStyles.secondaryText}>
                    Sett vekt og kjønn i innstillinger for å bruke promillekalkulatoren.
                  </Text>
                )}
              </View>
            )}
            {isBacExpanded && chartProjection && (
              <View style={[globalStyles.inputGroup, profileStyles.chartCard]}>
                <Text style={globalStyles.sectionTitle}>Anslått promille de neste 5 timene</Text>
                <View style={profileStyles.chartSummaryRow}>
                  <View style={profileStyles.statPill}>
                    <Text style={profileStyles.statLabel}>Promille nå</Text>
                    <View style={profileStyles.statMainSlot}>
                      <Text style={profileStyles.statValue}>{currentBAC}‰</Text>
                    </View>
                  </View>
                  <View style={profileStyles.statPill}>
                    <Text style={profileStyles.statLabel}>Høyeste {chartProjection.peakTime}</Text>
                    <View style={profileStyles.statMainSlot}>
                      <Text style={profileStyles.statValue}>{chartProjection.peak.toFixed(3)}‰</Text>
                    </View>
                  </View>
                  <View style={profileStyles.statPill}>
                    <Text style={profileStyles.statLabel}>Edru kl</Text>
                    <View style={profileStyles.statMainSlot}>
                      <Text style={profileStyles.statValue}>{chartProjection.soberTime}</Text>
                    </View>
                  </View>
                </View>
                <View style={[profileStyles.chartInteractiveShell, { width: chartWidth }]}>
                  <LineChart
                    data={{
                      labels: chartProjection.labels,
                      datasets: [
                        { data: chartProjection.values, ...profileChartDataset },
                      ],
                    }}
                    width={chartWidth}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix="‰"
                    fromZero
                    chartConfig={profileChartConfig}
                    bezier
                    style={profileStyles.chart}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Group Invitations Section */}
        <View style={[globalStyles.section, profileStyles.compactSection]}>
          <View style={[globalStyles.premiumCard, profileStyles.sectionCard, profileStyles.sectionCardSpacing]}>
            <View style={[profileStyles.groupsHeader, !isInvitationsExpanded && profileStyles.collapsedHeaderRow]}>
              <Text style={globalStyles.sectionTitleLeft}>Gruppeinvitasjoner</Text>
              <TouchableOpacity
                style={[globalStyles.outlineButtonGold, profileStyles.bacToggleButton]}
                onPress={() => setIsInvitationsExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={isInvitationsExpanded ? 'Minimer gruppeinvitasjoner' : 'Utvid gruppeinvitasjoner'}
              >
                <Text style={[globalStyles.outlineButtonGoldText, profileStyles.bacToggleButtonText]}>
                  {isInvitationsExpanded ? '▾' : '▸'}
                </Text>
              </TouchableOpacity>
            </View>
            {isInvitationsExpanded && groupInvitations.length > 0 ? (
              <View style={[globalStyles.listContainer, profileStyles.listContainerCard]}>
                {groupInvitations.map((item) => (
                  <View key={`${item.id}_${item.groupId}`} style={profileStyles.invitationItemSpacing}>
                    {renderInvitationItem(item)}
                  </View>
                ))}
              </View>
            ) : isInvitationsExpanded ? (
              <Text style={globalStyles.emptyStateText}>Ingen invitasjoner</Text>
            ) : null}
          </View>
        </View>

        {/* Groups section */}
        <View style={profileStyles.groupsSection}>
          <View style={[globalStyles.premiumCard, profileStyles.sectionCard, profileStyles.sectionCardSpacing]}>
            <View style={profileStyles.groupsHeaderAction}>
              <Text style={globalStyles.sectionTitleLeft}>Mine grupper</Text>
              <TouchableOpacity
                style={[globalStyles.outlineButton, profileStyles.groupsHeaderActionButton]}
                onPress={() => {
                  setCreateGroupName('');
                  setSelectedInviteeIds([]);
                  setCreateGroupModalVisible(true);
                }}
                disabled={creatingGroup}
              >
                <Text
                  style={[globalStyles.outlineButtonGoldText, profileStyles.groupsHeaderActionButtonText]}
                  numberOfLines={1}
                >
                  {creatingGroup ? 'Oppretter...' : 'Opprett ny gruppe'}
                </Text>
              </TouchableOpacity>
            </View>
            <View>
              {Array.from({ length: Math.ceil(groups.length / 2) }, (_, rowIndex) => {
                const rowItems = groups.slice(rowIndex * 2, rowIndex * 2 + 2);
                return (
                  <View key={`group-row-${rowIndex}`} style={profileStyles.groupRow}>
                    {rowItems.map((item) => renderGroupItem(item))}
                    {rowItems.length === 1 && <View style={profileStyles.groupRowSpacer} />}
                  </View>
                );
              })}
            </View>
          </View>
          <Modal
            visible={createGroupModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => {
              setCreateGroupName('');
              setCreateGroupModalVisible(false);
            }}
          >
            <View style={globalStyles.modalContainer}>
              <View style={[globalStyles.modalContent, profileStyles.createGroupModalContent]}>
                <Text style={globalStyles.modalTitle}>Opprett gruppe</Text>
                <View style={globalStyles.inputGroup}>
                  <Text style={globalStyles.label}>Gruppenavn</Text>
                  <View style={profileStyles.createGroupRow}>
                    <View style={[globalStyles.inputShellDark, profileStyles.createGroupInputShell, createGroupNameFocused && globalStyles.inputShellFocusedGold]}>
                      <TextInput
                        placeholder="Skriv gruppenavn"
                        placeholderTextColor={profileScreenTokens.createGroupPlaceholderTextColor}
                        value={createGroupName}
                        onChangeText={setCreateGroupName}
                        style={[globalStyles.input, profileStyles.createGroupInput]}
                        maxLength={40}
                        onFocus={() => setCreateGroupNameFocused(true)}
                        onBlur={() => setCreateGroupNameFocused(false)}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        profileStyles.createGroupActionButton,
                        (!createGroupName.trim() || creatingGroup) && globalStyles.disabledButton,
                      ]}
                      onPress={handleCreateGroup}
                      disabled={creatingGroup || !createGroupName.trim()}
                    >
                      <Text style={profileStyles.createGroupActionButtonText}>Opprett</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={globalStyles.inputGroup}>
                  <Text style={globalStyles.label}>Inviter venner</Text>
                  {loadingGroupInviteCandidates ? (
                    <Text style={globalStyles.secondaryText}>Laster venner...</Text>
                  ) : groupInviteCandidates.length === 0 ? (
                    <Text style={globalStyles.secondaryText}>Du har ingen venner å invitere enda.</Text>
                  ) : (
                    <View>
                      <View style={profileStyles.inviteBulkActionsRow}>
                        <TouchableOpacity onPress={() => setSelectedInviteeIds(groupInviteCandidates.map((friend) => friend.id))}>
                          <Text style={profileStyles.inviteBulkActionText}>Velg alle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedInviteeIds([])}>
                          <Text style={profileStyles.inviteBulkActionText}>Fjern alle</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={profileStyles.inviteListBox}>
                        <ScrollView nestedScrollEnabled style={profileStyles.inviteListScroll} contentContainerStyle={profileStyles.inviteListScrollContent}>
                        {groupInviteCandidates.map((friend) => {
                          const selected = selectedInviteeIds.includes(friend.id);
                          return (
                            <TouchableOpacity
                              key={friend.id}
                              style={[profileStyles.inviteListRow, selected && profileStyles.inviteListRowSelected]}
                              onPress={() => toggleInvitee(friend.id)}
                            >
                              <Image source={friend.profilePicture} style={profileStyles.inviteListAvatar} />
                              <View style={profileStyles.inviteListInfo}>
                                <Text style={profileStyles.inviteListName}>{friend.name}</Text>
                                <Text style={globalStyles.secondaryText}>@{friend.username}</Text>
                              </View>
                              <Text style={[profileStyles.inviteStatusText, selected && profileStyles.inviteStatusTextSelected]}>
                                {selected ? 'Inviteres' : 'Trykk for å invitere'}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                        </ScrollView>
                      </View>
                    </View>
                  )}
                </View>
                <View style={globalStyles.editButtonsContainer}>
                  <TouchableOpacity onPress={() => {
                    setCreateGroupName('');
                    setSelectedInviteeIds([]);
                    setCreateGroupModalVisible(false);
                  }}>
                    <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <Modal
            visible={drinkModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setDrinkModalVisible(false)}
          >
            <View style={globalStyles.modalContainer}>
              <View style={[globalStyles.modalContent, profileStyles.drinkModalContent]}> 
                <Text style={[globalStyles.modalTitle, profileStyles.drinkModalTitle]}> 
                  Velg drikke
                </Text>

                <View style={profileStyles.drinkFormScrollBox}>
                  <ScrollView
                    style={profileStyles.drinkModalScroll}
                    contentContainerStyle={profileStyles.drinkModalScrollContent}
                    showsVerticalScrollIndicator
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >

                  <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                    <Text style={globalStyles.label}>Kategori</Text>
                    <View style={[globalStyles.pickerInput, profileStyles.pickerGlowShell]}>
                      <Picker
                        style={globalStyles.picker}
                        itemStyle={profileStyles.pickerItem}
                        selectedValue={drinkForm.category}
                        onValueChange={(value: DrinkCategory | 'custom' | '') =>
                          setDrinkForm({ ...createInitialDrinkForm(), category: value })
                        }
                      >
                        <Picker.Item label="Velg kategori" value="" />
                        <Picker.Item label="Øl / Cider / Selzer" value="øl" />
                        <Picker.Item label="Vin" value="vin" />
                        <Picker.Item label="Sprit" value="sprit" />
                        <Picker.Item label="Egendefinert" value="custom" />
                      </Picker>
                    </View>
                  </View>

                  {drinkForm.category && (
                    <>
                      {drinkForm.category !== 'custom' && (
                        <>
                          <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                            <Text style={globalStyles.label}>Størrelse</Text>
                            <View style={[globalStyles.pickerInput, profileStyles.pickerGlowShell]}>
                              <Picker
                                style={globalStyles.picker}
                                itemStyle={profileStyles.pickerItem}
                                selectedValue={drinkForm.sizeDl}
                                onValueChange={(value: number | '' | 'custom') => setDrinkForm({ ...drinkForm, sizeDl: value })}
                              >
                                <Picker.Item label="Velg størrelse" value="" />
                                {getSizeOptions(drinkForm.category).map(size => (
                                  <Picker.Item
                                    key={size}
                                    label={getSizeOptionLabel(drinkForm.category, size)}
                                    value={size}
                                  />
                                ))}
                              </Picker>
                            </View>
                          </View>

                          {drinkForm.sizeDl === 'custom' && (
                            <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}>
                              <Text style={globalStyles.label}>Størrelse</Text>
                              <View style={profileStyles.unitInputRow}>
                                <View style={[globalStyles.inputShellDark, profileStyles.unitInputShell, profileStyles.pickerGlowShell]}>
                                  <TextInput
                                      style={[globalStyles.input, profileStyles.compactNumberInput]}
                                    value={drinkForm.customSizeValue}
                                    onChangeText={(text) => setDrinkForm({ ...drinkForm, customSizeValue: text })}
                                      placeholder={DRINK_NUMBER_PLACEHOLDER}
                                    placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                                    keyboardType="decimal-pad"
                                  />
                                </View>
                                <View style={[globalStyles.pickerInput, profileStyles.unitPickerShell, profileStyles.pickerGlowShell]}>
                                  <Picker
                                    style={globalStyles.picker}
                                    itemStyle={profileStyles.pickerItem}
                                    selectedValue={drinkForm.sizeUnit}
                                    onValueChange={(value: 'cl' | 'dl' | 'l') => setDrinkForm({ ...drinkForm, sizeUnit: value })}
                                  >
                                    <Picker.Item label="cl" value="cl" />
                                    <Picker.Item label="dl" value="dl" />
                                    <Picker.Item label="l" value="l" />
                                  </Picker>
                                </View>
                              </View>
                            </View>
                          )}

                          <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                            <Text style={globalStyles.label}>Alkoholprosent</Text>
                            <View style={[globalStyles.pickerInput, profileStyles.pickerGlowShell]}>
                              <Picker
                                style={globalStyles.picker}
                                itemStyle={profileStyles.pickerItem}
                                selectedValue={drinkForm.alcoholPercent}
                                onValueChange={(value: number | '' | 'custom') =>
                                  setDrinkForm({ ...drinkForm, alcoholPercent: value, customAlcoholPercent: '' })
                                }
                              >
                                <Picker.Item label="Velg alkoholprosent" value="" />
                                {getAlcoholPercentOptions(drinkForm.category).map(percent => (
                                  <Picker.Item
                                    key={percent}
                                    label={percent === 'custom' ? 'Egendefinert' : `${percent}%`}
                                    value={percent}
                                  />
                                ))}
                              </Picker>
                            </View>
                          </View>

                          {drinkForm.alcoholPercent === 'custom' && (
                            <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                              <Text style={globalStyles.label}>Egendefinert alkoholprosent</Text>
                              <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                                <TextInput
                                  style={[globalStyles.input, profileStyles.compactNumberInput]}
                                  value={drinkForm.customAlcoholPercent}
                                  onChangeText={(text) => setDrinkForm({ ...drinkForm, customAlcoholPercent: text })}
                                  placeholder={DRINK_NUMBER_PLACEHOLDER}
                                  placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                                  keyboardType="decimal-pad"
                                />
                              </View>
                            </View>
                          )}

                          <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                        <Text style={globalStyles.label}>Antall</Text>
                        <View style={[globalStyles.pickerInput, profileStyles.pickerGlowShell]}>
                          <Picker
                            style={globalStyles.picker}
                            itemStyle={profileStyles.pickerItem}
                            selectedValue={drinkForm.quantity}
                            onValueChange={(value: number | '' | 'custom') => setDrinkForm({ ...drinkForm, quantity: value })}
                          >
                                <Picker.Item label="Velg antall" value="" />
                                <Picker.Item label="1" value={1} />
                                <Picker.Item label="2" value={2} />
                                <Picker.Item label="3" value={3} />
                                <Picker.Item label="Egendefinert" value={'custom'} />
                          </Picker>
                        </View>
                          </View>

                          {drinkForm.quantity === 'custom' && (
                            <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}>
                              <Text style={globalStyles.label}>Egendefinert antall</Text>
                              <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                                <TextInput
                                  style={[globalStyles.input, profileStyles.compactNumberInput]}
                                  value={drinkForm.customQuantity}
                                  onChangeText={(text) => setDrinkForm({ ...drinkForm, customQuantity: text })}
                                  placeholder={DRINK_NUMBER_PLACEHOLDER}
                                  placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                                  keyboardType="decimal-pad"
                                />
                              </View>
                            </View>
                          )}
                        </>
                      )}

                      {drinkForm.category === 'custom' && (
                        <>
                      <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                        <Text style={globalStyles.label}>Type/navn</Text>
                        <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                          <TextInput
                            style={[globalStyles.input, profileStyles.customAlcoholInput]}
                            value={drinkForm.customDrinkName}
                            onChangeText={(text) => setDrinkForm({ ...drinkForm, customDrinkName: text })}
                            placeholder={DRINK_TEXT_PLACEHOLDER}
                            placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                            maxLength={40}
                          />
                        </View>
                      </View>

                      <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                        <Text style={globalStyles.label}>Størrelse</Text>
                        <View style={[globalStyles.pickerInput, profileStyles.pickerGlowShell]}>
                          <Picker
                            style={globalStyles.picker}
                            itemStyle={profileStyles.pickerItem}
                            selectedValue={drinkForm.sizeDl}
                            onValueChange={(value: number | '' | 'custom') =>
                              setDrinkForm({ ...drinkForm, sizeDl: value, customSizeValue: '' })
                            }
                          >
                            <Picker.Item label="Velg størrelse" value="" />
                            {getCustomSizeOptions().map((size) => (
                              <Picker.Item
                                key={size}
                                label={getCustomSizeOptionLabel(size)}
                                value={size}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>

                      {drinkForm.sizeDl === 'custom' && (
                        <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}>
                          <Text style={globalStyles.label}>Egendefinert størrelse</Text>
                          <View style={profileStyles.unitInputRow}>
                            <View style={[globalStyles.inputShellDark, profileStyles.unitInputShell, profileStyles.pickerGlowShell]}>
                              <TextInput
                                style={[globalStyles.input, profileStyles.compactNumberInput]}
                                value={drinkForm.customSizeValue}
                                onChangeText={(text) => setDrinkForm({ ...drinkForm, customSizeValue: text })}
                                placeholder={DRINK_NUMBER_PLACEHOLDER}
                                placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                                keyboardType="decimal-pad"
                              />
                            </View>
                            <View style={[globalStyles.pickerInput, profileStyles.unitPickerShell, profileStyles.pickerGlowShell]}>
                              <Picker
                                style={globalStyles.picker}
                                itemStyle={profileStyles.pickerItem}
                                selectedValue={drinkForm.customSizeUnit}
                                onValueChange={(value: 'cl' | 'dl' | 'l') => setDrinkForm({ ...drinkForm, customSizeUnit: value })}
                              >
                                <Picker.Item label="cl" value="cl" />
                                <Picker.Item label="dl" value="dl" />
                                <Picker.Item label="l" value="l" />
                              </Picker>
                            </View>
                          </View>
                        </View>
                      )}

                      <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                        <Text style={globalStyles.label}>Alkoholprosent</Text>
                        <View style={[globalStyles.pickerInput, profileStyles.pickerGlowShell]}>
                          <Picker
                            style={globalStyles.picker}
                            itemStyle={profileStyles.pickerItem}
                            selectedValue={drinkForm.alcoholPercent}
                            onValueChange={(value: number | '' | 'custom') => setDrinkForm({ ...drinkForm, alcoholPercent: value, customAlcoholPercentManual: '' })}
                          >
                            <Picker.Item label="Velg alkoholprosent" value="" />
                            {getCustomAlcoholPercentOptions().map((percent) => (
                              <Picker.Item
                                key={percent}
                                label={percent === 'custom' ? 'Egendefinert' : `${percent}%`}
                                value={percent}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>

                      {drinkForm.alcoholPercent === 'custom' && (
                        <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}>
                          <Text style={globalStyles.label}>Egendefinert alkoholprosent</Text>
                          <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                            <TextInput
                              style={[globalStyles.input, profileStyles.compactNumberInput]}
                              value={drinkForm.customAlcoholPercentManual}
                              onChangeText={(text) => setDrinkForm({ ...drinkForm, customAlcoholPercentManual: text })}
                              placeholder={DRINK_NUMBER_PLACEHOLDER}
                              placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>
                      )}

                      <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}> 
                        <Text style={globalStyles.label}>Antall</Text>
                        <View style={[globalStyles.pickerInput, profileStyles.pickerGlowShell]}>
                          <Picker
                            style={globalStyles.picker}
                            itemStyle={profileStyles.pickerItem}
                            selectedValue={drinkForm.quantity}
                            onValueChange={(value: number | '' | 'custom') => setDrinkForm({ ...drinkForm, quantity: value })}
                          >
                            <Picker.Item label="Velg antall" value="" />
                            <Picker.Item label="1" value={1} />
                            <Picker.Item label="2" value={2} />
                            <Picker.Item label="3" value={3} />
                            <Picker.Item label="Egendefinert" value={'custom'} />
                          </Picker>
                        </View>
                      </View>

                      {drinkForm.quantity === 'custom' && (
                        <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}>
                          <Text style={globalStyles.label}>Egendefinert antall</Text>
                          <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                            <TextInput
                              style={[globalStyles.input, profileStyles.compactNumberInput]}
                              value={drinkForm.customQuantity}
                              onChangeText={(text) => setDrinkForm({ ...drinkForm, customQuantity: text })}
                              placeholder={DRINK_NUMBER_PLACEHOLDER}
                              placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>
                      )}
                        </>
                      )}
                    </>
                  )}

                  {drinkForm.category && (
                    <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}>
                      <Text style={globalStyles.label}>Tidspunkt drukket (start)</Text>
                      <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                        <TextInput
                          style={[globalStyles.input, profileStyles.compactNumberInput]}
                          value={drinkForm.consumedAtTime}
                          onChangeText={(text) => setDrinkForm({ ...drinkForm, consumedAtTime: text })}
                          placeholder="HH:MM"
                          placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>
                    </View>
                  )}

                  {drinkForm.category && allowsEndTimeForSelection() && (
                    <View style={[globalStyles.inputGroup, profileStyles.pickerGroupCompact]}>
                      <Text style={globalStyles.label}>Sluttidspunkt (valgfritt)</Text>
                      <View style={[globalStyles.inputShellDark, profileStyles.pickerGlowShell]}>
                        <TextInput
                          style={[globalStyles.input, profileStyles.compactNumberInput]}
                          value={drinkForm.consumedUntilTime}
                          onChangeText={(text) => setDrinkForm({ ...drinkForm, consumedUntilTime: text })}
                          placeholder="HH:MM"
                          placeholderTextColor={profileScreenTokens.customAlcoholPlaceholderTextColor}
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>
                    </View>
                  )}

                  </ScrollView>
                </View>
                <View style={profileStyles.drinkModalActions}>
                  <View style={globalStyles.buttonRow}>
                    <TouchableOpacity
                      style={globalStyles.cancelButton}
                      onPress={() => setDrinkModalVisible(false)}
                    >
                      <Text style={globalStyles.cancelButtonText}>Avbryt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[globalStyles.saveButton, !canSaveDrink && globalStyles.disabledButton]}
                      onPress={handleAddDrink}
                      disabled={!canSaveDrink}
                    >
                      <Text style={globalStyles.saveButtonTextAlt}>Lagre</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;