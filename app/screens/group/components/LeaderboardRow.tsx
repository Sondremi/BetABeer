import React from 'react';
import { Image, Text, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import type { MemberDrinkStats } from '../../../types/drinkTypes';

type LeaderboardRowProps = {
  item: MemberDrinkStats;
  index: number;
  leaderboardView: 'betsWon' | 'drinkStats' | 'bac';
  defaultProfilePicture: any;
  getMemberName: (member: Pick<MemberDrinkStats, 'name' | 'username'>) => string;
  getMemberUsernameLabel: (member: Pick<MemberDrinkStats, 'username'>) => string;
};

const LeaderboardRow = ({
  item,
  index,
  leaderboardView,
  defaultProfilePicture,
  getMemberName,
  getMemberUsernameLabel,
}: LeaderboardRowProps) => {
  const totalReceived = Object.values(item.drinksToConsume).reduce((sum, drinkTypeObj) => {
    return sum + Object.values(drinkTypeObj || {}).reduce((s, v) => s + (v || 0), 0);
  }, 0);

  const totalDistributed = Object.values(item.drinksToDistribute).reduce((sum, drinkTypeObj) => {
    return sum + Object.values(drinkTypeObj || {}).reduce((s, v) => s + (v || 0), 0);
  }, 0);

  const rank = index + 4;

  return (
    <View style={groupStyles.leaderboardRow}>
      <View style={groupStyles.leaderboardRankBadge}>
        <Text style={groupStyles.leaderboardRankText}>#{rank}</Text>
      </View>

      <Image
        source={item.profilePicture || defaultProfilePicture}
        style={[globalStyles.circularImage, groupStyles.leaderboardListAvatar]}
      />

      <View style={globalStyles.searchInputShell}>
        <Text style={[groupStyles.wagerUser, groupStyles.leaderboardMemberName]} numberOfLines={1}>
          {getMemberName(item)}
        </Text>
        {leaderboardView === 'betsWon' ? (
          <Text style={[globalStyles.secondaryText, globalStyles.detailedMemberSubtext]}>
            {getMemberUsernameLabel(item)}
          </Text>
        ) : (
          <Text style={[globalStyles.secondaryText, globalStyles.detailedMemberSubtext]}>
            {getMemberUsernameLabel(item)} • {totalReceived} mottatt, {totalDistributed} tilgjengelig
          </Text>
        )}
      </View>

      <View style={[groupStyles.leaderboardStatsCard, leaderboardView === 'betsWon' && groupStyles.leaderboardStatsCardWide]}>
        {leaderboardView === 'betsWon' ? (
          <View style={globalStyles.leaderboardStatsRow}>
            <View style={globalStyles.leaderboardStatColumn}>
              <Text style={groupStyles.leaderboardStatLabel}>V</Text>
              <Text style={[groupStyles.leaderboardStatValue, groupStyles.leaderboardStatValueCompact]}>{item.betsWon}</Text>
            </View>
            <View style={globalStyles.leaderboardStatColumn}>
              <Text style={groupStyles.leaderboardStatLabel}>T</Text>
              <Text style={[groupStyles.leaderboardStatValue, groupStyles.leaderboardStatValueCompact]}>{item.betsLost}</Text>
            </View>
          </View>
        ) : (
          <View style={groupStyles.leaderboardCenterAligned}>
            <Text style={[groupStyles.leaderboardStatLabel, groupStyles.leaderboardStatLabelWide]}>TILGJENGELIG</Text>
            <Text style={[groupStyles.leaderboardStatValue, groupStyles.leaderboardStatValueCompact]}>{totalDistributed}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default LeaderboardRow;
