import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../../styles/theme';
import { profileStyles } from '../../../styles/components/profileStyles';
import { globalStyles } from '../../../styles/globalStyles';

const FriendsIcon = require('../../../../assets/icons/noun-people-2196504.png');
const SettingsIcon = require('../../../../assets/icons/noun-settings-2650525.png');
const PencilIcon = require('../../../../assets/icons/noun-pencil-969012.png');

type ProfileHeaderSectionProps = {
  displayName: string;
  username: string;
  profileImageSource: any;
  incomingFriendRequestCount: number;
  unreadNotificationCount: number;
  onNavigateToSettings: () => void;
  onNavigateToFriends: () => void;
  onOpenImageModal: () => void;
  onOpenOnboarding: () => void;
  onOpenNotifications: () => void;
};

const ProfileHeaderSection = ({
  displayName,
  username,
  profileImageSource,
  incomingFriendRequestCount,
  unreadNotificationCount,
  onNavigateToSettings,
  onNavigateToFriends,
  onOpenImageModal,
  onOpenOnboarding,
  onOpenNotifications,
}: ProfileHeaderSectionProps) => {
  const safeTop = Platform.OS === 'web' ? ('max(env(safe-area-inset-top), 30px)' as unknown as number) : undefined;
  return (
  <View style={[globalStyles.centeredSection, profileStyles.compactCenteredSection, profileStyles.heroSection, safeTop !== undefined && { paddingTop: safeTop }]}>
    <View style={[globalStyles.premiumCard, profileStyles.profileHeroCard]}>
      <TouchableOpacity style={profileStyles.heroButton} onPress={onNavigateToSettings}>
        <Image source={SettingsIcon} style={globalStyles.primaryIcon} />
      </TouchableOpacity>
      <TouchableOpacity style={profileStyles.heroHelpButton} onPress={onOpenOnboarding}>
        <Text style={profileStyles.heroHelpButtonText}>?</Text>
      </TouchableOpacity>
      <TouchableOpacity style={profileStyles.heroNotificationButton} onPress={onOpenNotifications}>
        <Ionicons name="notifications-outline" size={18} color={theme.colors.primary} />
        {unreadNotificationCount > 0 && (
          <View style={profileStyles.heroFriendsBadge}>
            <Text style={profileStyles.heroFriendsBadgeText}>
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={profileStyles.heroButtonRight} onPress={onNavigateToFriends}>
        <Image source={FriendsIcon} style={profileStyles.heroFriendsIcon} />
        {incomingFriendRequestCount > 0 && (
          <View style={profileStyles.heroFriendsBadge}>
            <Text style={profileStyles.heroFriendsBadgeText}>
              {incomingFriendRequestCount > 9 ? '9+' : incomingFriendRequestCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={profileStyles.profileImageContainer}>
        <Image source={profileImageSource} style={[globalStyles.circularImage, profileStyles.profileImage]} />
        <TouchableOpacity style={profileStyles.editProfileImageButton} onPress={onOpenImageModal}>
          <Image source={PencilIcon} style={globalStyles.primaryIcon} />
        </TouchableOpacity>
      </View>

      <Text style={[globalStyles.largeBoldText, profileStyles.profileName]}>{displayName}</Text>
      <Text style={[globalStyles.secondaryText, globalStyles.betSelectionHintText]}>{username}</Text>
    </View>
  </View>
  );
};

export default ProfileHeaderSection;
