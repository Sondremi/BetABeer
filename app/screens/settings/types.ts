import type { Gender } from '../../types/userTypes';

export type SettingsUserInfo = {
  id: string;
  username: string;
  name: string;
  email: string;
  weight: number | undefined;
  gender: Gender | undefined;
};

export type SettingsFocusedField = '' | 'name' | 'email' | 'weight';
