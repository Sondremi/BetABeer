import type { ImageSourcePropType } from 'react-native';
import { defaultProfileImageMap } from './defaultProfileImages';

const DefaultProfilePicture = require('../../assets/images/default/default_profilepicture.png');

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

export const resolveProfileImageSource = (
  profileImageValue?: string | null,
  fallback: ImageSourcePropType = DefaultProfilePicture
): ImageSourcePropType => {
  if (!profileImageValue) return fallback;

  if (defaultProfileImageMap[profileImageValue]) {
    return defaultProfileImageMap[profileImageValue];
  }

  if (isHttpUrl(profileImageValue)) {
    return { uri: profileImageValue };
  }

  return fallback;
};

export const isDefaultProfileImageKey = (value?: string | null) => {
  if (!value) return false;
  return Boolean(defaultProfileImageMap[value]);
};

export const getDefaultProfilePicture = () => DefaultProfilePicture;
