import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { authService } from '../../../services/firebase/authService';
import { firestore } from '../../../services/firebase/FirebaseConfig';
import type { Gender } from '../../../types/userTypes';
import { showAlert } from '../../../utils/platformAlert';
import type { SettingsUserInfo } from '../types';

type FallbackUser = {
  email?: string;
  name?: string;
  username?: string;
};

type UseSettingsUserDataParams = {
  fallbackUser?: FallbackUser | null;
};

const EMPTY_SETTINGS_USER_INFO: SettingsUserInfo = {
  id: '',
  username: '',
  name: '',
  email: '',
  weight: undefined,
  gender: undefined,
};

export const useSettingsUserData = ({ fallbackUser }: UseSettingsUserDataParams) => {
  const [userInfo, setUserInfo] = useState<SettingsUserInfo>(EMPTY_SETTINGS_USER_INFO);
  const [editedInfo, setEditedInfo] = useState<SettingsUserInfo>(EMPTY_SETTINGS_USER_INFO);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const loadUserData = useCallback(async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return;

      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData) {
          const userInfoData: SettingsUserInfo = {
            id: currentUser.uid,
            username: userData.username || fallbackUser?.username || '',
            name: userData.name || fallbackUser?.name || '',
            email: userData.email || currentUser.email || fallbackUser?.email || '',
            weight: typeof userData.weight === 'number' ? userData.weight : undefined,
            gender: userData.gender === 'male' || userData.gender === 'female' ? (userData.gender as Gender) : undefined,
          };
          setUserInfo(userInfoData);
          setEditedInfo(userInfoData);
          setIsEmailVerified(Boolean(currentUser.emailVerified));
          return;
        }
      }

      const fallbackUserInfo: SettingsUserInfo = {
        id: currentUser.uid,
        username: fallbackUser?.username || '',
        name: fallbackUser?.name || '',
        email: currentUser.email || fallbackUser?.email || '',
        weight: undefined,
        gender: undefined,
      };
      setUserInfo(fallbackUserInfo);
      setEditedInfo(fallbackUserInfo);
      setIsEmailVerified(Boolean(currentUser.emailVerified));
    } catch (error) {
      console.error(error);
      showAlert('Feil', 'Kunne ikke laste brukerdata');
    } finally {
      setIsLoading(false);
    }
  }, [fallbackUser?.email, fallbackUser?.name, fallbackUser?.username]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  return {
    userInfo,
    setUserInfo,
    editedInfo,
    setEditedInfo,
    isLoading,
    setIsLoading,
    isEmailVerified,
    setIsEmailVerified,
    loadUserData,
  };
};
