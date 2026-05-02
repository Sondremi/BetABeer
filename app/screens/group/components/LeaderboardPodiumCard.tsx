import React from 'react';
import { Image, Text, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import type { GroupLeaderboardMemberStats } from '../hooks/useLeaderboard';

type LeaderboardPodiumCardProps = {
  imageMissing: any;
  member: GroupLeaderboardMemberStats;
  placement: 1 | 2 | 3;
  mode?: 'betsWon' | 'bac';
  getMemberName: (member: Pick<GroupLeaderboardMemberStats, 'name' | 'username'>) => string;
  getMemberUsernameLabel: (member: Pick<GroupLeaderboardMemberStats, 'username'>) => string;
};

const LeaderboardPodiumCard = ({
  imageMissing,
  member,
  placement,
  mode = 'betsWon',
  getMemberName,
  getMemberUsernameLabel,
}: LeaderboardPodiumCardProps) => {
  const isFirst = placement === 1;
  const accentColor = placement === 1 ? theme.colors.primary : placement === 2 ? theme.colors.silver : theme.colors.bronze;

  const podiumGlowStyle = {
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isFirst ? 0.34 : 0.22,
    shadowRadius: isFirst ? 24 : 14,
    elevation: isFirst ? 10 : 6,
  };

  const avatarGlowStyle = {
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isFirst ? 0.42 : 0.28,
    shadowRadius: isFirst ? 14 : 9,
    elevation: isFirst ? 8 : 5,
  };

  const badgeGlowStyle = {
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: isFirst ? 0.4 : 0.26,
    shadowRadius: isFirst ? 10 : 7,
    elevation: isFirst ? 7 : 4,
  };

  return (
    <View
      style={[
        groupStyles.podiumCardBase,
        isFirst ? groupStyles.podiumCardFirst : groupStyles.podiumCardOther,
        placement === 2 && globalStyles.podiumCardSecondOffset,
        placement === 3 && globalStyles.groupActionIconButton,
        groupStyles.podiumGlassCard,
        podiumGlowStyle,
      ]}
    >
      <View style={[groupStyles.podiumAvatarRing, { borderColor: accentColor }, isFirst && groupStyles.podiumAvatarRingFirst, avatarGlowStyle]}>
        <Image
          source={member.profilePicture || imageMissing}
          style={[
            globalStyles.circularImage,
            isFirst ? groupStyles.podiumAvatarFirst : groupStyles.podiumAvatarOther,
            { borderWidth: 0 },
          ]}
        />
      </View>

      <View style={[groupStyles.podiumPlacementBadge, { backgroundColor: accentColor }, isFirst ? groupStyles.podiumPlacementBadgeFirst : groupStyles.podiumPlacementBadgeOther, badgeGlowStyle]}>
        <Text style={[groupStyles.podiumPlacementText, isFirst ? globalStyles.actionGridButtonText : groupStyles.podiumPlacementTextOther]}>{placement}</Text>
      </View>

      <View style={groupStyles.podiumNameWrap}>
        <Text style={[groupStyles.podiumNameText, isFirst ? globalStyles.modalButtonText : groupStyles.podiumNameTextOther]} numberOfLines={1}>
          {getMemberName(member)}
        </Text>
        <Text style={[globalStyles.secondaryText, globalStyles.detailedMemberSubtext, groupStyles.podiumUsernameText]} numberOfLines={1}>
          {getMemberUsernameLabel(member)}
        </Text>
      </View>

      <View style={[groupStyles.podiumStatsCard, isFirst ? groupStyles.podiumStatsCardFirst : groupStyles.podiumStatsCardOther]}>
        {mode === 'betsWon' ? (
          <View style={globalStyles.leaderboardStatColumn}>
            <Text
              style={[
                globalStyles.amountChipTextSelected,
                isFirst ? groupStyles.podiumStatsValueFirst : groupStyles.podiumStatsValueOther,
                { textShadowColor: accentColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: isFirst ? 12 : 8 },
              ]}
            >
              {member.betsWon}
            </Text>
            <Text style={groupStyles.podiumStatsLabel}>Vunnet</Text>
            <Text style={groupStyles.podiumLossHint}>Tap: {member.betsLost}</Text>
          </View>
        ) : (
          <View style={globalStyles.leaderboardStatColumn}>
            <Text style={groupStyles.podiumStatsLabel}>PROMILLE</Text>
            <Text style={[globalStyles.amountChipTextSelected, isFirst ? groupStyles.podiumStatsValueFirst : groupStyles.podiumStatsValueOther]}>
              {member.currentBAC.toFixed(3)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default LeaderboardPodiumCard;
