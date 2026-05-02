import React from 'react';
import { Text, View } from 'react-native';
import { groupStyles } from '../../../styles/components/groupStyles';
import { globalStyles } from '../../../styles/globalStyles';
import { theme } from '../../../styles/theme';
import type { Bet } from '../../../types/drinkTypes';

type ActiveBetsSectionProps = {
  bets: Bet[];
  userId?: string;
  renderBet: (args: { item: Bet; index: number }) => React.ReactNode;
};

const ActiveBetsSection = ({ bets, userId, renderBet }: ActiveBetsSectionProps) => {
  return (
    <View style={groupStyles.betListSection}>
      <View style={[groupStyles.actionCard, groupStyles.betListCard]}>
        <Text style={globalStyles.sectionTitleLeft}>Aktive bets</Text>
        <Text style={[globalStyles.secondaryText, { marginTop: theme.spacing.xs }]}>Plasser bet, følg status og se resultater samlet her.</Text>
        <View style={{ marginTop: theme.spacing.md }}>
          {bets.map((item) => {
            const isHiddenForCurrentUser = item.hiddenFromUserIds?.includes(userId || '');
            const shouldHideForCurrentUser = isHiddenForCurrentUser && !item.isFinished;
            if (shouldHideForCurrentUser) {
              return (
                <View key={item.id} style={groupStyles.betContainer}>
                  <View style={[globalStyles.contentCard, globalStyles.betSpacing]}>
                    <Text style={groupStyles.betTitle}>Skjult bett</Text>
                    <Text style={groupStyles.betMetaText}>Dette bettet er skjult for deg av oppretteren.</Text>
                  </View>
                </View>
              );
            }

            const originalIndex = bets.findIndex((bet) => bet.id === item.id);
            return <View key={item.id}>{renderBet({ item, index: originalIndex })}</View>;
          })}
        </View>
      </View>
    </View>
  );
};

export default ActiveBetsSection;
